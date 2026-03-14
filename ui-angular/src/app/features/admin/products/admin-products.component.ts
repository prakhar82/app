import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {ActivatedRoute} from '@angular/router';
import {CatalogApiService, Product, ProductCreateRequest} from '../../../core/api/catalog-api.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatPaginatorModule],
  template: `
    <h3>Admin Product Management</h3>
    <p class="muted">Create products manually, edit existing products, or remove products directly from this screen.</p>

    <mat-card class="section-card">
      <h4>Manual Product Entry</h4>
      <div class="grid">
        <label>SKU
          <input [(ngModel)]="draft.sku" />
        </label>
        <label>Name
          <input [(ngModel)]="draft.name" />
        </label>
        <label>Category
          <input [(ngModel)]="draft.category" placeholder="Fruits" />
        </label>
        <label>Subcategory
          <input [(ngModel)]="draft.subcategory" placeholder="Citrus" />
        </label>
        <label>Price (EUR)
          <input type="number" min="0" step="0.01" [(ngModel)]="draft.price" />
        </label>
        <label>Tax (%)
          <input type="number" min="0" step="0.01" [(ngModel)]="draft.taxPercent" />
        </label>
        <label>Discount (%)
          <input type="number" min="0" step="0.01" [(ngModel)]="draft.discountPercent" />
        </label>
        <label>Unit
          <input [(ngModel)]="draft.unit" placeholder="kg" />
        </label>
        <label class="full">Description
          <textarea rows="3" [(ngModel)]="draft.description"></textarea>
        </label>
      </div>
      <div class="btn-row">
        <button mat-raised-button color="primary" (click)="createProduct()" [disabled]="creating">
          {{creating ? 'Adding...' : 'Add Product'}}
        </button>
      </div>
    </mat-card>

    <mat-card class="section-card">
      <div class="toolbar">
        <input class="search" type="text" placeholder="Search by name/SKU/category" [(ngModel)]="query" (keyup.enter)="reload()" />
        <button mat-stroked-button (click)="reload()">Search</button>
        <button mat-button (click)="clear()">Clear</button>
      </div>
      <div class="page-note" *ngIf="!loading && products.length > 0">{{productPageLabel()}}</div>

      <div class="scroll-wrap">
        <table class="table desktop-table" *ngIf="products.length > 0">
          <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Category</th>
            <th>Subcategory</th>
            <th>Price</th>
            <th>Tax</th>
            <th>Unit</th>
            <th class="act-col">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let p of pagedProducts()" [class.selected]="selected?.id === p.id">
            <td>{{p.sku}}</td>
            <td>{{p.name}}</td>
            <td>{{p.category}}</td>
            <td>{{p.subcategory}}</td>
            <td>{{p.price | currency:'EUR'}}</td>
            <td>{{p.taxPercent || 0}}%</td>
            <td>{{p.unit || '-'}}</td>
            <td class="act-col actions">
              <button mat-stroked-button color="primary" (click)="select(p)">Edit</button>
              <button mat-button color="warn" (click)="deleteProduct(p)" [disabled]="deletingId === p.id">Delete</button>
            </td>
          </tr>
          </tbody>
        </table>
        <div class="mobile-list" *ngIf="products.length > 0">
          <article class="mobile-product" *ngFor="let p of pagedProducts()" [class.selected]="selected?.id === p.id">
            <div class="mobile-head">
              <div>
                <strong>{{p.name}}</strong>
                <p>{{p.sku}}</p>
              </div>
              <strong>{{p.price | currency:'EUR'}}</strong>
            </div>
            <div class="mobile-meta">
              <span>{{p.category}}</span>
              <span>{{p.subcategory}}</span>
              <span>Tax {{p.taxPercent || 0}}%</span>
              <span>Unit {{p.unit || '-'}}</span>
            </div>
            <div class="actions">
              <button mat-stroked-button color="primary" (click)="select(p)">Edit</button>
              <button mat-button color="warn" (click)="deleteProduct(p)" [disabled]="deletingId === p.id">Delete</button>
            </div>
          </article>
        </div>
        <p *ngIf="!loading && products.length === 0" class="blank">No products found.</p>
        <p *ngIf="loading" class="blank">Loading products...</p>
      </div>
      <mat-paginator *ngIf="products.length > 0"
                     [length]="products.length"
                     [pageIndex]="pageIndex"
                     [pageSize]="pageSize"
                     [pageSizeOptions]="[6, 8, 12]"
                     (page)="onPage($event)">
      </mat-paginator>
    </mat-card>

    <mat-card class="editor-card" *ngIf="selected">
      <h4>Edit Product: {{selected.name}}</h4>
      <div class="grid">
        <label>SKU
          <input [value]="selected.sku" disabled />
        </label>
        <label>Name
          <input [(ngModel)]="edit.name" />
        </label>
        <label>Price (EUR)
          <input type="number" min="0" step="0.01" [(ngModel)]="edit.price" />
        </label>
        <label>Tax (%)
          <input type="number" min="0" step="0.01" [(ngModel)]="edit.taxPercent" />
        </label>
        <label>Discount (%)
          <input type="number" min="0" step="0.01" [(ngModel)]="edit.discountPercent" />
        </label>
        <label>Unit
          <input [(ngModel)]="edit.unit" />
        </label>
        <label class="full">Description
          <textarea rows="3" [(ngModel)]="edit.description"></textarea>
        </label>
      </div>

      <div class="image-zone">
        <img [src]="selected.imageUrl || 'https://placehold.co/220x140'" alt="product image" />
        <div>
          <p class="path">{{selected.imageUrl || 'No image set'}}</p>
          <input type="file" accept="image/*" (change)="onFileSelected($event)" />
          <div class="btn-row">
            <button mat-stroked-button (click)="uploadImage()" [disabled]="!selectedFile || savingImage">
              {{savingImage ? 'Uploading...' : 'Upload Image'}}
            </button>
            <button mat-raised-button color="primary" (click)="saveDetails()" [disabled]="savingDetails">
              {{savingDetails ? 'Saving...' : 'Save Details'}}
            </button>
          </div>
        </div>
      </div>
    </mat-card>

    <p class="error" *ngIf="error">{{error}}</p>
    <p class="ok" *ngIf="message">{{message}}</p>
  `,
  styles: [`
    .muted { color: #587067; margin-top: -.25rem; }
    .section-card, .editor-card { border-radius: 14px; margin-top: .8rem; }
    .toolbar { display: flex; gap: .5rem; margin: .1rem 0 .9rem; align-items: center; }
    .page-note { margin: -.2rem 0 .8rem; color: #587067; font-size: .92rem; }
    .search { flex: 1; max-width: 420px; padding: .5rem .65rem; border: 1px solid #cfdad4; border-radius: 8px; }
    .scroll-wrap { max-height: 52vh; overflow: auto; border: 1px solid #e2ebe6; border-radius: 10px; background: #fff; }
    .table { width: 100%; border-collapse: collapse; min-width: 840px; }
    .table th, .table td { padding: .55rem; border-bottom: 1px solid #e2ebe6; text-align: left; }
    .table thead th { position: sticky; top: 0; background: #f2f8f4; z-index: 1; }
    .table tr.selected { background: #eef7f2; }
    .mobile-list { display: none; padding: .7rem; gap: .7rem; }
    .mobile-product { border: 1px solid #dfe8e3; border-radius: 12px; padding: .85rem; background: #fbfdfc; }
    .mobile-product.selected { border-color: #91b8a5; background: #eef7f2; }
    .mobile-head { display: flex; justify-content: space-between; gap: .75rem; }
    .mobile-head p { margin: .15rem 0 0; color: #60766c; }
    .mobile-meta { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .75rem; }
    .mobile-meta span { background: #eef4f1; border-radius: 999px; padding: .2rem .55rem; font-size: .84rem; color: #355448; }
    .act-col { width: 180px; text-align: center; }
    .actions { display: flex; gap: .35rem; justify-content: center; flex-wrap: wrap; }
    .blank { margin: .8rem; color: #5a7067; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
    .grid label { display: flex; flex-direction: column; gap: .25rem; font-size: .9rem; color: #456458; }
    .grid input, .grid textarea { padding: .45rem .55rem; border: 1px solid #cfdad4; border-radius: 8px; }
    .grid .full { grid-column: 1 / -1; }
    .image-zone { margin-top: .8rem; display: grid; grid-template-columns: 220px 1fr; gap: .9rem; align-items: start; }
    .image-zone img { width: 220px; height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid #d8e4de; }
    .path { font-size: .8rem; color: #6f8278; margin: 0 0 .5rem; word-break: break-all; }
    .btn-row { margin-top: .7rem; display: flex; gap: .6rem; flex-wrap: wrap; }
    mat-paginator { margin-top: .8rem; border: 1px solid #e2ebe6; border-radius: 12px; background: #fbfdfc; }
    .error { color: #b42318; margin-top: .6rem; }
    .ok { color: #126b2f; margin-top: .6rem; }
    @media (max-width: 980px) {
      .grid { grid-template-columns: 1fr; }
      .image-zone { grid-template-columns: 1fr; }
    }
    @media (max-width: 860px) {
      .toolbar { flex-wrap: wrap; }
      .search { max-width: none; width: 100%; }
      .desktop-table { display: none; }
      .mobile-list { display: grid; }
      .scroll-wrap { max-height: none; }
    }
  `]
})
export class AdminProductsComponent {
  private catalogApi = inject(CatalogApiService);
  private route = inject(ActivatedRoute);

