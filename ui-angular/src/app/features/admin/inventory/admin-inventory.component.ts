import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {InventoryApiService, InventoryItem} from '../../../core/api/inventory-api.service';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatPaginatorModule],
  template: `
    <h3>Inventory Dashboard</h3>
    <p class="muted">Edit stock inline inside the inventory table, with the same compact flow as products.</p>

    <mat-card class="section-card">
      <div class="toolbar">
        <input class="search" type="text" [(ngModel)]="query" placeholder="Filter by SKU or product name" />
      </div>

      <div class="page-note" *ngIf="filteredItems().length > 0">{{pageLabel()}}</div>

      <div class="scroll-wrap">
        <table class="table desktop-table" *ngIf="filteredItems().length > 0">
          <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Total</th>
            <th>Reserved</th>
            <th>Available</th>
            <th>Threshold</th>
            <th class="act-col">Action</th>
          </tr>
          </thead>
          <tbody>
          <ng-container *ngFor="let item of pagedItems()">
            <tr [class.focus]="item.sku === focusSku || selectedSku === item.sku" (click)="toggleEdit(item)">
              <td>{{item.sku}}</td>
              <td>{{item.productName}}</td>
              <td>{{item.totalQty}}</td>
              <td>{{item.reservedQty}}</td>
              <td>{{item.availableQty}}</td>
              <td>{{item.reorderThreshold}}</td>
              <td class="actions act-col" (click)="$event.stopPropagation()">
                <button mat-button (click)="toggleEdit(item)">{{selectedSku === item.sku ? 'Collapse' : 'Edit'}}</button>
                <button mat-button color="warn" (click)="deleteItem(item)" [disabled]="saving || deletingId === item.id">Delete</button>
              </td>
            </tr>
            <tr class="detail-row" *ngIf="selectedSku === item.sku">
              <td colspan="7">
                <div class="detail-panel open">
                  <div class="detail-head">
                    <strong>Edit Inventory</strong>
                    <button mat-button (click)="cancelEdit()">Close</button>
                  </div>
                  <div class="detail-grid">
                    <label>SKU
                      <input [ngModel]="item.sku" disabled />
                    </label>
                    <label>Product
                      <input [ngModel]="item.productName" disabled />
                    </label>
                    <label>Total Quantity
                      <input type="number" [(ngModel)]="editTotalQty" min="0" />
                    </label>
                    <label>Reserved Quantity
                      <input [ngModel]="item.reservedQty" disabled />
                    </label>
                    <label>Available Quantity
                      <input [ngModel]="availablePreview(item)" disabled />
                    </label>
                    <label>Reorder Threshold
                      <input type="number" [(ngModel)]="editThreshold" min="0" />
                    </label>
                  </div>
                  <div class="detail-actions">
                    <button mat-raised-button color="primary" (click)="saveEdit(item)" [disabled]="saving">
                      {{saving ? 'Saving...' : 'Save Changes'}}
                    </button>
                    <button mat-button color="warn" (click)="deleteItem(item)" [disabled]="saving || deletingId === item.id">Delete</button>
                    <button mat-button (click)="cancelEdit()">Close</button>
                  </div>
                </div>
              </td>
            </tr>
          </ng-container>
          </tbody>
        </table>

        <div class="mobile-list" *ngIf="filteredItems().length > 0">
          <article class="mobile-item"
                   *ngFor="let item of pagedItems()"
                   [class.focus]="item.sku === focusSku || selectedSku === item.sku">
            <div class="mobile-head" (click)="toggleEdit(item)">
              <div>
                <strong>{{item.productName}}</strong>
                <p>{{item.sku}}</p>
              </div>
              <strong>{{item.availableQty}} available</strong>
            </div>
            <div class="mobile-meta">
              <span>Total {{item.totalQty}}</span>
              <span>Reserved {{item.reservedQty}}</span>
              <span>Threshold {{item.reorderThreshold}}</span>
            </div>
            <div class="actions" (click)="$event.stopPropagation()">
              <button mat-button (click)="toggleEdit(item)">{{selectedSku === item.sku ? 'Collapse' : 'Edit'}}</button>
              <button mat-button color="warn" (click)="deleteItem(item)" [disabled]="saving || deletingId === item.id">Delete</button>
            </div>
            <div class="detail-panel open mobile-detail" *ngIf="selectedSku === item.sku">
              <div class="detail-head">
                <strong>Edit Inventory</strong>
                <button mat-button (click)="cancelEdit()">Close</button>
              </div>
              <div class="detail-grid">
                <label>SKU
                  <input [ngModel]="item.sku" disabled />
                </label>
                <label>Product
                  <input [ngModel]="item.productName" disabled />
                </label>
                <label>Total Quantity
                  <input type="number" [(ngModel)]="editTotalQty" min="0" />
                </label>
                <label>Reserved Quantity
                  <input [ngModel]="item.reservedQty" disabled />
                </label>
                <label>Available Quantity
                  <input [ngModel]="availablePreview(item)" disabled />
                </label>
                <label>Reorder Threshold
                  <input type="number" [(ngModel)]="editThreshold" min="0" />
                </label>
              </div>
              <div class="detail-actions">
                <button mat-raised-button color="primary" (click)="saveEdit(item)" [disabled]="saving">
                  {{saving ? 'Saving...' : 'Save Changes'}}
                </button>
                <button mat-button color="warn" (click)="deleteItem(item)" [disabled]="saving || deletingId === item.id">Delete</button>
                <button mat-button (click)="cancelEdit()">Close</button>
              </div>
            </div>
          </article>
        </div>

        <p class="blank" *ngIf="filteredItems().length === 0">No inventory items found.</p>
      </div>

      <mat-paginator *ngIf="filteredItems().length > 0"
                     [length]="filteredItems().length"
                     [pageIndex]="pageIndex"
                     [pageSize]="pageSize"
                     [pageSizeOptions]="[6, 8, 12]"
                     (page)="onPage($event)">
      </mat-paginator>
    </mat-card>

    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    :host { display: block; min-height: 0; overflow: hidden; }
    .muted { color: #5a6f66; }
    .section-card {
      display: flex;
      flex-direction: column;
      gap: .8rem;
      height: calc(100dvh - 220px);
      min-height: 0;
      overflow: hidden;
      border-radius: 14px;
    }
    .toolbar { margin: .15rem 0 0; }
    .search { width: 100%; max-width: 420px; padding: .5rem .6rem; border: 1px solid #cfdad4; border-radius: 8px; box-sizing: border-box; }
    .page-note { margin: -.1rem 0 0; color: #587067; font-size: .92rem; }
    .scroll-wrap { flex: 1; min-height: 0; overflow: auto; border: 1px solid #e1e9e4; border-radius: 12px; background: #fff; }
    .table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .table th, .table td { border-bottom: 1px solid #dbe5df; padding: .68rem; text-align: left; vertical-align: top; }
    .table thead th { position: sticky; top: 0; z-index: 2; background: #f4f9f6; }
    .focus { background: #fff6df; }
    .detail-row td { padding: 0; background: #fbfdfc; }
    .detail-panel {
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height .22s ease, opacity .18s ease;
    }
    .detail-panel.open {
      max-height: 540px;
      opacity: 1;
      padding: 1rem;
    }
    .detail-head { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-bottom: .8rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
    .detail-grid label { display: flex; flex-direction: column; gap: .28rem; color: #456458; font-size: .9rem; }
    .detail-grid input { width: 100%; box-sizing: border-box; padding: .48rem .56rem; border: 1px solid #cfdad4; border-radius: 8px; background: #fff; }
    .detail-actions { margin-top: .9rem; display: flex; gap: .6rem; flex-wrap: wrap; }
    .actions { display: flex; gap: .45rem; flex-wrap: wrap; justify-content: flex-end; }
    .act-col { width: 180px; }
    .mobile-list { display: none; padding: .8rem; gap: .8rem; }
    .mobile-item { border: 1px solid #dfe8e3; border-radius: 12px; padding: .85rem; background: #fbfdfc; }
    .mobile-item.focus { border-color: #e5b74a; background: #fff6df; }
    .mobile-head { display: flex; justify-content: space-between; gap: .75rem; }
    .mobile-head p { margin: .12rem 0 0; color: #60766c; }
    .mobile-meta { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: .65rem; color: #60766c; font-size: .9rem; }
    .mobile-detail { margin-top: .75rem; }
    .blank { padding: 1rem; color: #587067; }
    mat-paginator { border: 1px solid #dde7e1; border-radius: 12px; background: #fbfdfc; }
    .error { color: #b42318; margin-top: .75rem; }
    @media (max-width: 900px) {
      .section-card { height: calc(100dvh - 180px); }
      .desktop-table { display: none; }
      .mobile-list { display: grid; }
      .detail-grid { grid-template-columns: 1fr; }
      .detail-actions button { width: 100%; }
    }
  `]
})
export class AdminInventoryComponent {
  private inventoryApi = inject(InventoryApiService);
  private route = inject(ActivatedRoute);

