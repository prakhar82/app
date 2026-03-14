import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Store} from '@ngrx/store';
import {take} from 'rxjs/operators';
import {forkJoin} from 'rxjs';
import {Order, OrderApiService} from '../../../core/api/order-api.service';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatTabsModule} from '@angular/material/tabs';
import {CartApiService} from '../../../core/api/cart-api.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTabsModule],
  template: `
    <h3>My Orders</h3>
    <p class="muted">Keep active, rejected, and completed orders separate so changes are easier to track.</p>

    <p *ngIf="loading">Loading orders...</p>
    <p *ngIf="!loading && orders.length === 0">No orders yet.</p>

    <mat-tab-group *ngIf="!loading && orders.length > 0">
      <mat-tab [label]="'Active Orders (' + activeOrders().length + ')'">
        <div class="tab-pane">
          <p *ngIf="activeOrders().length === 0">No active orders right now.</p>
          <mat-card class="order" *ngFor="let order of activeOrders()">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p>{{order.status}} | {{order.paymentMethod}}</p>
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
        </div>
      </mat-tab>

      <mat-tab [label]="'Rejected Orders (' + rejectedOrders().length + ')'">
        <div class="tab-pane">
          <p *ngIf="rejectedOrders().length === 0">No rejected orders.</p>
          <mat-card class="order rejected-card" *ngFor="let order of rejectedOrders()">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p class="rejected">{{order.status}} | {{order.paymentMethod}}</p>
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
        </div>
      </mat-tab>

      <mat-tab [label]="'Order History (' + historyOrders().length + ')'">
        <div class="tab-pane">
          <p *ngIf="historyOrders().length === 0">No completed order history yet.</p>
          <mat-card class="order history-card" *ngFor="let order of historyOrders()">
            <div class="head">
              <div>
                <strong>{{order.orderRef}}</strong>
                <p>{{order.status}} | {{order.paymentMethod}}</p>
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
        </div>
      </mat-tab>
    </mat-tab-group>
    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .muted { color: #4d6057; margin-top: -.25rem; }
    .tab-pane { padding-top: .9rem; }
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
    .error { color: #b42318; }
    @media (max-width: 720px) {
      .head, .line { flex-direction: column; align-items: flex-start; gap: .35rem; }
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
    );
  }
}
