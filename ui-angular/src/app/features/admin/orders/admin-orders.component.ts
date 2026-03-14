import {Component, ElementRef, ViewChild, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatTabChangeEvent, MatTabsModule} from '@angular/material/tabs';
import {Order, OrderApiService} from '../../../core/api/order-api.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatPaginatorModule, MatTabsModule],
  template: `
    <h3>Orders Management</h3>
    <p class="muted">Keep live orders separate from rejected items and completed history so tracking is faster.</p>

    <div class="summary">
      <button type="button" class="summary-card" [class.active]="selectedTabIndex === 0" (click)="selectTab(0)">
        <strong>{{activeOrders().length}}</strong>
        <span>Active Orders</span>
      </button>
      <button type="button" class="summary-card" [class.active]="selectedTabIndex === 1" (click)="selectTab(1)">
        <strong>{{rejectedOrders().length}}</strong>
        <span>Rejected Orders</span>
      </button>
      <button type="button" class="summary-card" [class.active]="selectedTabIndex === 2" (click)="selectTab(2)">
        <strong>{{historyOrders().length}}</strong>
        <span>Order History</span>
      </button>
    </div>

    <div #tabAnchor></div>
    <mat-tab-group [selectedIndex]="selectedTabIndex" (selectedTabChange)="onTabChange($event)">
      <mat-tab [label]="'Active Orders (' + activeOrders().length + ')'">
        <div class="tab-pane">
          <div class="tab-tools">
            <div class="inline-filters">
              <label>
                Sort
                <select [(ngModel)]="activeSort" (ngModelChange)="resetActivePage()">
                  <option value="price-desc">Highest price</option>
                  <option value="price-asc">Lowest price</option>
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                </select>
              </label>
            </div>
            <div class="tool-actions">
              <button mat-stroked-button (click)="reload()">Refresh</button>
            </div>
          </div>
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
                <option *ngFor="let option of statusOptionsFor(order)" [value]="option.value">{{option.label}}</option>
              </select>
              <input
                *ngIf="nextStatusByRef[order.orderRef] === 'REJECTED'"
                class="comment-input"
                placeholder="Reason for rejection"
                [(ngModel)]="commentByRef[order.orderRef]" />
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
                <option value="REJECTED">Rejected</option>
                <option *ngIf="order.paymentMethod === 'COD'" value="COD_PENDING">Cash on Delivery</option>
                <option *ngIf="order.paymentMethod !== 'COD'" value="PENDING_PAYMENT">Payment Pending</option>
                <option *ngIf="order.paymentMethod !== 'COD'" value="CONFIRMED">Payment Confirmed</option>
              </select>
              <input
                *ngIf="nextStatusByRef[order.orderRef] === 'REJECTED'"
                class="comment-input"
                placeholder="Reason for rejection"
                [(ngModel)]="commentByRef[order.orderRef]" />
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
          <div class="tab-tools">
            <div class="inline-filters">
              <label>
                From
                <input type="date" [(ngModel)]="historyFromDate" (ngModelChange)="resetHistoryPage()" />
              </label>
              <label>
                To
                <input type="date" [(ngModel)]="historyToDate" (ngModelChange)="resetHistoryPage()" />
              </label>
            </div>
            <div class="tool-actions">
              <button mat-stroked-button (click)="reload()">Refresh</button>
              <button mat-button (click)="clearHistoryFilters()">Clear</button>
            </div>
          </div>
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
    .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .45rem; margin: .55rem 0 .7rem; }
    .summary-card {
      background: #f3f7f5;
      border: 1px solid #d9e4de;
      border-radius: 10px;
      padding: .42rem .65rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .6rem;
      cursor: pointer;
      text-align: left;
    }
    .summary-card.active { border-color: #0f766e; background: #e7f4ef; }
    .summary-card strong { font-size: 1rem; line-height: 1; color: #17352b; }
    .summary-card span { color: #587067; font-size: .84rem; }
    .tab-pane { padding-top: .8rem; }
    .tab-tools { display: flex; justify-content: space-between; align-items: end; gap: .75rem; flex-wrap: wrap; margin-bottom: .75rem; }
    .inline-filters { display: flex; gap: .65rem; flex-wrap: wrap; align-items: end; }
    .inline-filters label { display: flex; flex-direction: column; gap: .28rem; color: #4f655c; font-size: .9rem; }
    .inline-filters input, .inline-filters select { min-width: 140px; padding: .46rem .55rem; border: 1px solid #cbd8d2; border-radius: 8px; }
    .tool-actions { display: flex; gap: .45rem; flex-wrap: wrap; }
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
      .summary-card { align-items: flex-start; flex-direction: column; gap: .15rem; }
      .tab-tools { align-items: stretch; }
      .inline-filters, .tool-actions { width: 100%; }
      .inline-filters label { flex: 1 1 160px; }
      .status-row { grid-template-columns: 1fr; }
      .head, .line { flex-direction: column; align-items: flex-start; }
      mat-paginator { margin-top: .75rem; }
    }
  `]
})
export class AdminOrdersComponent {
  private orderApi = inject(OrderApiService);
  @ViewChild('tabAnchor') private tabAnchor?: ElementRef<HTMLDivElement>;

