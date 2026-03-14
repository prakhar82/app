import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Store} from '@ngrx/store';
import {take} from 'rxjs/operators';
import {forkJoin} from 'rxjs';
import {Order, OrderApiService} from '../../../core/api/order-api.service';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatTabsModule} from '@angular/material/tabs';
import {CartApiService} from '../../../core/api/cart-api.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatPaginatorModule, MatTabsModule],
  template: `
    <h3>My Orders</h3>
    <p class="muted">Keep active, rejected, and completed orders separate so changes are easier to track.</p>

    <p *ngIf="loading">Loading orders...</p>
    <p *ngIf="!loading && orders.length === 0">No orders yet.</p>

    <mat-tab-group *ngIf="!loading && orders.length > 0">
      <mat-tab [label]="'Active Orders (' + activeOrders().length + ')'">
        <div class="tab-pane">
          <p *ngIf="activeOrders().length === 0">No active orders right now.</p>
          <div class="page-note" *ngIf="activeOrders().length > 0">{{pageLabel('active', activeOrders().length)}}</div>
          <mat-card class="order" *ngFor="let order of pagedActiveOrders()">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p>{{order.status}} | {{order.paymentMethod}}</p>
                <p>{{order.userPhone || 'No phone'}} </p>
                <p>{{order.createdAt | date:'medium'}}</p>
              </div>
              <strong>{{order.totalAmount | currency:'EUR'}}</strong>
            </div>
            <div class="items">
              <div class="line" *ngFor="let item of order.items">
                <span>{{item.itemName}} x {{item.quantity}}</span>
                <span>{{item.unitPrice * item.quantity | currency:'EUR'}}</span>
              </div>
            </div>
          </mat-card>
          <mat-paginator *ngIf="activeOrders().length > 0"
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
          <p *ngIf="rejectedOrders().length === 0">No rejected orders.</p>
          <div class="page-note" *ngIf="rejectedOrders().length > 0">{{pageLabel('rejected', rejectedOrders().length)}}</div>
          <mat-card class="order rejected-card" *ngFor="let order of pagedRejectedOrders()">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p class="rejected">{{order.status}} | {{order.paymentMethod}}</p>
                <p>{{order.userPhone || 'No phone'}}</p>
                <p>{{order.createdAt | date:'medium'}}</p>
                <p class="reject-reason" *ngIf="order.rejectionComment">Reason: {{order.rejectionComment}}</p>
              </div>
              <strong>{{order.totalAmount | currency:'EUR'}}</strong>
            </div>
            <div class="items">
              <div class="line" *ngFor="let item of order.items">
                <span>{{item.itemName}} x {{item.quantity}}</span>
                <span>{{item.unitPrice * item.quantity | currency:'EUR'}}</span>
              </div>
            </div>
            <div class="actions">
              <button mat-raised-button color="warn" (click)="modifyOrder(order)">Modify Order</button>
            </div>
          </mat-card>
          <mat-paginator *ngIf="rejectedOrders().length > 0"
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
          <div class="filters">
            <label>
              From
              <input type="date" [(ngModel)]="historyFromDate" (ngModelChange)="resetHistoryPage()" />
            </label>
            <label>
              To
              <input type="date" [(ngModel)]="historyToDate" (ngModelChange)="resetHistoryPage()" />
            </label>
            <button mat-stroked-button (click)="clearHistoryFilters()">Clear</button>
          </div>
          <p *ngIf="historyOrders().length === 0">No completed order history yet.</p>
          <div class="page-note" *ngIf="historyOrders().length > 0">{{pageLabel('history', historyOrders().length)}}</div>
          <mat-card class="order history-card" *ngFor="let order of pagedHistoryOrders()">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p>{{order.status}} | {{order.paymentMethod}}</p>
                <p>{{order.userPhone || 'No phone'}}</p>
                <p>{{order.createdAt | date:'medium'}}</p>
              </div>
              <strong>{{order.totalAmount | currency:'EUR'}}</strong>
            </div>
            <div class="items">
              <div class="line" *ngFor="let item of order.items">
                <span>{{item.itemName}} x {{item.quantity}}</span>
                <span>{{item.unitPrice * item.quantity | currency:'EUR'}}</span>
              </div>
            </div>
          </mat-card>
          <mat-paginator *ngIf="historyOrders().length > 0"
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
    .muted { color: #4d6057; margin-top: -.25rem; }
    .tab-pane { padding-top: .9rem; }
    .page-note { margin-bottom: .7rem; color: #587067; font-size: .92rem; }
    .filters { display: flex; gap: .75rem; flex-wrap: wrap; align-items: end; margin-bottom: .85rem; }
    .filters label { display: flex; flex-direction: column; gap: .3rem; color: #4f655c; font-size: .92rem; }
    .filters input { min-width: 160px; padding: .5rem .6rem; border: 1px solid #cbd8d2; border-radius: 8px; }
    .order { border-radius: 14px; margin-bottom: .75rem; }
    .rejected-card { border-left: 4px solid #b42318; }
    .history-card { opacity: .96; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; }
    .head p { margin: .15rem 0 0; color: #60766c; }
    .head p.rejected { color: #b42318; font-weight: 700; }
    .reject-reason { color: #b42318; font-size: .92rem; margin-top: .25rem; }
    .items { margin-top: .5rem; border-top: 1px solid #d8e3dd; padding-top: .5rem; }
    .line { display: flex; justify-content: space-between; margin: .35rem 0; }
    .actions { margin-top: .5rem; }
    mat-paginator { margin-top: .5rem; border: 1px solid #dde7e1; border-radius: 12px; background: #fbfdfc; }
    .error { color: #b42318; }
    @media (max-width: 720px) {
      .head, .line { flex-direction: column; align-items: flex-start; gap: .35rem; }
      mat-paginator { margin-top: .75rem; }
    }
  `]
})
export class OrdersComponent {
  private store = inject(Store<{auth: {email: string | null}}>);
  private orderApi = inject(OrderApiService);
  private cartApi = inject(CartApiService);
  private router = inject(Router);

