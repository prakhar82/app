import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface InventoryItem {
  id: number;
  sku: string;
  productName: string;
  totalQty: number;
  reservedQty: number;
  availableQty: number;
  reorderThreshold: number;
}

export interface LowStockItem {
  sku: string;
  productName: string;
  availableQty: number;
  thresholdQty: number;
}

@Injectable({providedIn: 'root'})
export class InventoryApiService {
  private readonly http = inject(HttpClient);

  listItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${environment.apiBaseUrl}/inventory/inventory/items`);
  }

  availability(skus: string[]): Observable<Record<string, number>> {
    let params = new HttpParams();
    skus.forEach(sku => {
      params = params.append('sku', sku);
    });
    return this.http.get<Record<string, number>>(`${environment.apiBaseUrl}/inventory/inventory/availability`, {params});
  }

  lowStock(): Observable<LowStockItem[]> {
    return this.http.get<LowStockItem[]>(`${environment.apiBaseUrl}/inventory/inventory/admin/low-stock`);
  }

  adjust(request: {sku: string; quantityDelta: number; reason: string; reorderThreshold?: number | null}): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${environment.apiBaseUrl}/inventory/inventory/admin/adjust`, request);
  }
}
