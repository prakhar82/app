import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface CheckoutItemRequest {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface CheckoutRequest {
  paymentMethod: 'COD' | 'ONLINE';
  items: CheckoutItemRequest[];
  addressMode: 'SAVED' | 'NEW';
  addressId?: number;
  saveAddress?: boolean;
  newAddress?: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
}

export interface CheckoutResponse {
  orderRef: string;
  status: string;
  paymentStatus: string;
}

export interface OrderItem {
  sku: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id?: number;
  orderRef: string;
  userEmail: string;
  paymentMethod: string;
  status: string;
  rejectionComment?: string | null;
  totalAmount: number;
  items: OrderItem[];
}

export interface AdminSummary {
  itemsSold: number;
  revenue: number;
  ordersInProcess: number;
}

@Injectable({providedIn: 'root'})
export class OrderApiService {
  private readonly http = inject(HttpClient);

  checkout(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${environment.apiBaseUrl}/orders/orders/checkout`, request);
  }

  listMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiBaseUrl}/orders/orders/me`);
  }

  listAdminOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiBaseUrl}/orders/orders/admin/all`);
  }

  listActiveOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiBaseUrl}/orders/orders/active`);
  }

  updateOrderStatus(orderRef: string, status: string, comment?: string): Observable<Order> {
    return this.http.patch<Order>(`${environment.apiBaseUrl}/orders/orders/${encodeURIComponent(orderRef)}/status`, {status, comment});
  }

  adminSummary(): Observable<AdminSummary> {
    return this.http.get<AdminSummary>(`${environment.apiBaseUrl}/orders/orders/admin/summary`);
  }
}
