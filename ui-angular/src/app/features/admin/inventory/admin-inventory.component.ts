import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {InventoryApiService, InventoryItem} from '../../../core/api/inventory-api.service';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <h3>Inventory Dashboard</h3>
    <p class="muted">Edit stock and thresholds inline, then save to persist.</p>
    <div class="toolbar">
      <input class="search" type="text" [(ngModel)]="query" placeholder="Filter by SKU or product name" />
    </div>

    <div class="scroll-wrap">
      <table class="table">
        <thead>
        <tr>
          <th>SKU</th>
          <th>Product</th>
          <th>Total Qty</th>
          <th>Reserved</th>
          <th>Available</th>
          <th>Threshold</th>
          <th>Action</th>
        </tr>
        </thead>
        <tbody>
        <tr *ngFor="let item of filteredItems()" [class.focus]="item.sku === focusSku">
          <td>{{item.sku}}</td>
          <td>{{item.productName}}</td>
          <td>
            <ng-container *ngIf="editSku === item.sku; else readonlyQty">
              <input type="number" [(ngModel)]="editTotalQty" min="0" class="edit-input" />
            </ng-container>
            <ng-template #readonlyQty>{{item.totalQty}}</ng-template>
          </td>
          <td>{{item.reservedQty}}</td>
          <td>{{item.availableQty}}</td>
          <td>
            <ng-container *ngIf="editSku === item.sku; else readonlyThreshold">
              <input type="number" [(ngModel)]="editThreshold" min="0" class="edit-input" />
            </ng-container>
            <ng-template #readonlyThreshold>{{item.reorderThreshold}}</ng-template>
          </td>
          <td class="actions">
            <button mat-stroked-button *ngIf="editSku !== item.sku" (click)="startEdit(item)">✎ Edit</button>
            <button mat-raised-button color="primary" *ngIf="editSku === item.sku" (click)="saveEdit(item)" [disabled]="saving">✓ Save</button>
            <button mat-button *ngIf="editSku === item.sku" (click)="cancelEdit()">Cancel</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .muted { color: #5a6f66; }
    .toolbar { margin: .4rem 0 .7rem; }
    .search { width: 100%; max-width: 420px; padding: .5rem .6rem; border: 1px solid #cfdad4; border-radius: 8px; }
    .scroll-wrap { max-height: 62vh; overflow: auto; border: 1px solid #e1e9e4; border-radius: 10px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { border-bottom: 1px solid #dbe5df; padding: .55rem; text-align: left; }
    .focus { background: #fff6df; }
    .actions { display: flex; gap: .5rem; }
    .edit-input { width: 92px; padding: .3rem; }
    .error { color: #b42318; margin-top: .75rem; }
  `]
})
export class AdminInventoryComponent {
  private inventoryApi = inject(InventoryApiService);
  private route = inject(ActivatedRoute);

  items: InventoryItem[] = [];
  focusSku = '';
  error = '';
  saving = false;
  query = '';

  editSku = '';
  editTotalQty = 0;
  editThreshold = 0;

  constructor() {
    this.focusSku = this.route.snapshot.queryParamMap.get('sku') || '';
    this.reload();
  }

  reload(): void {
    this.inventoryApi.listItems().subscribe({
      next: (items) => this.items = items,
      error: (err) => this.error = err?.error?.message || 'Unable to load inventory.'
    });
  }

  startEdit(item: InventoryItem): void {
    this.error = '';
    this.editSku = item.sku;
    this.editTotalQty = item.totalQty;
    this.editThreshold = item.reorderThreshold;
  }

  cancelEdit(): void {
    this.editSku = '';
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
        this.editSku = '';
        this.reload();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Unable to update inventory.';
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
}
