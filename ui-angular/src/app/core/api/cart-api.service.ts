import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface CartItem {
  id: number;
  userEmail: string;
  sku: string;
  itemName: string;
  quantity: number;
}

@Injectable({providedIn: 'root'})
export class CartApiService {
  private readonly http = inject(HttpClient);

  list(userEmail: string): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${environment.apiBaseUrl}/cart/cart/${encodeURIComponent(userEmail)}`);
  }

  upsert(request: {userEmail: string; sku: string; itemName: string; quantity: number}): Observable<CartItem | null> {
    return this.http.post<CartItem | null>(`${environment.apiBaseUrl}/cart/cart/items`, request);
  }

  delete(userEmail: string, sku: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/cart/cart/${encodeURIComponent(userEmail)}/${encodeURIComponent(sku)}`);
  }
}
