import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Address} from './address-api.service';

export interface MeProfile {
  email: string;
  name?: string | null;
  phone?: string | null;
  preferredLanguage?: string | null;
  defaultAddressId?: number | null;
  role: string;
  status: string;
}

@Injectable({providedIn: 'root'})
export class MeApiService {
  private readonly http = inject(HttpClient);

  me(): Observable<MeProfile> {
    return this.http.get<MeProfile>(`${environment.apiBaseUrl}/identity/me`);
  }

  update(payload: {name?: string; phone?: string; preferredLanguage?: string; defaultAddressId?: number | null}): Observable<MeProfile> {
    return this.http.patch<MeProfile>(`${environment.apiBaseUrl}/identity/me`, payload);
  }

  listAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${environment.apiBaseUrl}/identity/me/addresses`);
  }

  addAddress(payload: Address): Observable<Address> {
    return this.http.post<Address>(`${environment.apiBaseUrl}/identity/me/addresses`, payload);
  }

  updateAddress(id: number, payload: Address): Observable<Address> {
    return this.http.put<Address>(`${environment.apiBaseUrl}/identity/me/addresses/${id}`, payload);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/identity/me/addresses/${id}`);
  }

  setDefaultAddress(id: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/identity/me/addresses/${id}/default`, {});
  }
}
