import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  price: number;
  discountPercent?: number;
  taxPercent?: number;
  unit: string;
  imageUrl?: string;
  description?: string;
  availableQty?: number;
}

@Injectable({providedIn: 'root'})
export class CatalogApiService {
  private readonly http = inject(HttpClient);

  listProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiBaseUrl}/catalog/catalog/products`);
  }

  listAdminProducts(query?: string): Observable<Product[]> {
    const suffix = query && query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    return this.http.get<Product[]>(`${environment.apiBaseUrl}/catalog/catalog/admin/products${suffix}`);
  }

  updateProduct(id: number, request: {
    name: string;
    price: number;
    taxPercent: number;
    discountPercent?: number;
    unit: string;
    description?: string;
    imageUrl?: string;
  }): Observable<Product> {
    return this.http.patch<Product>(`${environment.apiBaseUrl}/catalog/catalog/admin/products/${id}`, request);
  }

  uploadProductImage(id: number, file: File): Observable<Product> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Product>(`${environment.apiBaseUrl}/catalog/catalog/admin/products/${id}/image`, form);
  }
}
