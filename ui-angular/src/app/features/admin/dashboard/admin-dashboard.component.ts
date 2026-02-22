import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {RouterLink} from '@angular/router';
import {OrderApiService} from '../../../core/api/order-api.service';
import {InventoryApiService, LowStockItem} from '../../../core/api/inventory-api.service';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, RouterLink],
  template: `
    <h2>Admin Dashboard</h2>
    <div class="kpis">
      <mat-card class="kpi"><h4>Total Items Sold</h4><p>{{stats.itemsSold}}</p></mat-card>
      <mat-card class="kpi"><h4>Revenue</h4><p>{{stats.revenue | currency:'EUR'}}</p></mat-card>
      <mat-card class="kpi clickable" routerLink="/admin/orders"><h4>In Process Orders</h4><p>{{stats.inProcess}}</p></mat-card>
      <mat-card class="kpi clickable" routerLink="/admin/inventory"><h4>Low Stock Alerts</h4><p>{{stats.lowStock}}</p></mat-card>
    </div>

    <h3 class="mt">Low Stock Alerts</h3>
    <table class="alert-table" *ngIf="lowStockItems.length > 0">
      <thead>
      <tr><th>SKU</th><th>Product</th><th>Available</th><th>Threshold</th><th>Action</th></tr>
      </thead>
      <tbody>
      <tr *ngFor="let item of lowStockItems">
        <td>{{item.sku}}</td>
        <td>{{item.productName}}</td>
        <td>{{item.availableQty}}</td>
        <td>{{item.thresholdQty}}</td>
        <td><a [routerLink]="['/admin/inventory']" [queryParams]="{sku: item.sku}">Update Inventory</a></td>
      </tr>
      </tbody>
    </table>
    <p *ngIf="lowStockItems.length === 0">No low stock alerts.</p>
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .9rem; }
    .kpi { border-radius: 14px; background: linear-gradient(140deg, #fff, #f6fcf8); }
    .kpi.clickable { cursor: pointer; }
    .kpi h4 { margin: 0; color: #5b7066; font-weight: 600; }
    .kpi p { margin: .5rem 0 0; font-size: 1.6rem; font-weight: 700; color: #1e3f34; }
    .mt { margin-top: 1rem; }
    .alert-table { width: 100%; border-collapse: collapse; }
    .alert-table th, .alert-table td { border-bottom: 1px solid #dbe5df; padding: .55rem; text-align: left; }
  `]
})
export class AdminDashboardComponent {
  private orderApi = inject(OrderApiService);
  private inventoryApi = inject(InventoryApiService);
  stats = {itemsSold: 0, revenue: 0, inProcess: 0, lowStock: 0};
  lowStockItems: LowStockItem[] = [];

  constructor() {
    forkJoin({
      summary: this.orderApi.adminSummary(),
      lowStock: this.inventoryApi.lowStock()
    }).subscribe(({summary, lowStock}) => {
      this.stats.itemsSold = summary.itemsSold;
      this.stats.revenue = summary.revenue;
      this.stats.inProcess = summary.ordersInProcess;
      this.stats.lowStock = lowStock.length;
      this.lowStockItems = lowStock;
    });
  }
}