  products: Product[] = [];
  selected: Product | null = null;
  loading = false;
  savingDetails = false;
  savingImage = false;
  creating = false;
  deletingId: number | null = null;
  error = '';
  message = '';
  query = '';
  selectedFile: File | null = null;
  pageIndex = 0;
  pageSize = 8;
  draft: ProductCreateRequest = this.emptyDraft();
  edit = {
    name: '',
    price: 0,
    taxPercent: 0,
    discountPercent: 0,
    unit: '',
    description: ''
  };

  constructor() {
    const sku = this.route.snapshot.queryParamMap.get('sku');
    if (sku) {
      this.query = sku;
    }
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.message = '';
    this.pageIndex = 0;
    this.catalogApi.listAdminProducts(this.query).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
        if (this.selected) {
          const refreshed = products.find(p => p.id === this.selected!.id);
          if (refreshed) {
            this.select(refreshed);
          } else {
            this.selected = null;
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Unable to load products.';
      }
    });
  }

  clear(): void {
    this.query = '';
    this.reload();
  }

  select(product: Product): void {
    this.selected = product;
    this.selectedFile = null;
    this.edit = {
      name: product.name || '',
      price: Number(product.price || 0),
      taxPercent: Number(product.taxPercent || 0),
      discountPercent: Number(product.discountPercent || 0),
      unit: product.unit || '',
      description: product.description || ''
    };
  }

  createProduct(): void {
    this.error = '';
    this.message = '';
    if (!this.draft.sku.trim() || !this.draft.name.trim() || !this.draft.category.trim() || !this.draft.subcategory.trim() || !this.draft.unit.trim()) {
      this.error = 'SKU, name, category, subcategory, and unit are required.';
      return;
    }
    this.creating = true;
    this.catalogApi.createProduct({
      ...this.draft,
      sku: this.draft.sku.trim(),
      name: this.draft.name.trim(),
      category: this.draft.category.trim(),
      subcategory: this.draft.subcategory.trim(),
      unit: this.draft.unit.trim(),
      description: this.blankToUndefined(this.draft.description),
      imageUrl: this.blankToUndefined(this.draft.imageUrl),
      price: Number(this.draft.price),
      taxPercent: Number(this.draft.taxPercent),
      discountPercent: Number(this.draft.discountPercent || 0)
    }).subscribe({
      next: (product) => {
        this.creating = false;
        this.message = 'Product added successfully.';
        this.draft = this.emptyDraft();
        this.products = [product, ...this.products];
        this.pageIndex = 0;
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message || 'Unable to create product.';
      }
    });
  }

  deleteProduct(product: Product): void {
    this.error = '';
    this.message = '';
    if (!confirm(`Delete product ${product.sku}?`)) {
      return;
    }
    this.deletingId = product.id;
    this.catalogApi.deleteProduct(product.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.message = 'Product deleted successfully.';
        this.products = this.products.filter(existing => existing.id !== product.id);
        this.ensureValidPage();
        if (this.selected?.id === product.id) {
          this.selected = null;
        }
      },
      error: (err) => {
        this.deletingId = null;
        this.error = err?.error?.message || 'Unable to delete product.';
      }
    });
  }

  pagedProducts(): Product[] {
    this.ensureValidPage();
    const start = this.pageIndex * this.pageSize;
    return this.products.slice(start, start + this.pageSize);
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  productPageLabel(): string {
    const total = this.products.length;
    const start = total === 0 ? 0 : this.pageIndex * this.pageSize + 1;
    const end = Math.min(total, (this.pageIndex + 1) * this.pageSize);
    return `Showing ${start}-${end} of ${total}`;
  }

  saveDetails(): void {
    if (!this.selected) {
      return;
    }
    this.savingDetails = true;
    this.error = '';
    this.message = '';
    this.catalogApi.updateProduct(this.selected.id, {
      name: this.edit.name,
      price: Number(this.edit.price),
      taxPercent: Number(this.edit.taxPercent),
      discountPercent: Number(this.edit.discountPercent || 0),
      unit: this.edit.unit,
      description: this.edit.description,
      imageUrl: this.selected.imageUrl
    }).subscribe({
      next: (updated) => {
        this.savingDetails = false;
        this.message = 'Product updated successfully.';
        this.selected = updated;
        this.reload();
      },
      error: (err) => {
        this.savingDetails = false;
        this.error = err?.error?.message || 'Unable to update product.';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  uploadImage(): void {
    if (!this.selected || !this.selectedFile) {
      return;
    }
    this.savingImage = true;
    this.error = '';
    this.message = '';
    this.catalogApi.uploadProductImage(this.selected.id, this.selectedFile).subscribe({
      next: (updated) => {
        this.savingImage = false;
        this.message = 'Image uploaded successfully.';
        this.selected = updated;
        this.selectedFile = null;
        this.reload();
      },
      error: (err) => {
        this.savingImage = false;
        this.error = err?.error?.message || 'Unable to upload image.';
      }
    });
  }

  private emptyDraft(): ProductCreateRequest {
    return {
      sku: '',
      name: '',
      category: '',
      subcategory: '',
      price: 0,
      discountPercent: 0,
      taxPercent: 0,
      unit: '',
      description: '',
      imageUrl: ''
    };
  }

  private blankToUndefined(value?: string): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed ? trimmed : undefined;
  }

  private ensureValidPage(): void {
    const totalPages = Math.max(1, Math.ceil(this.products.length / this.pageSize));
    if (this.pageIndex >= totalPages) {
      this.pageIndex = 0;
    }
  }
}
