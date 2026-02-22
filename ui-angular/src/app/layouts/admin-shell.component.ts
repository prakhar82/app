import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {Store} from '@ngrx/store';
import {logout} from '../state/auth/auth.actions';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatCardModule],
  template: `
    <mat-toolbar class="topbar">
      <strong>Grocery Admin</strong>
      <span class="spacer"></span>
      <button mat-button routerLink="/admin/dashboard">Dashboard</button>
      <button mat-button routerLink="/admin/products">Products</button>
      <button mat-button routerLink="/admin/upload">Upload</button>
      <button mat-button routerLink="/admin/inventory">Inventory</button>
      <button mat-button routerLink="/admin/orders">Orders</button>
      <button mat-stroked-button (click)="signOut()">Logout</button>
    </mat-toolbar>

    <div class="shell-body">
      <mat-card class="content">
        <router-outlet />
      </mat-card>
    </div>
  `,
  styles: [`
    .topbar { background: linear-gradient(90deg, #0a5c47, #0b7a52); color: #fff; position: sticky; top: 0; z-index: 20; }
    .spacer { flex: 1; }
    .shell-body { padding: 1rem; }
    .content { border-radius: 18px; min-height: calc(100vh - 96px); padding: 1rem; }
  `]
})
export class AdminShellComponent {
  private store = inject(Store);
  private router = inject(Router);

  signOut(): void {
    this.store.dispatch(logout());
    this.router.navigateByUrl('/login');
  }
}

