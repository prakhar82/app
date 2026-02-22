import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {CatalogApiService, Product} from '../../../core/api/catalog-api.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule],
  template: `
    <h3>Admin Product Management</h3>
    <p class="muted">Search products, then edit selected product below the table.</p>

    <mat-card class="section-card">
      <div class="toolbar">
        <input class="search" type="text" placeholder="Search by name/SKU/category" [(ngModel)]="query" (keyup.enter)="reload()" />
        <button mat-stroked-button (click)="reload()">Search</button>
        <button mat-button (click)="clear()">Clear</button>
      </div>

      <div class="scroll-wrap">
        <table class="table" *ngIf="products.length > 0">
          <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Price</th>
            <th>Tax</th>
            <th>Unit</th>
            <th class="act-col">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let p of products" [class.selected]="selected?.id === p.id">
            <td>{{p.sku}}</td>
            <td>{{p.name}}</td>
            <td>{{p.price | currency:'EUR'}}</td>
            <td>{{p.taxPercent || 0}}%</td>
            <td>{{p.unit || '-'}}</td>
            <td class="act-col"><button mat-stroked-button color="primary" (click)="select(p)">Edit</button></td>
          </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && products.length === 0" class="blank">No products found.</p>
        <p *ngIf="loading" class="blank">Loading products...</p>
      </div>
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
    .search { flex: 1; max-width: 420px; padding: .5rem .65rem; border: 1px solid #cfdad4; border-radius: 8px; }
    .scroll-wrap { max-height: 52vh; overflow: auto; border: 1px solid #e2ebe6; border-radius: 10px; background: #fff; }
    .table { width: 100%; border-collapse: collapse; min-width: 620px; }
    .table th, .table td { padding: .55rem; border-bottom: 1px solid #e2ebe6; text-align: left; }
    .table thead th { position: sticky; top: 0; background: #f2f8f4; z-index: 1; }
    .table tr.selected { background: #eef7f2; }
    .act-col { width: 120px; text-align: center; }
    .blank { margin: .8rem; color: #5a7067; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
    .grid label { display: flex; flex-direction: column; gap: .25rem; font-size: .9rem; color: #456458; }
    .grid input, .grid textarea { padding: .45rem .55rem; border: 1px solid #cfdad4; border-radius: 8px; }
    .grid .full { grid-column: 1 / -1; }
    .image-zone { margin-top: .8rem; display: grid; grid-template-columns: 220px 1fr; gap: .9rem; align-items: start; }
    .image-zone img { width: 220px; height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid #d8e4de; }
    .path { font-size: .8rem; color: #6f8278; margin: 0 0 .5rem; word-break: break-all; }
    .btn-row { margin-top: .7rem; display: flex; gap: .6rem; flex-wrap: wrap; }
    .error { color: #b42318; margin-top: .6rem; }
    .ok { color: #126b2f; margin-top: .6rem; }
    @media (max-width: 980px) {
      .grid { grid-template-columns: 1fr; }
      .image-zone { grid-template-columns: 1fr; }
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
  error = '';
  message = '';
  query = '';
  selectedFile: File | null = null;
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
    this.catalogApi.listAdminProducts(this.query).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
        if (this.selected) {
          const refreshed = products.find(p => p.id === this.selected!.id);
          if (refreshed) {
            this.select(refreshed);
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
}
