import {Component, inject} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {CatalogApiService, Product, ProductCreateRequest} from '../../../core/api/catalog-api.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, MatButtonModule, MatCardModule, MatPaginatorModule],
  template: `
    <div class="page-head">
      <h3>Admin Product Management</h3>
      <p class="muted">Edit products inline inside the table. Nothing opens below the page.</p>
    </div>

    <mat-card class="section-card">
      <div class="toolbar">
        <input class="search" type="text" placeholder="Search by name, SKU, or category" [(ngModel)]="query" (keyup.enter)="reload()" />
        <button mat-stroked-button (click)="reload()">Search</button>
        <button mat-button (click)="clear()">Clear</button>
        <span class="spacer"></span>
        <button mat-stroked-button color="primary" (click)="startCreate()" [disabled]="creatingInline">Add Product</button>
      </div>

      <div class="page-note" *ngIf="!loading && products.length > 0">{{productPageLabel()}}</div>

      <div class="table-shell">
        <table class="table desktop-table" *ngIf="products.length > 0 || creatingInline">
          <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th class="act-col">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr class="create-summary selected" *ngIf="creatingInline">
            <td>{{draft.name || 'New product'}}</td>
            <td>{{draft.category || 'Category'}}</td>
            <td>{{(draft.price || 0) | currency:'EUR'}}</td>
            <td class="act-col actions">
              <button mat-button (click)="cancelCreate()">Collapse</button>
            </td>
          </tr>
          <tr class="detail-row" *ngIf="creatingInline">
            <td colspan="4">
              <div class="detail-panel open">
                <div class="detail-head">
                  <strong>Add Product</strong>
                  <button mat-button (click)="cancelCreate()">Close</button>
                </div>

                <div class="detail-grid">
                  <label>SKU
                    <input [(ngModel)]="draft.sku" />
                  </label>
                  <label>Name
                    <input [(ngModel)]="draft.name" />
                  </label>
                  <label>Category
                    <select [(ngModel)]="draft.category" (ngModelChange)="onDraftCategoryChange()">
                      <option value="">Select category</option>
                      <option *ngFor="let category of categoryOptions()" [value]="category">{{category}}</option>
                    </select>
                  </label>
                  <label>Subcategory
                    <select [(ngModel)]="draft.subcategory">
                      <option value="">Select subcategory</option>
                      <option *ngFor="let subcategory of subcategoryOptions(draft.category, draft.subcategory)" [value]="subcategory">{{subcategory}}</option>
                    </select>
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
                    <input [(ngModel)]="draft.unit" />
                  </label>
                  <label class="full">Description
                    <textarea rows="3" [(ngModel)]="draft.description"></textarea>
                  </label>
                  <label class="full">Image URL
                    <input [(ngModel)]="draft.imageUrl" placeholder="https://..." />
                  </label>
                </div>

                <div class="upload-zone">
                  <div>
                    <p class="upload-label">Or upload image from device</p>
                    <input type="file" accept="image/*" (change)="onCreateFileSelected($event)" />
                    <p class="path" *ngIf="createSelectedFile">{{createSelectedFile.name}}</p>
                  </div>
                </div>

                <div class="detail-actions">
                  <button mat-raised-button color="primary" (click)="createProduct()" [disabled]="creating">
                    {{creating ? 'Saving...' : 'Save Product'}}
                  </button>
                  <button mat-button (click)="cancelCreate()">Cancel</button>
                </div>
              </div>
            </td>
          </tr>

          <ng-container *ngFor="let p of pagedProducts()">
            <tr [class.selected]="selected?.id === p.id" (click)="toggleSelection(p)">
              <td>{{p.name}}</td>
              <td>{{p.category}}</td>
              <td>{{p.price | currency:'EUR'}}</td>
              <td class="act-col actions" (click)="$event.stopPropagation()">
                <button mat-button (click)="toggleSelection(p)">{{selected?.id === p.id ? 'Collapse' : 'Edit'}}</button>
                <button mat-button color="warn" (click)="deleteProduct(p)" [disabled]="deletingId === p.id">Delete</button>
              </td>
            </tr>
            <tr class="detail-row" *ngIf="selected?.id === p.id">
              <td colspan="4">
                <div class="detail-panel open">
                  <div class="detail-head">
                    <strong>Edit Product</strong>
                    <button mat-button (click)="closeSelection()">Close</button>
                  </div>

                  <div class="detail-grid">
                    <label>SKU
                      <input [(ngModel)]="edit.sku" disabled />
                    </label>
                    <label>Name
                      <input [(ngModel)]="edit.name" />
                    </label>
                    <label>Category
                      <select [(ngModel)]="edit.category" (ngModelChange)="onEditCategoryChange()">
                        <option value="">Select category</option>
                        <option *ngFor="let category of categoryOptions()" [value]="category">{{category}}</option>
                      </select>
                    </label>
                    <label>Subcategory
                      <select [(ngModel)]="edit.subcategory">
                        <option value="">Select subcategory</option>
                        <option *ngFor="let subcategory of subcategoryOptions(edit.category, edit.subcategory)" [value]="subcategory">{{subcategory}}</option>
                      </select>
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
                    <label class="full">Image URL
                      <input [(ngModel)]="edit.imageUrl" placeholder="https://..." />
                    </label>
                  </div>

                  <div class="upload-zone">
                    <img [src]="edit.imageUrl || selected?.imageUrl || 'https://placehold.co/220x140'" alt="product image" />
                    <div>
                      <p class="upload-label">Or upload image from device</p>
                      <input type="file" accept="image/*" (change)="onEditFileSelected($event)" />
                      <p class="path">{{editSelectedFile?.name || edit.imageUrl || selected?.imageUrl || 'No image set'}}</p>
                    </div>
                  </div>

                  <div class="detail-actions">
                    <button mat-stroked-button (click)="uploadEditImage()" [disabled]="!editSelectedFile || savingImage">
                      {{savingImage ? 'Uploading...' : 'Upload Image'}}
                    </button>
                    <button mat-raised-button color="primary" (click)="saveDetails()" [disabled]="savingDetails">
                      {{savingDetails ? 'Saving...' : 'Save Changes'}}
                    </button>
                    <button mat-button color="warn" (click)="deleteProduct(p)" [disabled]="deletingId === p.id">Delete</button>
                    <button mat-button (click)="closeSelection()">Close</button>
                  </div>
                </div>
              </td>
            </tr>
          </ng-container>
          </tbody>
        </table>

        <div class="mobile-list" *ngIf="products.length > 0 || creatingInline">
          <article class="mobile-product selected" *ngIf="creatingInline">
            <div class="mobile-head">
              <div>
                <strong>{{draft.name || 'New product'}}</strong>
                <p>{{draft.category || 'Category'}}</p>
              </div>
              <strong>{{(draft.price || 0) | currency:'EUR'}}</strong>
            </div>
            <div class="detail-panel mobile-detail open">
              <div class="detail-head">
                <strong>Add Product</strong>
                <button mat-button (click)="cancelCreate()">Close</button>
              </div>
              <div class="detail-grid">
                <label>SKU
                  <input [(ngModel)]="draft.sku" />
                </label>
                <label>Name
                  <input [(ngModel)]="draft.name" />
                </label>
                <label>Category
                  <select [(ngModel)]="draft.category" (ngModelChange)="onDraftCategoryChange()">
                    <option value="">Select category</option>
                    <option *ngFor="let category of categoryOptions()" [value]="category">{{category}}</option>
                  </select>
                </label>
                <label>Subcategory
                  <select [(ngModel)]="draft.subcategory">
                    <option value="">Select subcategory</option>
                    <option *ngFor="let subcategory of subcategoryOptions(draft.category, draft.subcategory)" [value]="subcategory">{{subcategory}}</option>
                  </select>
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
                  <input [(ngModel)]="draft.unit" />
                </label>
                <label class="full">Description
                  <textarea rows="3" [(ngModel)]="draft.description"></textarea>
                </label>
                <label class="full">Image URL
                  <input [(ngModel)]="draft.imageUrl" placeholder="https://..." />
                </label>
              </div>
              <div class="upload-zone compact">
                <div>
                  <p class="upload-label">Or upload image from device</p>
                  <input type="file" accept="image/*" (change)="onCreateFileSelected($event)" />
                  <p class="path" *ngIf="createSelectedFile">{{createSelectedFile.name}}</p>
                </div>
              </div>
              <div class="detail-actions">
                <button mat-raised-button color="primary" (click)="createProduct()" [disabled]="creating">
                  {{creating ? 'Saving...' : 'Save Product'}}
                </button>
                <button mat-button (click)="cancelCreate()">Cancel</button>
              </div>
            </div>
          </article>

          <article class="mobile-product"
                   *ngFor="let p of pagedProducts()"
                   [class.selected]="selected?.id === p.id">
            <div class="mobile-head" (click)="toggleSelection(p)">
              <div>
                <strong>{{p.name}}</strong>
                <p>{{p.category}}</p>
              </div>
              <strong>{{p.price | currency:'EUR'}}</strong>
            </div>
            <div class="mobile-actions" (click)="$event.stopPropagation()">
              <button mat-button (click)="toggleSelection(p)">{{selected?.id === p.id ? 'Collapse' : 'Edit'}}</button>
              <button mat-button color="warn" (click)="deleteProduct(p)" [disabled]="deletingId === p.id">Delete</button>
            </div>
            <div class="detail-panel mobile-detail open" *ngIf="selected?.id === p.id">
              <div class="detail-head">
                <strong>Edit Product</strong>
                <button mat-button (click)="closeSelection()">Close</button>
              </div>
              <div class="detail-grid">
                <label>SKU
                  <input [(ngModel)]="edit.sku" disabled />
                </label>
                <label>Name
                  <input [(ngModel)]="edit.name" />
                </label>
                <label>Category
                  <select [(ngModel)]="edit.category" (ngModelChange)="onEditCategoryChange()">
                    <option value="">Select category</option>
                    <option *ngFor="let category of categoryOptions()" [value]="category">{{category}}</option>
                  </select>
                </label>
                <label>Subcategory
                  <select [(ngModel)]="edit.subcategory">
                    <option value="">Select subcategory</option>
                    <option *ngFor="let subcategory of subcategoryOptions(edit.category, edit.subcategory)" [value]="subcategory">{{subcategory}}</option>
                  </select>
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
                <label class="full">Image URL
                  <input [(ngModel)]="edit.imageUrl" placeholder="https://..." />
                </label>
              </div>
              <div class="upload-zone compact">
                <div>
                  <p class="upload-label">Or upload image from device</p>
                  <input type="file" accept="image/*" (change)="onEditFileSelected($event)" />
                  <p class="path">{{editSelectedFile?.name || edit.imageUrl || selected?.imageUrl || 'No image set'}}</p>
                </div>
              </div>
              <div class="detail-actions">
                <button mat-stroked-button (click)="uploadEditImage()" [disabled]="!editSelectedFile || savingImage">
                  {{savingImage ? 'Uploading...' : 'Upload Image'}}
                </button>
                <button mat-raised-button color="primary" (click)="saveDetails()" [disabled]="savingDetails">
                  {{savingDetails ? 'Saving...' : 'Save Changes'}}
                </button>
                <button mat-button color="warn" (click)="deleteProduct(p)" [disabled]="deletingId === p.id">Delete</button>
                <button mat-button (click)="closeSelection()">Close</button>
              </div>
            </div>
          </article>
        </div>

        <div class="blank" *ngIf="loading">Loading products...</div>
        <div class="blank" *ngIf="!loading && products.length === 0 && !creatingInline">No products found.</div>
      </div>

      <mat-paginator *ngIf="products.length > 0"
                     [length]="products.length"
                     [pageIndex]="productPageIndex"
                     [pageSize]="productPageSize"
                     [pageSizeOptions]="[6, 8, 12]"
                     (page)="onPage($event)">
      </mat-paginator>
    </mat-card>

    <p class="error" *ngIf="error">{{error}}</p>
    <p class="ok" *ngIf="message">{{message}}</p>
  `,
  styles: [`
    :host { display: block; min-height: 0; overflow: hidden; }
    .page-head { margin-bottom: .7rem; }
    .page-head h3 { margin: 0; }
    .muted { color: #587067; margin: .2rem 0 0; }
    .section-card {
      display: flex;
      flex-direction: column;
      gap: .8rem;
      height: calc(100dvh - 220px);
      min-height: 0;
      overflow: hidden;
      border-radius: 14px;
    }
    .toolbar { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
    .spacer { flex: 1; }
    .search {
      flex: 1;
      min-width: 220px;
      max-width: 420px;
      padding: .5rem .65rem;
      border: 1px solid #cfdad4;
      border-radius: 8px;
      box-sizing: border-box;
    }
    .page-note { margin: -.1rem 0 0; color: #587067; font-size: .92rem; }
    .table-shell {
      flex: 1;
      min-height: 0;
      border: 1px solid #e2ebe6;
      border-radius: 12px;
      background: #fff;
      overflow: auto;
    }
    .table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .table th, .table td {
      padding: .78rem;
      border-bottom: 1px solid #e2ebe6;
      text-align: left;
      vertical-align: top;
    }
    .table thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #f4f9f6;
    }
    .table tr { cursor: pointer; }
    .table tr.selected { background: #eef7f2; }
    .create-summary { cursor: default; }
    .detail-row { cursor: default; }
    .detail-row td { padding: 0; background: #fbfdfc; }
    .detail-panel {
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height .22s ease, opacity .18s ease;
    }
    .detail-panel.open {
      max-height: 1200px;
      opacity: 1;
      padding: 1rem;
    }
    .detail-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: .75rem;
      margin-bottom: .8rem;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .75rem;
    }
    .detail-grid label {
      display: flex;
      flex-direction: column;
      gap: .28rem;
      color: #456458;
      font-size: .9rem;
    }
    .detail-grid input,
    .detail-grid select,
    .detail-grid textarea {
      width: 100%;
      box-sizing: border-box;
      padding: .48rem .56rem;
      border: 1px solid #cfdad4;
      border-radius: 8px;
      background: #fff;
    }
    .detail-grid .full { grid-column: 1 / -1; }
    .upload-zone {
      margin-top: .9rem;
      padding: .85rem;
      border: 1px solid #dce7e1;
      border-radius: 12px;
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: .9rem;
      align-items: start;
      background: #fff;
    }
    .upload-zone.compact { grid-template-columns: 1fr; }
    .upload-zone img {
      width: 220px;
      height: 140px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #d8e4de;
    }
    .upload-label { margin: 0 0 .45rem; color: #456458; font-size: .9rem; }
    .path { margin: .45rem 0 0; color: #6f8278; font-size: .82rem; word-break: break-all; }
    .detail-actions {
      margin-top: .9rem;
      display: flex;
      gap: .6rem;
      flex-wrap: wrap;
    }
    .act-col { width: 170px; }
    .actions {
      display: flex;
      gap: .35rem;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .mobile-list { display: none; padding: .8rem; gap: .8rem; }
    .mobile-product {
      border: 1px solid #dfe8e3;
      border-radius: 12px;
      padding: .85rem;
      background: #fbfdfc;
    }
    .mobile-product.selected { border-color: #91b8a5; background: #eef7f2; }
    .mobile-head { display: flex; justify-content: space-between; gap: .75rem; }
    .mobile-head p { margin: .15rem 0 0; color: #60766c; }
    .mobile-actions { display: flex; gap: .45rem; justify-content: flex-end; flex-wrap: wrap; margin-top: .75rem; }
    .mobile-detail { margin-top: .8rem; }
    .blank { padding: 1rem; color: #587067; }
    mat-paginator {
      border: 1px solid #e2ebe6;
      border-radius: 12px;
      background: #fbfdfc;
    }
    .error { color: #b42318; margin-top: .6rem; }
    .ok { color: #126b2f; margin-top: .6rem; }
    @media (max-width: 900px) {
      .section-card { height: calc(100dvh - 180px); }
      .search { max-width: none; width: 100%; }
      .desktop-table { display: none; }
      .mobile-list { display: grid; }
      .detail-grid { grid-template-columns: 1fr; }
      .upload-zone { grid-template-columns: 1fr; }
      .upload-zone img { width: 100%; max-width: 220px; }
      .detail-actions button { width: 100%; }
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
  creatingInline = false;
  deletingId: number | null = null;
  error = '';
  message = '';
  query = '';
  productPageIndex = 0;
  productPageSize = 8;
  editSelectedFile: File | null = null;
  createSelectedFile: File | null = null;
  draft: ProductCreateRequest = this.emptyDraft();
  edit: ProductCreateRequest = this.emptyDraft();

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
        this.ensureValidPage();
        if (this.selected) {
          const refreshed = products.find(product => product.id === this.selected?.id);
          if (refreshed) {
            this.populateEdit(refreshed);
          } else {
            this.closeSelection();
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
    this.productPageIndex = 0;
    this.reload();
  }

  startCreate(): void {
    this.error = '';
    this.message = '';
    this.closeSelection();
    this.creatingInline = true;
    this.createSelectedFile = null;
    this.draft = this.emptyDraft();
  }

  cancelCreate(): void {
    this.creatingInline = false;
    this.createSelectedFile = null;
    this.draft = this.emptyDraft();
  }

  toggleSelection(product: Product): void {
    if (this.selected?.id === product.id) {
      this.closeSelection();
      return;
    }
    this.creatingInline = false;
    this.populateEdit(product);
  }

  closeSelection(): void {
    this.selected = null;
    this.editSelectedFile = null;
    this.edit = this.emptyDraft();
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
        if (this.createSelectedFile) {
          this.catalogApi.uploadProductImage(product.id, this.createSelectedFile).subscribe({
            next: (updated) => this.finishCreate(updated),
            error: () => this.finishCreate(product, 'Product created, but image upload failed.')
          });
        } else {
          this.finishCreate(product);
        }
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message || 'Unable to create product.';
      }
    });
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
      category: this.edit.category,
      subcategory: this.edit.subcategory,
      price: Number(this.edit.price),
      taxPercent: Number(this.edit.taxPercent),
      discountPercent: Number(this.edit.discountPercent || 0),
      unit: this.edit.unit,
      description: this.blankToUndefined(this.edit.description),
      imageUrl: this.blankToUndefined(this.edit.imageUrl)
    }).subscribe({
      next: (updated) => {
        this.savingDetails = false;
        this.message = 'Product updated successfully.';
        this.populateEdit(updated);
        this.reload();
      },
      error: (err) => {
        this.savingDetails = false;
        this.error = err?.error?.message || 'Unable to update product.';
      }
    });
  }

  uploadEditImage(): void {
    if (!this.selected || !this.editSelectedFile) {
      return;
    }

    this.savingImage = true;
    this.error = '';
    this.message = '';
    this.catalogApi.uploadProductImage(this.selected.id, this.editSelectedFile).subscribe({
      next: (updated) => {
        this.savingImage = false;
        this.editSelectedFile = null;
        this.message = 'Image uploaded successfully.';
        this.populateEdit(updated);
        this.reload();
      },
      error: (err) => {
        this.savingImage = false;
        this.error = err?.error?.message || 'Unable to upload image.';
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
          this.closeSelection();
        }
      },
      error: (err) => {
        this.deletingId = null;
        this.error = err?.error?.message || 'Unable to delete product.';
      }
    });
  }

  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editSelectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  onCreateFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.createSelectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  pagedProducts(): Product[] {
    this.ensureValidPage();
    const start = this.productPageIndex * this.productPageSize;
    return this.products.slice(start, start + this.productPageSize);
  }

  onPage(event: PageEvent): void {
    this.productPageIndex = event.pageIndex;
    this.productPageSize = event.pageSize;
  }

  productPageLabel(): string {
    const total = this.products.length;
    const start = total === 0 ? 0 : this.productPageIndex * this.productPageSize + 1;
    const end = Math.min(total, (this.productPageIndex + 1) * this.productPageSize);
    return `Showing ${start}-${end} of ${total}`;
  }

  private populateEdit(product: Product): void {
    this.selected = product;
    this.editSelectedFile = null;
    this.edit = {
      sku: product.sku || '',
      name: product.name || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      price: Number(product.price || 0),
      discountPercent: Number(product.discountPercent || 0),
      taxPercent: Number(product.taxPercent || 0),
      unit: product.unit || '',
      description: product.description || '',
      imageUrl: product.imageUrl || ''
    };
  }

  private finishCreate(product: Product, message = 'Product added successfully.'): void {
    this.creating = false;
    this.creatingInline = false;
    this.createSelectedFile = null;
    this.message = message;
    this.products = [product, ...this.products];
    this.productPageIndex = 0;
    this.populateEdit(product);
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
    const totalPages = Math.max(1, Math.ceil(this.products.length / this.productPageSize));
    if (this.productPageIndex >= totalPages) {
      this.productPageIndex = 0;
    }
  }

  categoryOptions(): string[] {
    const values = new Set<string>();
    for (const product of this.products) {
      const category = (product.category || '').trim();
      if (category) {
        values.add(category);
      }
    }
    if (this.draft.category?.trim()) {
      values.add(this.draft.category.trim());
    }
    if (this.edit.category?.trim()) {
      values.add(this.edit.category.trim());
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }

  subcategoryOptions(category: string, current?: string): string[] {
    const values = new Set<string>();
    const normalizedCategory = (category || '').trim().toLowerCase();
    for (const product of this.products) {
      if ((product.category || '').trim().toLowerCase() === normalizedCategory) {
        const subcategory = (product.subcategory || '').trim();
        if (subcategory) {
          values.add(subcategory);
        }
      }
    }
    if (current?.trim()) {
      values.add(current.trim());
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }

  onDraftCategoryChange(): void {
    if (!this.subcategoryOptions(this.draft.category, this.draft.subcategory).includes(this.draft.subcategory)) {
      this.draft.subcategory = '';
    }
  }

  onEditCategoryChange(): void {
    if (!this.subcategoryOptions(this.edit.category, this.edit.subcategory).includes(this.edit.subcategory)) {
      this.edit.subcategory = '';
    }
  }
}
