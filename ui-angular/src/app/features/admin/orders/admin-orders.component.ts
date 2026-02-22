import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {Order, OrderApiService} from '../../../core/api/order-api.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule],
  template: `
    <h3>Orders Management</h3>
    <p class="muted">Update order status and provide rejection comments when needed.</p>

    <p *ngIf="loading">Loading orders...</p>
    <p *ngIf="!loading && orders.length === 0">No orders found.</p>

    <mat-card class="order" *ngFor="let order of orders">
      <div class="head">
        <div>
          <strong>{{order.orderRef}}</strong>
          <p>{{order.userEmail}} | {{order.paymentMethod}} | {{order.status}}</p>
          <p class="reject-comment" *ngIf="order.status === 'REJECTED' && order.rejectionComment">Reason: {{order.rejectionComment}}</p>
        </div>
        <strong>{{order.totalAmount | currency:'EUR'}}</strong>
      </div>

      <div class="items">
        <div class="line" *ngFor="let item of order.items">
          <span>{{item.itemName}} ({{item.sku}}) x {{item.quantity}}</span>
          <span>{{item.unitPrice * item.quantity | currency:'EUR'}}</span>
        </div>
      </div>

      <div class="status-row">
        <select class="status-select" [(ngModel)]="nextStatusByRef[order.orderRef]">
          <option *ngFor="let status of statusOptions" [value]="status">{{status}}</option>
        </select>
        <input
          class="comment-input"
          placeholder="Rejection comment (required for REJECTED)"
          [(ngModel)]="commentByRef[order.orderRef]"
          [disabled]="nextStatusByRef[order.orderRef] !== 'REJECTED'" />
        <button mat-raised-button color="primary" (click)="saveStatus(order)" [disabled]="busyRef === order.orderRef">
          {{busyRef === order.orderRef ? 'Saving...' : 'Save Status'}}
        </button>
      </div>
    </mat-card>

    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .muted { color: #587067; margin-top: -.25rem; }
    .order { border-radius: 14px; margin-bottom: .75rem; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; }
    .head p { margin: .2rem 0 0; color: #6e8379; }
    .reject-comment { color: #b42318 !important; font-weight: 600; }
    .items { margin-top: .5rem; border-top: 1px solid #d4dfd9; padding-top: .5rem; }
    .line { display: flex; justify-content: space-between; margin: .3rem 0; }
    .status-row { margin-top: .65rem; display: grid; grid-template-columns: 180px 1fr auto; gap: .5rem; align-items: center; }
    .status-select, .comment-input { padding: .45rem .55rem; border: 1px solid #cbd8d2; border-radius: 8px; }
    .error { color: #b42318; }
    @media (max-width: 860px) {
      .status-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminOrdersComponent {
  private orderApi = inject(OrderApiService);

  orders: Order[] = [];
  loading = true;
  error = '';
  busyRef = '';
  nextStatusByRef: Record<string, string> = {};
  commentByRef: Record<string, string> = {};
  statusOptions = ['PENDING', 'COD_PENDING', 'CONFIRMED', 'FULFILLING', 'SHIPPED', 'DELIVERED', 'REJECTED', 'CANCELED'];

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.orderApi.listAdminOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
        this.nextStatusByRef = {};
        this.commentByRef = {};
        for (const order of orders) {
          this.nextStatusByRef[order.orderRef] = order.status;
          this.commentByRef[order.orderRef] = order.rejectionComment || '';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Unable to load orders.';
      }
    });
  }

  saveStatus(order: Order): void {
    this.error = '';
    const nextStatus = this.nextStatusByRef[order.orderRef] || order.status;
    const comment = this.commentByRef[order.orderRef] || '';
    if (nextStatus === 'REJECTED' && !comment.trim()) {
      this.error = 'Rejection comment is required.';
      return;
    }

    this.busyRef = order.orderRef;
    this.orderApi.updateOrderStatus(order.orderRef, nextStatus, comment.trim()).subscribe({
      next: () => {
        this.busyRef = '';
        this.reload();
      },
      error: (err) => {
        this.busyRef = '';
        this.error = err?.error?.message || 'Unable to update order status.';
      }
    });
  }
}
