import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface PaymentAccountSettings {
  accountHolderName?: string | null;
  iban?: string | null;
  bankName?: string | null;
  paymentReference?: string | null;
}

@Injectable({providedIn: 'root'})
export class PaymentAdminApiService {
  private readonly http = inject(HttpClient);

  getAccount(): Observable<PaymentAccountSettings> {
    return this.http.get<PaymentAccountSettings>(`${environment.apiBaseUrl}/payments/payments/admin/account`);
  }

  updateAccount(payload: PaymentAccountSettings): Observable<PaymentAccountSettings> {
    return this.http.patch<PaymentAccountSettings>(`${environment.apiBaseUrl}/payments/payments/admin/account`, payload);
  }
}
