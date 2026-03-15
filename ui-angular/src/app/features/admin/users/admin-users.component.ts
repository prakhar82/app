import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUser,
  AdminUserApiService
} from '../../../core/api/admin-user-api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatPaginatorModule],
  template: `
    <h3>Users</h3>
    <p class="muted">Add, edit, and delete users inline inside the same table area.</p>

    <mat-card class="section-card">
      <div class="toolbar">
        <input class="search" [(ngModel)]="query" (ngModelChange)="onQueryChange()" type="text" placeholder="Filter by email, name, phone, or role" />
        <button mat-stroked-button color="primary" (click)="startCreate()" [disabled]="creatingInline">Add User</button>
      </div>

      <div class="page-note" *ngIf="filteredUsers().length > 0">{{pageLabel()}}</div>

      <div class="scroll-wrap">
        <table class="table desktop-table" *ngIf="filteredUsers().length > 0 || creatingInline">
          <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th class="act-col">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr class="create-summary selected" *ngIf="creatingInline">
            <td>{{draft.email || 'new user'}}</td>
            <td>{{draft.name || '-'}}</td>
            <td>{{draft.phone || '-'}}</td>
            <td>{{draft.role}}</td>
            <td>ACTIVE</td>
            <td>-</td>
            <td class="act-col actions">
              <button mat-button (click)="cancelCreate()">Collapse</button>
            </td>
          </tr>
          <tr class="detail-row" *ngIf="creatingInline">
            <td colspan="7">
              <div class="detail-panel open">
                <div class="detail-head">
                  <strong>Add User</strong>
                  <button mat-button (click)="cancelCreate()">Close</button>
                </div>
                <div class="detail-grid">
                  <label>Email
                    <input [(ngModel)]="draft.email" type="email" />
                  </label>
                  <label>Name
                    <input [(ngModel)]="draft.name" type="text" />
                  </label>
                  <label>Phone
                    <input [(ngModel)]="draft.phone" type="text" />
                  </label>
                  <label>Password
                    <input [(ngModel)]="draft.password" type="password" />
                  </label>
                  <label>Role
                    <select [(ngModel)]="draft.role">
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </label>
                </div>
                <div class="detail-actions">
                  <button mat-raised-button color="primary" (click)="createUser()" [disabled]="creating">
                    {{creating ? 'Saving...' : 'Save User'}}
                  </button>
                  <button mat-button (click)="cancelCreate()">Cancel</button>
                </div>
              </div>
            </td>
          </tr>

          <ng-container *ngFor="let user of pagedUsers()">
            <tr [class.selected]="selectedUser?.id === user.id" (click)="toggleEdit(user)">
              <td>{{user.email}}</td>
              <td>{{user.name || '-'}}</td>
              <td>{{user.phone || '-'}}</td>
              <td>{{user.role}}</td>
              <td>{{user.status}}</td>
              <td>{{user.createdAt | date:'mediumDate'}}</td>
              <td class="act-col actions" (click)="$event.stopPropagation()">
                <button mat-button (click)="toggleEdit(user)">{{selectedUser?.id === user.id ? 'Collapse' : 'Edit'}}</button>
                <button mat-button color="warn" (click)="deleteUser(user)" [disabled]="deletingId === user.id || savingEdit">Delete</button>
              </td>
            </tr>
            <tr class="detail-row" *ngIf="selectedUser?.id === user.id">
              <td colspan="7">
                <div class="detail-panel open">
                  <div class="detail-head">
                    <strong>Edit User</strong>
                    <button mat-button (click)="closeEdit()">Close</button>
                  </div>
                  <div class="detail-grid">
                    <label>Email
                      <input [ngModel]="user.email" disabled />
                    </label>
                    <label>Name
                      <input [(ngModel)]="edit.name" type="text" />
                    </label>
                    <label>Phone
                      <input [(ngModel)]="edit.phone" type="text" />
                    </label>
                    <label>Password
                      <input [(ngModel)]="edit.password" type="password" placeholder="Leave blank to keep current" />
                    </label>
                    <label>Role
                      <select [(ngModel)]="edit.role">
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </label>
                    <label>Status
                      <select [(ngModel)]="edit.status">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </label>
                  </div>
                  <div class="detail-actions">
                    <button mat-raised-button color="primary" (click)="saveUser(user)" [disabled]="savingEdit">
                      {{savingEdit ? 'Saving...' : 'Save Changes'}}
                    </button>
                    <button mat-button color="warn" (click)="deleteUser(user)" [disabled]="deletingId === user.id || savingEdit">Delete</button>
                    <button mat-button (click)="closeEdit()">Close</button>
                  </div>
                </div>
              </td>
            </tr>
          </ng-container>
          </tbody>
        </table>

        <div class="mobile-list" *ngIf="filteredUsers().length > 0 || creatingInline">
          <article class="mobile-user selected" *ngIf="creatingInline">
            <div class="mobile-head">
              <div>
                <strong>{{draft.email || 'New user'}}</strong>
                <p>{{draft.role}}</p>
              </div>
            </div>
            <div class="detail-panel open mobile-detail">
              <div class="detail-head">
                <strong>Add User</strong>
                <button mat-button (click)="cancelCreate()">Close</button>
              </div>
              <div class="detail-grid">
                <label>Email
                  <input [(ngModel)]="draft.email" type="email" />
                </label>
                <label>Name
                  <input [(ngModel)]="draft.name" type="text" />
                </label>
                <label>Phone
                  <input [(ngModel)]="draft.phone" type="text" />
                </label>
                <label>Password
                  <input [(ngModel)]="draft.password" type="password" />
                </label>
                <label>Role
                  <select [(ngModel)]="draft.role">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
              </div>
              <div class="detail-actions">
                <button mat-raised-button color="primary" (click)="createUser()" [disabled]="creating">
                  {{creating ? 'Saving...' : 'Save User'}}
                </button>
                <button mat-button (click)="cancelCreate()">Cancel</button>
              </div>
            </div>
          </article>

          <article class="mobile-user"
                   *ngFor="let user of pagedUsers()"
                   [class.selected]="selectedUser?.id === user.id">
            <div class="mobile-head" (click)="toggleEdit(user)">
              <div>
                <strong>{{user.email}}</strong>
                <p>{{user.name || '-'}} | {{user.role}} | {{user.status}}</p>
              </div>
              <strong>{{user.createdAt | date:'shortDate'}}</strong>
            </div>
            <div class="mobile-meta">{{user.phone || 'No phone'}}</div>
            <div class="actions" (click)="$event.stopPropagation()">
              <button mat-button (click)="toggleEdit(user)">{{selectedUser?.id === user.id ? 'Collapse' : 'Edit'}}</button>
              <button mat-button color="warn" (click)="deleteUser(user)" [disabled]="deletingId === user.id || savingEdit">Delete</button>
            </div>
            <div class="detail-panel open mobile-detail" *ngIf="selectedUser?.id === user.id">
              <div class="detail-head">
                <strong>Edit User</strong>
                <button mat-button (click)="closeEdit()">Close</button>
              </div>
              <div class="detail-grid">
                <label>Email
                  <input [ngModel]="user.email" disabled />
                </label>
                <label>Name
                  <input [(ngModel)]="edit.name" type="text" />
                </label>
                <label>Phone
                  <input [(ngModel)]="edit.phone" type="text" />
                </label>
                <label>Password
                  <input [(ngModel)]="edit.password" type="password" placeholder="Leave blank to keep current" />
                </label>
                <label>Role
                  <select [(ngModel)]="edit.role">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
                <label>Status
                  <select [(ngModel)]="edit.status">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </label>
              </div>
              <div class="detail-actions">
                <button mat-raised-button color="primary" (click)="saveUser(user)" [disabled]="savingEdit">
                  {{savingEdit ? 'Saving...' : 'Save Changes'}}
                </button>
                <button mat-button color="warn" (click)="deleteUser(user)" [disabled]="deletingId === user.id || savingEdit">Delete</button>
                <button mat-button (click)="closeEdit()">Close</button>
              </div>
            </div>
          </article>
        </div>

        <p class="blank" *ngIf="filteredUsers().length === 0 && !creatingInline">No users found.</p>
      </div>

      <div class="paginator-wrap" *ngIf="filteredUsers().length > 0">
        <mat-paginator [length]="filteredUsers().length"
                       [pageIndex]="pageIndex"
                       [pageSize]="pageSize"
                       [pageSizeOptions]="[6, 8, 12]"
                       (page)="onPage($event)">
        </mat-paginator>
      </div>
    </mat-card>

    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    :host { display: block; min-height: 0; overflow: hidden; }
    .muted { color: #5a6f66; }
    .section-card {
      display: flex;
      flex-direction: column;
      gap: .8rem;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      border-radius: 14px;
    }
    .toolbar { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; }
    .search { flex: 1; min-width: 220px; max-width: 420px; padding: .5rem .6rem; border: 1px solid #cfdad4; border-radius: 8px; box-sizing: border-box; }
    .page-note { margin: -.1rem 0 0; color: #587067; font-size: .92rem; }
    .scroll-wrap {
      flex: 1;
      min-height: 0;
      overflow: auto;
      border: 1px solid #e1e9e4;
      border-radius: 12px;
      background: #fff;
      container-type: inline-size;
    }
    .table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .table th, .table td { border-bottom: 1px solid #dbe5df; padding: .68rem; text-align: left; vertical-align: top; }
    .table thead th { position: sticky; top: 0; z-index: 2; background: #f4f9f6; }
    .table tr.selected { background: #eef7f2; }
    .create-summary { cursor: default; }
    .detail-row td { padding: 0; background: #fbfdfc; }
    .detail-panel {
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height .22s ease, opacity .18s ease;
    }
    .detail-panel.open {
      max-height: 720px;
      opacity: 1;
      padding: 1rem;
    }
    .detail-head { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-bottom: .8rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
    .detail-grid label { display: flex; flex-direction: column; gap: .28rem; color: #456458; font-size: .9rem; }
    .detail-grid input, .detail-grid select {
      width: 100%;
      box-sizing: border-box;
      padding: .48rem .56rem;
      border: 1px solid #cfdad4;
      border-radius: 8px;
      background: #fff;
    }
    .detail-actions { margin-top: .9rem; display: flex; gap: .6rem; flex-wrap: wrap; }
    .actions { display: flex; gap: .45rem; flex-wrap: wrap; justify-content: flex-end; }
    .act-col { width: 180px; }
    .mobile-list { display: none; padding: .8rem; gap: .8rem; }
    .mobile-user { border: 1px solid #dfe8e3; border-radius: 12px; padding: .85rem; background: #fbfdfc; }
    .mobile-user.selected { border-color: #91b8a5; background: #eef7f2; }
    .mobile-head { display: flex; justify-content: space-between; gap: .75rem; }
    .mobile-head p { margin: .12rem 0 0; color: #60766c; }
    .mobile-meta { margin-top: .6rem; color: #60766c; }
    .mobile-detail { margin-top: .75rem; }
    .blank { padding: 1rem; color: #587067; }
    .paginator-wrap {
      flex: 0 0 auto;
      margin-top: .1rem;
      border: 1px solid #dde7e1;
      border-radius: 12px;
      background: #fbfdfc;
      overflow: hidden;
    }
    mat-paginator { background: transparent; }
    @container (max-width: 980px) {
      .desktop-table { display: none; }
      .mobile-list { display: grid; }
    }
    .error { color: #b42318; margin-top: .75rem; }
    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: 1fr; }
      .detail-actions button { width: 100%; }
      .search { max-width: none; width: 100%; }
    }
  `]
})
export class AdminUsersComponent {
  private adminUserApi = inject(AdminUserApiService);

