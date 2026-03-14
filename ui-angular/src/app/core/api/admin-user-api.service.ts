import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  status: string;
  googleVerified: boolean;
  createdAt: string;
}

export interface AdminCreateUserRequest {
  email: string;
  name?: string;
  phone?: string;
  password: string;
  role: 'ADMIN' | 'USER';
}

export interface AdminUpdateUserRequest {
  name?: string;
  phone?: string;
  password?: string;
  role?: 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'INACTIVE';
}

@Injectable({providedIn: 'root'})
export class AdminUserApiService {
  private readonly http = inject(HttpClient);

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${environment.apiBaseUrl}/identity/admin/users`);
  }

  createUser(request: AdminCreateUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${environment.apiBaseUrl}/identity/admin/users`, request);
  }

  updateUser(id: number, request: AdminUpdateUserRequest): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${environment.apiBaseUrl}/identity/admin/users/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/identity/admin/users/${id}`);
  }
}
