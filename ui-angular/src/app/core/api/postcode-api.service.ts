import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface PostcodeValidationResult {
  allowed: boolean;
  city?: string | null;
  reason?: string | null;
  normalizedPostcode?: string | null;
}

@Injectable({providedIn: 'root'})
export class PostcodeApiService {
  private readonly http = inject(HttpClient);

  validate(postcode: string, country = 'NL'): Observable<PostcodeValidationResult> {
    return this.http.get<PostcodeValidationResult>(
      `${environment.apiBaseUrl}/postcode/validate?postcode=${encodeURIComponent(postcode)}&country=${encodeURIComponent(country)}`
    );
  }
}
