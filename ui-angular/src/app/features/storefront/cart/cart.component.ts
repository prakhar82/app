import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {Store} from '@ngrx/store';
import {take} from 'rxjs/operators';
import {CartApiService, CartItem} from '../../../core/api/cart-api.service';
import {InventoryApiService} from '../../../core/api/inventory-api.service';
import {CatalogApiService} from '../../../core/api/catalog-api.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, RouterLink],
  template: `
    <h3>Your Cart</h3>
    <p class="hint" *ngIf="items.length === 0">No items in cart yet.</p>

    <div class="scroll-wrap" *ngIf="items.length > 0">
      <mat-card class="row" *ngFor="let item of items">
        <div class="title">{{item.itemName}} <small>({{item.sku}})</small></div>
        <div class="stock">Available: {{availableBySku[item.sku] ?? 0}}</div>
        <div class="price">{{lineTotal(item) | currency:'EUR'}}</div>
        <div class="qty">
          <button mat-stroked-button (click)="decrease(item)" [disabled]="item.quantity <= 1">-</button>
          <span>{{item.quantity}}</span>
          <button mat-stroked-button (click)="increase(item)" [disabled]="item.quantity >= (availableBySku[item.sku] ?? 0)">+</button>
        </div>
        <button mat-button color="warn" (click)="remove(item)">Remove</button>
      </mat-card>
    </div>

    <div class="footer" *ngIf="items.length > 0">
      <strong>Total: {{totalPrice() | currency:'EUR'}}</strong>
      <div class="actions">
        <button mat-raised-button color="primary" routerLink="/app/checkout">Proceed to Checkout</button>
      </div>
    </div>

    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .hint { color: #4d6057; }
    .scroll-wrap { max-height: 55vh; overflow-y: auto; padding-right: .25rem; }
    .row { display: grid; grid-template-columns: 1fr auto auto auto auto; gap: .75rem; align-items: center; margin-bottom: .75rem; }
    .title small { color: #667b71; }
    .qty { display: flex; align-items: center; gap: .5rem; }
    .stock { font-size: .9rem; color: #375247; }
    .price { font-weight: 700; color: #244b3d; }
    .footer { margin-top: .75rem; padding-top: .75rem; border-top: 1px solid #d5e1db; display: flex; justify-content: space-between; align-items: center; }
    .actions { display: flex; gap: .5rem; }
    .error { color: #b42318; }
    @media (max-width: 760px) {
      .row { grid-template-columns: 1fr; }
      .footer { flex-direction: column; gap: .6rem; align-items: flex-start; }
    }
  `]
})
export class CartComponent {
  private store = inject(Store<{auth: {email: string | null}}>);
  private cartApi = inject(CartApiService);
  private inventoryApi = inject(InventoryApiService);
  private catalogApi = inject(CatalogApiService);

  items: CartItem[] = [];
  availableBySku: Record<string, number> = {};
  priceBySku: Record<string, number> = {};
  email = '';
  error = '';

  constructor() {
    this.store.select('auth').pipe(take(1)).subscribe(auth => {
      if (!auth.email) {
        this.error = 'Please login again.';
        return;
      }
      this.email = auth.email;
      this.reload();
    });
  }

  reload(): void {
    this.error = '';
    this.cartApi.list(this.email).subscribe({
      next: (items) => {
        this.items = items;
        const skus = items.map(i => i.sku);
        if (skus.length === 0) {
          this.availableBySku = {};
          this.priceBySku = {};
          return;
        }
        this.catalogApi.listProducts().subscribe(products => {
          this.priceBySku = Object.fromEntries(products.map(p => [p.sku, Number(p.price || 0)]));
        });
        this.inventoryApi.availability(skus).subscribe({
          next: (availability) => {
            this.availableBySku = availability;
          },
          error: () => {
            this.error = 'Unable to fetch stock availability.';
          }
        });
      },
      error: () => {
        this.error = 'Unable to load cart.';
      }
    });
  }

  increase(item: CartItem): void {
    const available = this.availableBySku[item.sku] ?? 0;
    if (item.quantity >= available) {
      return;
    }
    this.updateQuantity(item, item.quantity + 1);
  }

  decrease(item: CartItem): void {
    if (item.quantity <= 1) {
      return;
    }
    this.updateQuantity(item, item.quantity - 1);
  }

  remove(item: CartItem): void {
    this.cartApi.delete(this.email, item.sku).subscribe({
      next: () => this.reload(),
      error: (err) => this.error = err?.error?.message || 'Unable to remove item.'
    });
  }

  private updateQuantity(item: CartItem, quantity: number): void {
    this.cartApi.upsert({
      userEmail: this.email,
      sku: item.sku,
      itemName: item.itemName,
      quantity
    }).subscribe({
      next: () => this.reload(),
      error: (err) => this.error = err?.error?.message || 'Unable to update quantity.'
    });
  }

  lineTotal(item: CartItem): number {
    return (this.priceBySku[item.sku] ?? 0) * item.quantity;
  }

  totalPrice(): number {
    return this.items.reduce((sum, item) => sum + this.lineTotal(item), 0);
  }
}