  users: AdminUser[] = [];
  error = '';
  creating = false;
  savingEdit = false;
  creatingInline = false;
  deletingId: number | null = null;
  query = '';
  selectedUser: AdminUser | null = null;
  pageIndex = 0;
  pageSize = 8;
  draft: AdminCreateUserRequest = this.emptyDraft();
  edit: AdminUpdateUserRequest & {password: string} = this.emptyEdit();

  constructor() {
    this.reload();
  }

  reload(): void {
    this.adminUserApi.listUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.ensureValidPage();
        if (this.selectedUser) {
          const refreshed = users.find(user => user.id === this.selectedUser?.id);
          if (refreshed) {
            this.populateEdit(refreshed);
          } else {
            this.closeEdit();
          }
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load users.';
      }
    });
  }

  startCreate(): void {
    this.error = '';
    this.closeEdit();
    this.creatingInline = true;
    this.draft = this.emptyDraft();
  }

  cancelCreate(): void {
    this.creatingInline = false;
    this.draft = this.emptyDraft();
  }

  toggleEdit(user: AdminUser): void {
    if (this.selectedUser?.id === user.id) {
      this.closeEdit();
      return;
    }
    this.creatingInline = false;
    this.populateEdit(user);
  }

  closeEdit(): void {
    this.selectedUser = null;
    this.edit = this.emptyEdit();
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
        this.creatingInline = false;
        this.users = [user, ...this.users];
        this.pageIndex = 0;
        this.populateEdit(user);
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message || 'Unable to create user.';
      }
    });
  }

  saveUser(user: AdminUser): void {
    this.error = '';
    this.savingEdit = true;
    this.adminUserApi.updateUser(user.id, {
      name: this.blankToUndefined(this.edit.name),
      phone: this.blankToUndefined(this.edit.phone),
      password: this.blankToUndefined(this.edit.password),
      role: this.edit.role,
      status: this.edit.status
    }).subscribe({
      next: (updated) => {
        this.savingEdit = false;
        this.populateEdit(updated);
        this.reload();
      },
      error: (err) => {
        this.savingEdit = false;
        this.error = err?.error?.message || 'Unable to update user.';
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
        this.ensureValidPage();
        if (this.selectedUser?.id === user.id) {
          this.closeEdit();
        }
      },
      error: (err) => {
        this.deletingId = null;
        this.error = err?.error?.message || 'Unable to delete user.';
      }
    });
  }

  filteredUsers(): AdminUser[] {
    const q = (this.query || '').trim().toLowerCase();
    if (!q) {
      return this.users;
    }
    return this.users.filter(user =>
      user.email.toLowerCase().includes(q)
      || (user.name || '').toLowerCase().includes(q)
      || (user.phone || '').toLowerCase().includes(q)
      || user.role.toLowerCase().includes(q)
      || user.status.toLowerCase().includes(q)
    );
  }

  pagedUsers(): AdminUser[] {
    this.ensureValidPage();
    const start = this.pageIndex * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onQueryChange(): void {
    this.pageIndex = 0;
    if (this.selectedUser && !this.filteredUsers().some(user => user.id === this.selectedUser?.id)) {
      this.closeEdit();
    }
  }

  pageLabel(): string {
    const total = this.filteredUsers().length;
    const start = total === 0 ? 0 : this.pageIndex * this.pageSize + 1;
    const end = Math.min(total, (this.pageIndex + 1) * this.pageSize);
    return `Showing ${start}-${end} of ${total}`;
  }

  private populateEdit(user: AdminUser): void {
    this.selectedUser = user;
    this.edit = {
      name: user.name || '',
      phone: user.phone || '',
      password: '',
      role: (user.role === 'ADMIN' ? 'ADMIN' : 'USER'),
      status: (user.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')
    };
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

  private emptyEdit(): AdminUpdateUserRequest & {password: string} {
    return {
      name: '',
      phone: '',
      password: '',
      role: 'USER',
      status: 'ACTIVE'
    };
  }

  private blankToUndefined(value?: string): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed ? trimmed : undefined;
  }

  private ensureValidPage(): void {
    const totalPages = Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize));
    if (this.pageIndex >= totalPages) {
      this.pageIndex = 0;
    }
  }
}
