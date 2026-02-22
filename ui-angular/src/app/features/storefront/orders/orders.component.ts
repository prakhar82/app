import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Store} from '@ngrx/store';
import {take} from 'rxjs/operators';
import {forkJoin} from 'rxjs';
import {Order, OrderApiService} from '../../../core/api/order-api.service';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {CartApiService} from '../../../core/api/cart-api.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <h3>My Orders</h3>
    <p class="muted">Track order statuses and totals.</p>

    <p *ngIf="loading">Loading orders...</p>
    <p *ngIf="!loading && orders.length === 0">No orders yet.</p>

    <mat-card class="order" *ngFor="let order of orders">
      <div class="head">
        <div>
          <strong>{{order.orderRef}}</strong>
          <p [class.rejected]="order.status === 'REJECTED'">{{order.status}} | {{order.paymentMethod}}</p>
          <p class="reject-reason" *ngIf="order.status === 'REJECTED' && order.rejectionComment">{{order.rejectionComment}}</p>
        </div>
        <strong>{{order.totalAmount | currency:'EUR'}}</strong>
      </div>
      <div class="items">
        <div class="line" *ngFor="let item of order.items">
          <span>{{item.itemName}} x {{item.quantity}}</span>
          <span>{{item.unitPrice * item.quantity | currency:'EUR'}}</span>
        </div>
      </div>
      <div class="actions" *ngIf="order.status === 'REJECTED'">
        <button mat-raised-button color="warn" (click)="modifyOrder(order)">Modify Order</button>
      </div>
    </mat-card>
    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .muted { color: #4d6057; margin-top: -.25rem; }
    .order { border-radius: 14px; margin-bottom: .75rem; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; }
    .head p { margin: .15rem 0 0; color: #60766c; }
    .head p.rejected { color: #b42318; font-weight: 700; }
    .reject-reason { color: #b42318; font-size: .92rem; margin-top: .25rem; }
    .items { margin-top: .5rem; border-top: 1px solid #d8e3dd; padding-top: .5rem; }
    .line { display: flex; justify-content: space-between; margin: .35rem 0; }
    .actions { margin-top: .5rem; }
    .error { color: #b42318; }
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
      next: () => this.router.navigateByUrl('/app/cart'),
      error: (err) => this.error = err?.error?.message || 'Unable to move rejected order items to cart.'
    });
  }
}
