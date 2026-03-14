import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {AdminCreateUserRequest, AdminUser, AdminUserApiService} from '../../../core/api/admin-user-api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  template: `
    <h3>Users</h3>
    <p class="muted">Create users or remove existing accounts from one admin screen.</p>

    <div class="create-card">
      <h4>Create User</h4>
      <div class="form-grid">
        <input [(ngModel)]="draft.email" type="email" placeholder="Email" />
        <input [(ngModel)]="draft.name" type="text" placeholder="Name" />
        <input [(ngModel)]="draft.phone" type="text" placeholder="Phone" />
        <input [(ngModel)]="draft.password" type="password" placeholder="Password" />
        <select [(ngModel)]="draft.role">
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button mat-raised-button color="primary" (click)="createUser()" [disabled]="creating">Add User</button>
      </div>
    </div>

    <div class="scroll-wrap">
      <table class="table">
        <thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Role</th>
          <th>Status</th>
          <th>Created</th>
          <th>Action</th>
        </tr>
        </thead>
        <tbody>
        <tr *ngFor="let user of users">
          <td>{{user.email}}</td>
          <td>{{user.name || '-'}}</td>
          <td>{{user.phone || '-'}}</td>
          <td>{{user.role}}</td>
          <td>{{user.status}}</td>
          <td>{{user.createdAt | date:'medium'}}</td>
          <td>
            <button mat-button color="warn" (click)="deleteUser(user)" [disabled]="deletingId === user.id">Delete</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .muted { color: #5a6f66; }
    .create-card { margin-bottom: 1rem; padding: 1rem; border: 1px solid #e1e9e4; border-radius: 10px; background: #f8fbf9; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .75rem; align-items: center; }
    input, select { width: 100%; padding: .6rem; border: 1px solid #cfdad4; border-radius: 8px; background: #fff; }
    .scroll-wrap { max-height: 62vh; overflow: auto; border: 1px solid #e1e9e4; border-radius: 10px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { border-bottom: 1px solid #dbe5df; padding: .55rem; text-align: left; }
    .error { color: #b42318; margin-top: .75rem; }
  `]
})
export class AdminUsersComponent {
  private adminUserApi = inject(AdminUserApiService);

  users: AdminUser[] = [];
  error = '';
  creating = false;
  deletingId: number | null = null;
  draft: AdminCreateUserRequest = this.emptyDraft();

  constructor() {
    this.reload();
  }

  reload(): void {
    this.adminUserApi.listUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load users.';
      }
    });
  }

  createUser(): void {
    this.error = '';
    if (!this.draft.email.trim() || !this.draft.password.trim()) {
      this.error = 'Email and password are required.';
      return;
    }
    this.creating = true;
    this.adminUserApi.createUser({
      email: this.draft.email.trim(),
      name: this.blankToUndefined(this.draft.name),
      phone: this.blankToUndefined(this.draft.phone),
      password: this.draft.password,
      role: this.draft.role
    }).subscribe({
      next: (user) => {
        this.creating = false;
        this.users = [user, ...this.users];
        this.draft = this.emptyDraft();
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message || 'Unable to create user.';
      }
    });
  }

  deleteUser(user: AdminUser): void {
    this.error = '';
    if (!confirm(`Delete user ${user.email}?`)) {
      return;
    }
    this.deletingId = user.id;
    this.adminUserApi.deleteUser(user.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.users = this.users.filter(existing => existing.id !== user.id);
      },
      error: (err) => {
        this.deletingId = null;
        this.error = err?.error?.message || 'Unable to delete user.';
      }
    });
  }

  private emptyDraft(): AdminCreateUserRequest {
    return {
      email: '',
      name: '',
      phone: '',
      password: '',
      role: 'USER'
    };
  }

  private blankToUndefined(value?: string): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed ? trimmed : undefined;
  }
}