  orders: Order[] = [];
  loading = true;
  email = '';
  error = '';
  historyFromDate = '';
  historyToDate = '';
  pagination = {
    active: {pageIndex: 0, pageSize: 6},
    rejected: {pageIndex: 0, pageSize: 6},
    history: {pageIndex: 0, pageSize: 6}
  };

  constructor() {
    this.store.select('auth').pipe(take(1)).subscribe(auth => {
      const email = auth.email;
      if (!email) {
        this.loading = false;
        return;
      }
      this.email = email;
      this.orderApi.listMyOrders().subscribe({
        next: (mine) => {
          this.orders = mine;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    });
  }

  modifyOrder(order: Order): void {
    this.error = '';
    if (!this.email || order.items.length === 0) {
      return;
    }
    const requests = order.items.map(item => this.cartApi.upsert({
      userEmail: this.email,
      sku: item.sku,
      itemName: item.itemName,
      quantity: item.quantity
    }));
    forkJoin(requests).subscribe({
      next: () => this.router.navigate(['/app/cart'], {queryParams: {retryOrderRef: order.orderRef}}),
      error: (err) => this.error = err?.error?.message || 'Unable to move rejected order items to cart.'
    });
  }

  activeOrders(): Order[] {
    return this.orders.filter(order =>
      ['PENDING', 'COD_PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'FULFILLING', 'SHIPPED'].includes(order.status)
    );
  }

  rejectedOrders(): Order[] {
    return this.orders.filter(order => order.status === 'REJECTED');
  }

  historyOrders(): Order[] {
    return this.orders.filter(order =>
      ['DELIVERED', 'CANCELED', 'PAYMENT_CANCELLED', 'PAYMENT_FAILED'].includes(order.status)
    ).filter(order => this.matchesHistoryRange(order));
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

  clearHistoryFilters(): void {
    this.historyFromDate = '';
    this.historyToDate = '';
    this.resetHistoryPage();
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

  private matchesHistoryRange(order: Order): boolean {
    const created = new Date(order.createdAt);
    if (this.historyFromDate) {
      const from = new Date(`${this.historyFromDate}T00:00:00`);
      if (created < from) {
        return false;
      }
    }
    if (this.historyToDate) {
      const to = new Date(`${this.historyToDate}T23:59:59`);
      if (created > to) {
        return false;
      }
    }
    return true;
  }

  private slicePage<T>(items: T[], state: {pageIndex: number; pageSize: number}): T[] {
    const totalPages = Math.max(1, Math.ceil(items.length / state.pageSize));
    if (state.pageIndex >= totalPages) {
      state.pageIndex = 0;
    }
    const start = state.pageIndex * state.pageSize;
    return items.slice(start, start + state.pageSize);
  }
}