  items: InventoryItem[] = [];
  focusSku = '';
  error = '';
  saving = false;
  deletingId: number | null = null;
  query = '';
  selectedSku = '';
  pageIndex = 0;
  pageSize = 8;

  editTotalQty = 0;
  editThreshold = 0;

  constructor() {
    this.focusSku = this.route.snapshot.queryParamMap.get('sku') || '';
    this.reload();
  }

  reload(): void {
    this.inventoryApi.listItems().subscribe({
      next: (items) => {
        this.items = items;
        this.ensureValidPage();
      },
      error: (err) => this.error = err?.error?.message || 'Unable to load inventory.'
    });
  }

  toggleEdit(item: InventoryItem): void {
    if (this.selectedSku === item.sku) {
      this.cancelEdit();
      return;
    }
    this.error = '';
    this.selectedSku = item.sku;
    this.editTotalQty = item.totalQty;
    this.editThreshold = item.reorderThreshold;
  }

  cancelEdit(): void {
    this.selectedSku = '';
  }

  saveEdit(item: InventoryItem): void {
    this.error = '';
    if (this.editTotalQty < item.reservedQty) {
      this.error = 'Total quantity cannot be below reserved quantity.';
      return;
    }
    if (this.editThreshold < 0) {
      this.error = 'Threshold cannot be negative.';
      return;
    }

    const delta = this.editTotalQty - item.totalQty;
    this.saving = true;
    this.inventoryApi.adjust({
      sku: item.sku,
      quantityDelta: delta,
      reason: 'MANUAL_EDIT',
      reorderThreshold: this.editThreshold
    }).subscribe({
      next: () => {
        this.saving = false;
        this.selectedSku = '';
        this.reload();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Unable to update inventory.';
      }
    });
  }

