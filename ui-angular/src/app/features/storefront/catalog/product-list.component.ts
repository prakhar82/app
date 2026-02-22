import {Component, inject, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {forkJoin, Subject} from 'rxjs';
import {debounceTime, take, takeUntil} from 'rxjs/operators';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {Store} from '@ngrx/store';
import {
  CatalogApiService,
  CatalogCategoryOption,
  CatalogSubcategoryOption,
  Product
} from '../../../core/api/catalog-api.service';
import {InventoryApiService} from '../../../core/api/inventory-api.service';
import {CartApiService} from '../../../core/api/cart-api.service';
import {ProductFiltersComponent} from './product-filters.component';
import {ProductCardComponent} from './product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    ProductFiltersComponent,
    ProductCardComponent
  ],
  template: `
    <div class="header">
      <div>
        <h2>Shop Products</h2>
        <p class="muted">Apply multiple filters to quickly find what you need.</p>
      </div>
      <button mat-stroked-button (click)="reload()">Refresh</button>
    </div>

    <div class="layout">
      <aside class="filters">
        <app-product-filters
          [form]="filterForm"
          [categories]="categories"
          [subcategories]="subcategories"
          [priceCeiling]="priceCeiling"
          [mobile]="false"
          (clear)="clearAll()"
        />
      </aside>

      <section class="products">
        <div class="mobile-filters">
          <app-product-filters
            [form]="filterForm"
            [categories]="categories"
            [subcategories]="subcategories"
            [priceCeiling]="priceCeiling"
            [mobile]="true"
            (clear)="clearAll()"
          />
        </div>

        <div class="toolbar">
          <mat-chip-set *ngIf="activeChips.length > 0">
            <mat-chip *ngFor="let chip of activeChips" [removable]="true" (removed)="removeChip(chip)">
              {{chip.label}}
              <button matChipRemove type="button">x</button>
            </mat-chip>
          </mat-chip-set>

          <mat-form-field appearance="outline" class="sort">
            <mat-label>Sort by</mat-label>
            <mat-select [value]="sort" (valueChange)="onSortChanged($event)">
              <mat-option value="NEWEST">Newest</mat-option>
              <mat-option value="PRICE_ASC">Price low-high</mat-option>
              <mat-option value="PRICE_DESC">Price high-low</mat-option>
              <mat-option value="NAME_ASC">Name A-Z</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="loader" *ngIf="loading">
          <mat-spinner diameter="36"></mat-spinner>
        </div>

        <ng-container *ngIf="!loading">
          <div class="empty" *ngIf="pagedItems.length === 0">
            <h3>No products match your filters</h3>
            <button mat-stroked-button (click)="clearAll()">Clear all filters</button>
          </div>

          <div class="grid" *ngIf="pagedItems.length > 0">
            <app-product-card *ngFor="let p of pagedItems"
                              [product]="p"
                              [quantity]="getQty(p.id)"
                              (quantityChange)="setQty(p.id, $event)"
                              (add)="addToCart($event.product, $event.quantity)" />
          </div>
        </ng-container>

        <mat-paginator [length]="totalElements"
                       [pageIndex]="pageIndex"
                       [pageSize]="pageSize"
                       [pageSizeOptions]="[8,12,24]"
                       (page)="onPage($event)">
        </mat-paginator>
      </section>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .7rem; }
    .header h2 { margin: 0; }
    .muted { margin: .2rem 0 0; color: #5a7067; }
    .layout { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; align-items: start; }
    .filters { background: #fff; border: 1px solid #e3ece7; border-radius: 12px; padding: .8rem; }
    .products { min-width: 0; }
    .mobile-filters { display: none; margin-bottom: .7rem; }
    .toolbar { display: flex; justify-content: space-between; gap: .6rem; align-items: flex-start; margin-bottom: .6rem; }
    .sort { width: 230px; }
    .loader { min-height: 180px; display: grid; place-items: center; }
    .empty { border: 1px dashed #cddcd4; border-radius: 12px; padding: 1.4rem; text-align: center; color: #4c665b; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .9rem; }
    mat-paginator { margin-top: .7rem; border: 1px solid #e3ece7; border-radius: 10px; }
    @media (max-width: 1080px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .filters { display: none; }
      .mobile-filters { display: block; }
      .toolbar { flex-direction: column; }
      .sort { width: 100%; max-width: 260px; }
      .grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProductListComponent implements OnDestroy {
  private catalogApi = inject(CatalogApiService);
  private inventoryApi = inject(InventoryApiService);
  private cartApi = inject(CartApiService);
  private store = inject(Store<{auth: {email: string | null}}>);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
  private suppressQuerySync = false;

  categories: CatalogCategoryOption[] = [];
  subcategories: CatalogSubcategoryOption[] = [];
  allItems: Product[] = [];
  filteredItems: Product[] = [];
  pagedItems: Product[] = [];
  quantityByProductId: Record<number, number> = {};
  loading = false;

  sort: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC' = 'NEWEST';
  pageIndex = 0;
  pageSize = 12;
  totalElements = 0;
  priceCeiling = 100;

  filterForm = this.fb.group({
    categories: this.fb.nonNullable.control<number[]>([]),
    subcategories: this.fb.nonNullable.control<number[]>([]),
    max: this.fb.control<number | null>(null),
    stock: this.fb.nonNullable.control(false)
  });

  activeChips: Array<{key: string; label: string}> = [];

  constructor() {
    this.hydrateFromQueryParams();
    this.listenFilterChanges();
    this.reload();
  }

  reload(): void {
    forkJoin({
      catalog: this.catalogApi.getCatalogMetadata(),
      inventory: this.inventoryApi.listItems()
    }).subscribe(({catalog, inventory}) => {
      this.loading = true;
      const bySku = new Map(inventory.map(i => [i.sku, i.availableQty ?? 0]));
      this.categories = catalog.categories;
      this.subcategories = catalog.subcategories;
      this.allItems = catalog.products.map(p => ({...p, availableQty: bySku.get(p.sku) ?? 0}));
      this.priceCeiling = Math.max(1, ...this.allItems.map(p => Math.ceil(Number(p.price || 0))));
      if (this.filterForm.controls.max.value === null) {
        this.filterForm.patchValue({max: this.priceCeiling}, {emitEvent: false});
      }
      this.applyFiltersAndPaging();
      this.loading = false;
    });
  }

  private hydrateFromQueryParams(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.suppressQuerySync = true;
      const categories = parseCsvNumbers(params.get('categories'));
      const subcategories = parseCsvNumbers(params.get('subcategories'));
      const max = parseNumber(params.get('max'));
      const stock = params.get('stock') === '1';
      const sort = parseSort(params.get('sort'));
      const page = Math.max(0, Number(params.get('page') || 0));
      const size = Number(params.get('size') || 12);

      this.sort = sort;
      this.pageIndex = Number.isFinite(page) ? page : 0;
      this.pageSize = Number.isFinite(size) && size > 0 ? size : 12;
      this.filterForm.patchValue({
        categories,
        subcategories,
        max,
        stock
      }, {emitEvent: false});
      this.applyFiltersAndPaging();
      this.suppressQuerySync = false;
    });
  }

  private listenFilterChanges(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.sanitizeSubcategorySelection();
        this.pageIndex = 0;
        this.applyFiltersAndPaging();
        this.syncQueryParams();
      });
  }

  onSortChanged(sort: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC'): void {
    this.sort = sort;
    this.pageIndex = 0;
    this.applyFiltersAndPaging();
    this.syncQueryParams();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFiltersAndPaging();
    this.syncQueryParams();
  }

  clearAll(): void {
    this.filterForm.patchValue({
      categories: [],
      subcategories: [],
      max: null,
      stock: false
    });
  }

  removeChip(chip: {key: string; label: string}): void {
    if (chip.key.startsWith('cat:')) {
      const id = Number(chip.key.split(':')[1]);
      const current = this.filterForm.controls.categories.value;
      this.filterForm.patchValue({categories: current.filter(c => c !== id)});
      return;
    }
    if (chip.key.startsWith('sub:')) {
      const id = Number(chip.key.split(':')[1]);
      const current = this.filterForm.controls.subcategories.value;
      this.filterForm.patchValue({subcategories: current.filter(s => s !== id)});
      return;
    }
    if (chip.key === 'stock') {
      this.filterForm.patchValue({stock: false});
      return;
    }
    if (chip.key === 'max') {
      this.filterForm.patchValue({max: null});
    }
  }

  getQty(productId: number): number {
    return this.quantityByProductId[productId] ?? 1;
  }

  setQty(productId: number, qty: number): void {
    this.quantityByProductId[productId] = Math.max(1, Math.floor(Number(qty) || 1));
  }

  addToCart(product: Product, qty: number): void {
    const available = product.availableQty ?? 0;
    if (available <= 0) {
      this.snackBar.open('Item is out of stock.', 'Close', {duration: 2600});
      return;
    }
    if (qty <= 0 || qty > available) {
      this.snackBar.open(`You can add up to ${available}.`, 'Close', {duration: 2600});
      return;
    }

    this.store.select('auth').pipe(take(1)).subscribe(auth => {
      const email = auth.email;
      if (!email) {
        this.snackBar.open('Please login again.', 'Close', {duration: 2600});
        return;
      }

      this.cartApi.list(email).subscribe({
        next: cart => {
          const existing = cart.find(c => c.sku === product.sku);
          const newQty = (existing?.quantity ?? 0) + qty;
          if (newQty > available) {
            this.snackBar.open(`Cart quantity cannot exceed available stock (${available}).`, 'Close', {duration: 3000});
            return;
          }

          this.cartApi.upsert({
            userEmail: email,
            sku: product.sku,
            itemName: product.name,
            quantity: newQty
          }).subscribe({
            next: () => {
              this.quantityByProductId[product.id] = 1;
              this.updateAvailableQty(product.sku, available - qty);
              this.snackBar.open(`${product.name} added to cart`, 'Close', {duration: 2200});
            },
            error: (err) => {
              this.snackBar.open(err?.error?.message || 'Unable to add item to cart.', 'Close', {duration: 3000});
            }
          });
        },
        error: () => this.snackBar.open('Unable to load cart. Try again.', 'Close', {duration: 2800})
      });
    });
  }

  private updateAvailableQty(sku: string, nextAvailable: number): void {
    this.allItems = this.allItems.map(p => p.sku === sku ? {...p, availableQty: Math.max(0, nextAvailable)} : p);
    this.applyFiltersAndPaging();
  }

  private applyFiltersAndPaging(): void {
    let items = [...this.allItems];
    const selectedCategoryIds = this.filterForm.controls.categories.value;
    const selectedSubcategoryIds = this.filterForm.controls.subcategories.value;
    const priceMax = this.filterForm.controls.max.value;
    const inStockOnly = this.filterForm.controls.stock.value;

    const categoryNameById = new Map(this.categories.map(c => [c.id, c.name]));
    const subcategoryById = new Map(this.subcategories.map(s => [s.id, s]));
    const selectedCategoryNames = selectedCategoryIds.map(id => categoryNameById.get(id)).filter(Boolean) as string[];
    const selectedSubcategoryNames = selectedSubcategoryIds.map(id => subcategoryById.get(id)?.name).filter(Boolean) as string[];

    if (selectedCategoryNames.length > 0) {
      items = items.filter(p => selectedCategoryNames.includes(p.category));
    }
    if (selectedSubcategoryNames.length > 0) {
      items = items.filter(p => selectedSubcategoryNames.includes(p.subcategory));
    }
    if (priceMax !== null && priceMax !== undefined) {
      items = items.filter(p => Number(p.price) <= Number(priceMax));
    }
    if (inStockOnly) {
      items = items.filter(p => Number(p.availableQty ?? 0) > 0);
    }

    items = sortProducts(items, this.sort);
    this.filteredItems = items;
    this.totalElements = items.length;

    const from = this.pageIndex * this.pageSize;
    const to = from + this.pageSize;
    this.pagedItems = items.slice(from, to);

    this.activeChips = this.buildChips(categoryNameById, subcategoryById);
  }

  private sanitizeSubcategorySelection(): void {
    const selectedCategories = this.filterForm.controls.categories.value;
    if (!selectedCategories.length) {
      return;
    }
    const allowedSubcategoryIds = new Set(
      this.subcategories.filter(s => selectedCategories.includes(s.categoryId)).map(s => s.id)
    );
    const current = this.filterForm.controls.subcategories.value;
    const next = current.filter(id => allowedSubcategoryIds.has(id));
    if (next.length !== current.length) {
      this.filterForm.patchValue({subcategories: next}, {emitEvent: false});
    }
  }

  private buildChips(categoryNameById: Map<number, string>, subcategoryById: Map<number, CatalogSubcategoryOption>):
    Array<{key: string; label: string}> {
    const chips: Array<{key: string; label: string}> = [];
    this.filterForm.controls.categories.value.forEach(id => {
      const name = categoryNameById.get(id);
      if (name) chips.push({key: `cat:${id}`, label: name});
    });
    this.filterForm.controls.subcategories.value.forEach(id => {
      const entry = subcategoryById.get(id);
      if (entry) chips.push({key: `sub:${id}`, label: entry.name});
    });
    if (this.filterForm.controls.max.value !== null) {
      chips.push({key: 'max', label: `Up to EUR ${this.filterForm.controls.max.value}`});
    }
    if (this.filterForm.controls.stock.value) {
      chips.push({key: 'stock', label: 'In stock only'});
    }
    return chips;
  }

  private syncQueryParams(): void {
    if (this.suppressQuerySync) {
      return;
    }
    const values = this.filterForm.getRawValue();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categories: values.categories.length ? values.categories.join(',') : null,
        subcategories: values.subcategories.length ? values.subcategories.join(',') : null,
        max: values.max,
        stock: values.stock ? 1 : null,
        sort: this.sort,
        page: this.pageIndex,
        size: this.pageSize
      },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

function parseCsvNumbers(value: string | null): number[] {
  if (!value) return [];
  return value.split(',').map(v => Number(v.trim())).filter(v => Number.isFinite(v) && v > 0);
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSort(value: string | null): 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC' {
  if (value === 'PRICE_ASC' || value === 'PRICE_DESC' || value === 'NAME_ASC' || value === 'NEWEST') {
    return value;
  }
  return 'NEWEST';
}

function sortProducts(items: Product[], sort: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC'): Product[] {
  const copy = [...items];
  switch (sort) {
    case 'PRICE_ASC':
      return copy.sort((a, b) => Number(a.price) - Number(b.price));
    case 'PRICE_DESC':
      return copy.sort((a, b) => Number(b.price) - Number(a.price));
    case 'NAME_ASC':
      return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'NEWEST':
    default:
      return copy.sort((a, b) => Number(b.id) - Number(a.id));
  }
}
