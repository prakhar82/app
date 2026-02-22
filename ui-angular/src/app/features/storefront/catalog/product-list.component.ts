import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {forkJoin} from 'rxjs';
import {CatalogApiService, Product} from '../../../core/api/catalog-api.service';
import {InventoryApiService} from '../../../core/api/inventory-api.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, RouterLink],
  template: `
    <div class="header">
      <h2>Shop Products</h2>
      <button mat-raised-button color="primary" (click)="refresh()">Refresh</button>
    </div>
    <div class="grid">
      <mat-card *ngFor="let p of items" class="item">
        <img [src]="p.imageUrl || 'https://placehold.co/280x170'" [alt]="p.name" />
        <h4>{{p.name}}</h4>
        <p>{{p.category}} / {{p.subcategory}}</p>
        <p class="price">{{p.price | currency:'EUR'}} / {{p.unit}}</p>
        <p class="stock" [class.out]="(p.availableQty ?? 0) <= 0">
          {{ (p.availableQty ?? 0) > 0 ? ('Available: ' + (p.availableQty ?? 0)) : 'Out of stock' }}
        </p>
        <button mat-stroked-button color="primary" [routerLink]="['/app/products', p.id]">View Details</button>
      </mat-card>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .9rem; }
    .item { border-radius: 14px; }
    .item img { width: 100%; height: 96px; object-fit: cover; border-radius: 10px; margin-bottom: .5rem; }
    .item h4 { margin: 0; }
    .item p { margin: .25rem 0; color: #4d6057; }
    .price { font-weight: 700; color: #1f3f35 !important; }
    .stock { font-size: .9rem; }
    .stock.out { color: #b42318; font-weight: 600; }
  `]
})
export class ProductListComponent {
  private catalogApi = inject(CatalogApiService);
  private inventoryApi = inject(InventoryApiService);
  items: Product[] = [];
  constructor() { this.refresh(); }
  refresh(): void {
    forkJoin({
      products: this.catalogApi.listProducts(),
      inventory: this.inventoryApi.listItems()
    }).subscribe(({products, inventory}) => {
      const bySku = new Map(inventory.map(i => [i.sku, i.availableQty]));
      this.items = products.map(p => ({...p, availableQty: bySku.get(p.sku) ?? 0}));
    });
  }
}
