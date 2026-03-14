import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatTabsModule} from '@angular/material/tabs';
import {Order, OrderApiService} from '../../../core/api/order-api.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatPaginatorModule, MatTabsModule],
  template: `
    <h3>Orders Management</h3>
    <p class="muted">Keep live orders separate from rejected items and completed history so tracking is faster.</p>

    <div class="summary">
      <div class="summary-card">
        <strong>{{activeOrders().length}}</strong>
        <span>Active Orders</span>
      </div>
      <div class="summary-card">
        <strong>{{rejectedOrders().length}}</strong>
        <span>Rejected Orders</span>
      </div>
      <div class="summary-card">
        <strong>{{historyOrders().length}}</strong>
        <span>Order History</span>
      </div>
    </div>

    <div class="filters">
      <label>
        From
        <input type="date" [(ngModel)]="fromDate" (ngModelChange)="resetOrderPages()" />
      </label>
      <label>
        To
        <input type="date" [(ngModel)]="toDate" (ngModelChange)="resetOrderPages()" />
      </label>
      <label>
        Active Sort
        <select [(ngModel)]="activeSort" (ngModelChange)="resetOrderPages()">
          <option value="price-desc">Highest price</option>
          <option value="price-asc">Lowest price</option>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
        </select>
      </label>
      <button mat-stroked-button (click)="reload()">Refresh</button>
      <button mat-button (click)="clearFilters()">Clear Filters</button>
    </div>

    <mat-tab-group>
      <mat-tab [label]="'Active Orders (' + activeOrders().length + ')'">
        <div class="tab-pane">
          <p *ngIf="loading">Loading orders...</p>
          <p *ngIf="!loading && activeOrders().length === 0">No active orders found.</p>
          <div class="page-note" *ngIf="!loading && activeOrders().length > 0">{{pageLabel('active', activeOrders().length)}}</div>
          <mat-card class="order" *ngFor="let order of pagedActiveOrders()" [class.delayed]="isDelayed(order)">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p>{{order.userEmail}} | {{order.userPhone || 'No phone'}} | {{order.paymentMethod}}</p>
                <p>{{order.status}} | {{order.createdAt | date:'medium'}}</p>
              </div>
              <strong>{{order.totalAmount | currency:'EUR'}}</strong>
            </div>

            <div class="alert" *ngIf="isDelayed(order)">Delayed more than 1 day</div>

            <div class="items">
              <div class="line" *ngFor="let item of order.items">
                <span>{{item.itemName}} ({{item.sku}}) x {{item.quantity}}</span>
                <span>{{item.unitPrice * item.quantity | currency:'EUR'}}</span>
              </div>
            </div>

            <div class="status-row">
              <select class="status-select" [(ngModel)]="nextStatusByRef[order.orderRef]">
                <option *ngFor="let status of activeStatusOptions" [value]="status">{{status}}</option>
              </select>
              <input
                class="comment-input"
                placeholder="Reason required for REJECTED"
                [(ngModel)]="commentByRef[order.orderRef]"
                [disabled]="nextStatusByRef[order.orderRef] !== 'REJECTED'" />
              <button mat-raised-button color="primary" (click)="saveStatus(order)" [disabled]="busyRef === order.orderRef">
                {{busyRef === order.orderRef ? 'Saving...' : 'Save'}}
              </button>
            </div>
          </mat-card>
          <mat-paginator *ngIf="!loading && activeOrders().length > 0"
                         [length]="activeOrders().length"
                         [pageIndex]="pagination.active.pageIndex"
                         [pageSize]="pagination.active.pageSize"
                         [pageSizeOptions]="[4, 6, 10]"
                         (page)="onOrdersPage('active', $event)">
          </mat-paginator>
        </div>
      </mat-tab>

      <mat-tab [label]="'Rejected Orders (' + rejectedOrders().length + ')'">
        <div class="tab-pane">
          <p *ngIf="!loading && rejectedOrders().length === 0">No rejected orders found.</p>
          <div class="page-note" *ngIf="!loading && rejectedOrders().length > 0">{{pageLabel('rejected', rejectedOrders().length)}}</div>
          <mat-card class="order rejected" *ngFor="let order of pagedRejectedOrders()">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p>{{order.userEmail}} | {{order.userPhone || 'No phone'}}</p>
                <p>{{order.createdAt | date:'medium'}}</p>
                <p class="reject-comment">Reason: {{order.rejectionComment || 'No reason provided'}}</p>
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
                <option value="REJECTED">REJECTED</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELED">CANCELED</option>
              </select>
              <input
                class="comment-input"
                placeholder="Reason required for REJECTED"
                [(ngModel)]="commentByRef[order.orderRef]"
                [disabled]="nextStatusByRef[order.orderRef] !== 'REJECTED'" />
              <button mat-raised-button color="primary" (click)="saveStatus(order)" [disabled]="busyRef === order.orderRef">
                {{busyRef === order.orderRef ? 'Saving...' : 'Save'}}
              </button>
            </div>
          </mat-card>
          <mat-paginator *ngIf="!loading && rejectedOrders().length > 0"
                         [length]="rejectedOrders().length"
                         [pageIndex]="pagination.rejected.pageIndex"
                         [pageSize]="pagination.rejected.pageSize"
                         [pageSizeOptions]="[4, 6, 10]"
                         (page)="onOrdersPage('rejected', $event)">
          </mat-paginator>
        </div>
      </mat-tab>

      <mat-tab [label]="'Order History (' + historyOrders().length + ')'">
        <div class="tab-pane">
          <p *ngIf="!loading && historyOrders().length === 0">No history orders found.</p>
          <div class="page-note" *ngIf="!loading && historyOrders().length > 0">{{pageLabel('history', historyOrders().length)}}</div>
          <mat-card class="order history" *ngFor="let order of pagedHistoryOrders()">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p>{{order.userEmail}} | {{order.userPhone || 'No phone'}} | {{order.status}}</p>
                <p>{{order.createdAt | date:'medium'}}</p>
              </div>
              <strong>{{order.totalAmount | currency:'EUR'}}</strong>
            </div>
            <div class="items">
              <div class="line" *ngFor="let item of order.items">
                <span>{{item.itemName}} ({{item.sku}}) x {{item.quantity}}</span>
                <span>{{item.unitPrice * item.quantity | currency:'EUR'}}</span>
              </div>
            </div>
          </mat-card>
          <mat-paginator *ngIf="!loading && historyOrders().length > 0"
                         [length]="historyOrders().length"
                         [pageIndex]="pagination.history.pageIndex"
                         [pageSize]="pagination.history.pageSize"
                         [pageSizeOptions]="[4, 6, 10]"
                         (page)="onOrdersPage('history', $event)">
          </mat-paginator>
        </div>
      </mat-tab>
    </mat-tab-group>

    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .muted { color: #587067; margin-top: -.25rem; }
    .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin: .95rem 0 1rem; }
    .summary-card { background: #f3f7f5; border: 1px solid #d9e4de; border-radius: 14px; padding: .9rem 1rem; display: flex; flex-direction: column; gap: .2rem; }
    .summary-card strong { font-size: 1.4rem; line-height: 1; color: #17352b; }
    .summary-card span { color: #587067; }
    .filters { display: flex; gap: .75rem; flex-wrap: wrap; align-items: end; margin: .8rem 0 1rem; }
    .filters label { display: flex; flex-direction: column; gap: .3rem; color: #4f655c; font-size: .92rem; }
    .filters input, .filters select { min-width: 160px; padding: .5rem .6rem; border: 1px solid #cbd8d2; border-radius: 8px; }
    .tab-pane { padding-top: 1rem; }
    .page-note { margin-bottom: .7rem; color: #587067; font-size: .92rem; }
    .order { border-radius: 14px; margin-bottom: .85rem; }
    .order.delayed { border: 2px solid #f59e0b; background: #fff9ec; }
    .order.rejected { border-left: 4px solid #b42318; }
    .order.history { opacity: .96; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .head p { margin: .15rem 0 0; color: #6e8379; }
    .reject-comment { color: #b42318 !important; font-weight: 600; }
    .alert { margin-top: .55rem; color: #9a6700; font-weight: 700; }
    .items { margin-top: .6rem; border-top: 1px solid #d4dfd9; padding-top: .5rem; }
    .line { display: flex; justify-content: space-between; margin: .3rem 0; gap: 1rem; }
    .status-row { margin-top: .7rem; display: grid; grid-template-columns: 180px 1fr auto; gap: .5rem; align-items: center; }
    .status-select, .comment-input { padding: .45rem .55rem; border: 1px solid #cbd8d2; border-radius: 8px; }
    mat-paginator { margin-top: .5rem; border: 1px solid #dde7e1; border-radius: 12px; background: #fbfdfc; }
    .error { color: #b42318; margin-top: .75rem; }
    @media (max-width: 860px) {
      .summary { grid-template-columns: 1fr; }
      .status-row { grid-template-columns: 1fr; }
      .head, .line { flex-direction: column; align-items: flex-start; }
      mat-paginator { margin-top: .75rem; }
    }
  `]
})
export class AdminOrdersComponent {
  private orderApi = inject(OrderApiService);

