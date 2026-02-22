import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import {CatalogCategoryOption, CatalogSubcategoryOption} from '../../../core/api/catalog-api.service';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatExpansionModule
  ],
  template: `
    <ng-container *ngIf="mobile; else desktop">
      <mat-accordion>
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Filters</mat-panel-title>
          </mat-expansion-panel-header>
          <form [formGroup]="form" class="panel-body">
            <ng-container *ngTemplateOutlet="content"></ng-container>
          </form>
        </mat-expansion-panel>
      </mat-accordion>
    </ng-container>

    <ng-template #desktop>
      <form [formGroup]="form" class="panel-body sticky">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </form>
    </ng-template>

    <ng-template #content>
      <div class="section">
        <h4>Category</h4>
        <mat-checkbox *ngFor="let c of categories"
                      [checked]="isCategorySelected(c.id)"
                      (change)="toggleCategory(c.id, $event.checked)">
          {{c.name}}
        </mat-checkbox>
      </div>

      <div class="section">
        <h4>Subcategory</h4>
        <mat-checkbox *ngFor="let s of visibleSubcategories"
                      [checked]="isSubcategorySelected(s.id)"
                      (change)="toggleSubcategory(s.id, $event.checked)">
          {{s.name}}
        </mat-checkbox>
      </div>

      <div class="section price-row">
        <h4>Price (EUR)</h4>
        <input class="range" type="range" min="0" [max]="priceCeiling" [value]="selectedMaxPrice" (input)="onPriceDrag($event)" />
        <p class="price-value">Up to {{selectedMaxPrice | currency:'EUR':'symbol':'1.0-0'}}</p>
      </div>

      <div class="section">
        <h4>Availability</h4>
        <mat-checkbox formControlName="stock">In stock only</mat-checkbox>
      </div>

      <button mat-stroked-button color="primary" type="button" (click)="clear.emit()">Clear all</button>
    </ng-template>
  `,
  styles: [`
    .panel-body { display: flex; flex-direction: column; gap: 1rem; }
    .sticky { position: sticky; top: 82px; }
    .section { display: flex; flex-direction: column; gap: .4rem; padding-bottom: .7rem; border-bottom: 1px solid #e5ece7; }
    .section h4 { margin: 0; font-size: .95rem; color: #27453c; }
    .range { width: 100%; accent-color: #0f766e; }
    .price-value { margin: 0; color: #1f3f35; font-weight: 600; }
  `]
})
export class ProductFiltersComponent {
  @Input({required: true}) form!: FormGroup;
  @Input() categories: CatalogCategoryOption[] = [];
  @Input() subcategories: CatalogSubcategoryOption[] = [];
  @Input() mobile = false;
  @Input() priceCeiling = 100;
  @Output() clear = new EventEmitter<void>();

  get visibleSubcategories(): CatalogSubcategoryOption[] {
    const selectedCategories = this.selectedCategoryIds;
    if (!selectedCategories.length) {
      return this.subcategories;
    }
    return this.subcategories.filter(s => selectedCategories.includes(s.categoryId));
  }

  get selectedMaxPrice(): number {
    const val = this.form.get('max')?.value;
    if (val === null || val === undefined || Number.isNaN(Number(val))) {
      return this.priceCeiling;
    }
    return Number(val);
  }

  get selectedCategoryIds(): number[] {
    return this.form.get('categories')?.value ?? [];
  }

  private get selectedSubcategoryIds(): number[] {
    return this.form.get('subcategories')?.value ?? [];
  }

  isCategorySelected(id: number): boolean {
    return this.selectedCategoryIds.includes(id);
  }

  isSubcategorySelected(id: number): boolean {
    return this.selectedSubcategoryIds.includes(id);
  }

  toggleCategory(id: number, checked: boolean): void {
    const next = checked
      ? [...this.selectedCategoryIds, id]
      : this.selectedCategoryIds.filter((v: number) => v !== id);
    this.form.patchValue({categories: dedupe(next)});
  }

  toggleSubcategory(id: number, checked: boolean): void {
    const next = checked
      ? [...this.selectedSubcategoryIds, id]
      : this.selectedSubcategoryIds.filter((v: number) => v !== id);
    this.form.patchValue({subcategories: dedupe(next)});
  }

  onPriceDrag(event: Event): void {
    const target = event.target as HTMLInputElement;
    const max = Number(target.value);
    this.form.patchValue({max});
  }
}

function dedupe(values: number[]): number[] {
  return [...new Set(values)];
}
