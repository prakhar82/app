import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';

export interface AuthResponse { accessToken: string; tokenType: string; expiresInSeconds: number; role: string; email: string; }
export interface RegisterRequest { email: string; name?: string; phone?: string; password: string; }
export interface VerifyRequest { email: string; code: string; }

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/identity/auth/login`, {email, password}, {withCredentials: true});
  }

  googleLogin(): void {
    window.location.href = `${environment.apiBaseUrl}/identity/oauth2/authorization/google`;
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/identity/auth/register`, request, {withCredentials: true});
  }

  verify(request: VerifyRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/identity/auth/verify`, request, {withCredentials: true});
  }

  resendCode(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/identity/auth/resend-code`, {email}, {withCredentials: true});
  }
}