  deleteItem(item: InventoryItem): void {
    this.error = '';
    if (!confirm(`Delete inventory item ${item.sku}?`)) {
      return;
    }
    this.deletingId = item.id;
    this.inventoryApi.deleteItem(item.id).subscribe({
      next: () => {
        this.deletingId = null;
        if (this.selectedSku === item.sku) {
          this.selectedSku = '';
        }
        this.reload();
      },
      error: (err) => {
        this.deletingId = null;
        this.error = err?.error?.message || 'Unable to delete inventory item.';
      }
    });
  }

  filteredItems(): InventoryItem[] {
    const q = (this.query || '').trim().toLowerCase();
    if (!q) {
      return this.items;
    }
    return this.items.filter(i =>
      i.sku.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q)
    );
  }

  pagedItems(): InventoryItem[] {
    this.ensureValidPage();
    const start = this.pageIndex * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  pageLabel(): string {
    const total = this.filteredItems().length;
    const start = total === 0 ? 0 : this.pageIndex * this.pageSize + 1;
    const end = Math.min(total, (this.pageIndex + 1) * this.pageSize);
    return `Showing ${start}-${end} of ${total}`;
  }

  availablePreview(item: InventoryItem): number {
    return Math.max(this.editTotalQty - item.reservedQty, 0);
  }

  private ensureValidPage(): void {
    const totalPages = Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize));
    if (this.pageIndex >= totalPages) {
      this.pageIndex = 0;
    }
  }
}
