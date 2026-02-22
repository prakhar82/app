import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {Product} from '../../../core/api/catalog-api.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <mat-card class="item">
      <img [src]="product.imageUrl || 'https://placehold.co/360x220'" [alt]="product.name" />
      <h4>{{product.name}}</h4>
      <p class="meta">{{product.category}} / {{product.subcategory}}</p>
      <p class="price">{{product.price | currency:'EUR':'symbol':'1.2-2'}} / {{product.unit}}</p>
      <p class="stock" [class.out]="availableQty <= 0">
        {{ availableQty > 0 ? ('Available: ' + availableQty) : 'Out of stock' }}
      </p>

      <div class="qty-row">
        <button mat-icon-button type="button" (click)="decrease()" [disabled]="quantity <= 1">
          <mat-icon>remove</mat-icon>
        </button>
        <mat-form-field appearance="outline" class="qty-field">
          <input matInput type="number" min="1" [max]="availableQty" [(ngModel)]="quantity" (ngModelChange)="normalizeQty()" />
        </mat-form-field>
        <button mat-icon-button type="button" (click)="increase()" [disabled]="quantity >= availableQty">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <div class="actions">
        <button mat-raised-button color="primary"
                [disabled]="availableQty <= 0"
                (click)="add.emit({product, quantity})">
          Add to Cart
        </button>
        <button mat-stroked-button [routerLink]="['/app/products', product.id]">View Details</button>
      </div>
    </mat-card>
  `,
  styles: [`
    .item { border-radius: 14px; display: flex; flex-direction: column; gap: .35rem; height: 100%; }
    .item img { width: 100%; height: 150px; object-fit: cover; border-radius: 10px; }
    h4 { margin: .2rem 0 0; }
    .meta { margin: 0; color: #5a7068; font-size: .88rem; }
    .price { margin: 0; font-weight: 700; color: #203f35; }
    .stock { margin: 0; font-size: .88rem; }
    .stock.out { color: #b42318; font-weight: 600; }
    .qty-row { display: flex; align-items: center; gap: .35rem; }
    .qty-field { width: 88px; }
    .actions { display: flex; gap: .45rem; margin-top: auto; flex-wrap: wrap; }
  `]
})
export class ProductCardComponent {
  @Input({required: true}) product!: Product;
  @Input() quantity = 1;
  @Output() quantityChange = new EventEmitter<number>();
  @Output() add = new EventEmitter<{product: Product; quantity: number}>();

  get availableQty(): number {
    return Math.max(0, Number(this.product.availableQty ?? 0));
  }

  increase(): void {
    this.quantity = Math.min(this.availableQty || 1, this.quantity + 1);
    this.quantityChange.emit(this.quantity);
  }

  decrease(): void {
    this.quantity = Math.max(1, this.quantity - 1);
    this.quantityChange.emit(this.quantity);
  }

  normalizeQty(): void {
    const parsed = Number(this.quantity);
    if (!Number.isFinite(parsed) || parsed < 1) {
      this.quantity = 1;
    } else if (this.availableQty > 0) {
      this.quantity = Math.min(this.availableQty, Math.floor(parsed));
    } else {
      this.quantity = 1;
    }
    this.quantityChange.emit(this.quantity);
  }
}
