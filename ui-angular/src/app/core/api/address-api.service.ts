import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface Address {
  id?: number;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  isDefault: boolean;
}

@Injectable({providedIn: 'root'})
export class AddressApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<Address[]> {
    return this.http.get<Address[]>(`${environment.apiBaseUrl}/identity/addresses`);
  }

  create(payload: Address): Observable<Address> {
    return this.http.post<Address>(`${environment.apiBaseUrl}/identity/addresses`, payload);
  }
}
