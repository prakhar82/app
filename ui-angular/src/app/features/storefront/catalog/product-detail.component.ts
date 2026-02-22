import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {forkJoin} from 'rxjs';
import {take} from 'rxjs/operators';
import {CatalogApiService, Product} from '../../../core/api/catalog-api.service';
import {InventoryApiService} from '../../../core/api/inventory-api.service';
import {CartApiService} from '../../../core/api/cart-api.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, ReactiveFormsModule, RouterLink],
  template: `
    <mat-card *ngIf="item" class="detail">
      <img [src]="item.imageUrl || 'https://placehold.co/480x300'" [alt]="item.name" />
      <div>
        <h2>{{item.name}}</h2>
        <p>{{item.description}}</p>
        <p><strong>{{item.price | currency:'EUR'}}</strong> / {{item.unit}}</p>
        <p [class.bad]="item.availableQty <= 0">Available: {{item.availableQty ?? 0}}</p>
        <label>Qty <input type="number" [formControl]="qty" min="1" [max]="item.availableQty ?? 0" /></label>
        <p class="error" *ngIf="error">{{error}}</p>
        <p class="ok" *ngIf="success">{{success}}</p>
        <div class="actions">
          <button mat-raised-button color="primary" [disabled]="(item.availableQty ?? 0) <= 0" (click)="addToCart()">Add to Cart</button>
          <button mat-stroked-button routerLink="/app/cart">Go to Cart</button>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    .detail { display: grid; grid-template-columns: minmax(240px, 320px) 1fr; gap: 1rem; border-radius: 16px; }
    img { width: 100%; border-radius: 12px; object-fit: cover; }
    .bad { color: #a41818; font-weight: 700; }
    .actions { display: flex; gap: .6rem; margin-top: .5rem; }
    .error { color: #b42318; margin: .45rem 0 0; }
    .ok { color: #126b2f; margin: .45rem 0 0; }
    @media (max-width: 860px) { .detail { grid-template-columns: 1fr; } }
  `]
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private catalogApi = inject(CatalogApiService);
  private inventoryApi = inject(InventoryApiService);
  private cartApi = inject(CartApiService);
  private store = inject(Store<{auth: {email: string | null}}>);
  qty = new FormControl(1, { nonNullable: true, validators: [Validators.min(1)] });
  item?: Product;
  error = '';
  success = '';

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    forkJoin({
      products: this.catalogApi.listProducts(),
      inventory: this.inventoryApi.listItems()
    }).subscribe(({products, inventory}) => {
      const found = products.find(p => String(p.id) === id);
      if (!found) {
        return;
      }
      const available = inventory.find(i => i.sku === found.sku)?.availableQty ?? 0;
      this.item = {...found, availableQty: available};
    });
  }

  addToCart(): void {
    this.error = '';
    this.success = '';
    if (!this.item) {
      return;
    }
    const quantity = Number(this.qty.value || 0);
    const available = this.item.availableQty ?? 0;
    if (quantity <= 0) {
      this.error = 'Quantity must be at least 1.';
      return;
    }
    if (quantity > available) {
      this.error = `Only ${available} item(s) available.`;
      return;
    }

    this.store.select('auth').pipe(take(1)).subscribe(auth => {
      const email = auth.email;
      if (!email) {
        this.error = 'Please login again.';
        return;
      }
      this.cartApi.list(email).subscribe(cart => {
        const existing = cart.find(c => c.sku === this.item!.sku);
        const newQty = (existing?.quantity ?? 0) + quantity;
        if (newQty > available) {
          this.error = `Cart qty cannot exceed available stock (${available}).`;
          return;
        }
        this.cartApi.upsert({
          userEmail: email,
          sku: this.item!.sku,
          itemName: this.item!.name,
          quantity: newQty
        }).subscribe({
          next: () => {
            this.item = {...this.item!, availableQty: Math.max(0, available - quantity)};
            this.success = 'Added to cart.';
          },
          error: (err) => {
            this.error = err?.error?.message || 'Unable to add to cart.';
          }
        });
      });
    });
  }
}