  orders: Order[] = [];
  loading = true;
  error = '';
  busyRef = '';
  historyFromDate = '';
  historyToDate = '';
  activeSort: 'price-desc' | 'price-asc' | 'date-desc' | 'date-asc' = 'price-desc';
  selectedTabIndex = 0;
  nextStatusByRef: Record<string, string> = {};
  commentByRef: Record<string, string> = {};
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
    this.clearHistoryFilters();
  }

  clearActiveFilters(): void {
    this.activeSort = 'price-desc';
    this.resetActivePage();
  }

  clearRejectedFilters(): void {
    this.resetRejectedPage();
  }

  clearHistoryFilters(): void {
    this.historyFromDate = '';
    this.historyToDate = '';
    this.resetHistoryPage();
  }

  activeOrders(): Order[] {
    return this.sortActive(this.orders.filter(order =>
      ['PENDING', 'COD_PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'FULFILLING', 'SHIPPED'].includes(order.status)
    ));
  }

  rejectedOrders(): Order[] {
    return this.orders.filter(order => order.status === 'REJECTED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  historyOrders(): Order[] {
    return this.orders.filter(order =>
      ['DELIVERED', 'CANCELED', 'PAYMENT_CANCELLED', 'PAYMENT_FAILED'].includes(order.status)
    ).filter(order => this.matchesHistoryRange(order))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  resetActivePage(): void {
    this.pagination.active.pageIndex = 0;
  }

  resetRejectedPage(): void {
    this.pagination.rejected.pageIndex = 0;
  }

  resetHistoryPage(): void {
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

  statusOptionsFor(order: Order): Array<{value: string; label: string}> {
    if (order.paymentMethod === 'COD') {
      return [
        {value: 'COD_PENDING', label: 'Cash on Delivery'},
        {value: 'REJECTED', label: 'Rejected'}
      ];
    }
    return [
      {value: 'PENDING_PAYMENT', label: 'Payment Pending'},
      {value: 'CONFIRMED', label: 'Payment Confirmed'},
      {value: 'REJECTED', label: 'Rejected'}
    ];
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

  onTabChange(_: MatTabChangeEvent): void {
    this.selectedTabIndex = _.index;
    setTimeout(() => {
      this.tabAnchor?.nativeElement.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 0);
  }

  selectTab(index: number): void {
    this.selectedTabIndex = index;
    setTimeout(() => {
      this.tabAnchor?.nativeElement.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 0);
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

  private matchesHistoryRange(order: Order): boolean {
    return this.matchesRange(order, this.historyFromDate, this.historyToDate);
  }

  private matchesRange(order: Order, fromDate: string, toDate: string): boolean {
    const created = new Date(order.createdAt);
    if (fromDate) {
      const from = new Date(`${fromDate}T00:00:00`);
      if (created < from) {
        return false;
      }
    }
    if (toDate) {
      const to = new Date(`${toDate}T23:59:59`);
      if (created > to) {
        return false;
      }
    }
    return true;
  }
}