  orders: Order[] = [];
  loading = true;
  error = '';
  busyRef = '';
  fromDate = '';
  toDate = '';
  activeSort: 'price-desc' | 'price-asc' | 'date-desc' | 'date-asc' = 'price-desc';
  nextStatusByRef: Record<string, string> = {};
  commentByRef: Record<string, string> = {};
  activeStatusOptions = ['PENDING', 'COD_PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'FULFILLING', 'SHIPPED', 'DELIVERED', 'REJECTED', 'CANCELED'];
  pagination = {
    active: {pageIndex: 0, pageSize: 6},
    rejected: {pageIndex: 0, pageSize: 6},
    history: {pageIndex: 0, pageSize: 6}
  };

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
        this.ensureValidPages();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Unable to load orders.';
      }
    });
  }

  clearFilters(): void {
    this.fromDate = '';
    this.toDate = '';
    this.activeSort = 'price-desc';
    this.resetOrderPages();
  }

  activeOrders(): Order[] {
    return this.sortActive(this.filteredOrders().filter(order =>
      ['PENDING', 'COD_PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'FULFILLING', 'SHIPPED'].includes(order.status)
    ));
  }

  rejectedOrders(): Order[] {
    return this.filteredOrders().filter(order => order.status === 'REJECTED');
  }

  historyOrders(): Order[] {
    return this.filteredOrders().filter(order =>
      ['DELIVERED', 'CANCELED', 'PAYMENT_CANCELLED', 'PAYMENT_FAILED'].includes(order.status)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  pagedActiveOrders(): Order[] {
    return this.slicePage(this.activeOrders(), this.pagination.active);
  }

  pagedRejectedOrders(): Order[] {
    return this.slicePage(this.rejectedOrders(), this.pagination.rejected);
  }

  pagedHistoryOrders(): Order[] {
    return this.slicePage(this.historyOrders(), this.pagination.history);
  }

  resetOrderPages(): void {
    this.pagination.active.pageIndex = 0;
    this.pagination.rejected.pageIndex = 0;
    this.pagination.history.pageIndex = 0;
  }

  onOrdersPage(tab: 'active' | 'rejected' | 'history', event: PageEvent): void {
    this.pagination[tab].pageIndex = event.pageIndex;
    this.pagination[tab].pageSize = event.pageSize;
  }

  pageLabel(tab: 'active' | 'rejected' | 'history', total: number): string {
    const state = this.pagination[tab];
    const start = total === 0 ? 0 : state.pageIndex * state.pageSize + 1;
    const end = Math.min(total, (state.pageIndex + 1) * state.pageSize);
    return `Showing ${start}-${end} of ${total}`;
  }

  isDelayed(order: Order): boolean {
    if (!['PENDING', 'COD_PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'FULFILLING', 'SHIPPED'].includes(order.status)) {
      return false;
    }
    const createdAt = new Date(order.createdAt).getTime();
    return (Date.now() - createdAt) > 24 * 60 * 60 * 1000;
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

  private filteredOrders(): Order[] {
    return this.orders.filter(order => {
      const created = new Date(order.createdAt);
      if (this.fromDate) {
        const from = new Date(`${this.fromDate}T00:00:00`);
        if (created < from) {
          return false;
        }
      }
      if (this.toDate) {
        const to = new Date(`${this.toDate}T23:59:59`);
        if (created > to) {
          return false;
        }
      }
      return true;
    });
  }

  private sortActive(orders: Order[]): Order[] {
    const sorted = [...orders];
    switch (this.activeSort) {
      case 'price-asc':
        sorted.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        sorted.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
    }
    return sorted;
  }

  private slicePage<T>(items: T[], state: {pageIndex: number; pageSize: number}): T[] {
    const totalPages = Math.max(1, Math.ceil(items.length / state.pageSize));
    if (state.pageIndex >= totalPages) {
      state.pageIndex = 0;
    }
    const start = state.pageIndex * state.pageSize;
    return items.slice(start, start + state.pageSize);
  }

  private ensureValidPages(): void {
    this.slicePage(this.activeOrders(), this.pagination.active);
    this.slicePage(this.rejectedOrders(), this.pagination.rejected);
    this.slicePage(this.historyOrders(), this.pagination.history);
  }
}
