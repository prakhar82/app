import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {Store} from '@ngrx/store';
import {logout} from '../state/auth/auth.actions';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatCardModule],
  template: `
    <mat-toolbar class="topbar">
      <div class="brand-row">
        <button mat-button class="menu-toggle mobile-only" (click)="menuOpen = !menuOpen">Menu</button>
        <strong>Grocery Admin</strong>
      </div>

      <span class="spacer"></span>

      <nav class="desktop-nav">
        <a mat-button routerLink="/admin/dashboard" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
        <a mat-button routerLink="/admin/products" routerLinkActive="active-link">Products</a>
        <a mat-button routerLink="/admin/upload" routerLinkActive="active-link">Maintenance</a>
        <a mat-button routerLink="/admin/inventory" routerLinkActive="active-link">Inventory</a>
        <a mat-button routerLink="/admin/users" routerLinkActive="active-link">Users</a>
        <a mat-button routerLink="/admin/orders" routerLinkActive="active-link">Orders</a>
      </nav>

      <button mat-stroked-button class="desktop-nav" (click)="signOut()">Logout</button>
    </mat-toolbar>

    <div class="mobile-overlay" *ngIf="menuOpen" (click)="menuOpen = false"></div>
    <aside class="mobile-drawer" [class.open]="menuOpen">
      <a routerLink="/admin/dashboard" routerLinkActive="drawer-link-active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Dashboard</a>
      <a routerLink="/admin/products" routerLinkActive="drawer-link-active" (click)="closeMenu()">Products</a>
      <a routerLink="/admin/upload" routerLinkActive="drawer-link-active" (click)="closeMenu()">Maintenance</a>
      <a routerLink="/admin/inventory" routerLinkActive="drawer-link-active" (click)="closeMenu()">Inventory</a>
      <a routerLink="/admin/users" routerLinkActive="drawer-link-active" (click)="closeMenu()">Users</a>
      <a routerLink="/admin/orders" routerLinkActive="drawer-link-active" (click)="closeMenu()">Orders</a>
      <button mat-raised-button color="primary" (click)="signOut()">Logout</button>
    </aside>

    <div class="shell-body">
      <mat-card class="content">
        <router-outlet />
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
    .topbar { background: linear-gradient(90deg, #0a5c47, #0b7a52); color: #fff; position: sticky; top: 0; z-index: 30; display: flex; gap: .75rem; }
    .brand-row { display: flex; align-items: center; gap: .75rem; }
    .spacer { flex: 1; }
    .desktop-nav { display: flex; align-items: center; gap: .25rem; }
    .desktop-nav a, .desktop-nav button { color: #fff; }
    .active-link { background: rgba(255,255,255,.16); border-radius: 8px; font-weight: 700; }
    .mobile-only { display: none; }
    .shell-body { flex: 1; min-height: 0; padding: .9rem; overflow: hidden; }
    .content {
      height: 100%;
      border-radius: 18px;
      padding: clamp(.7rem, 1.4vw, 1rem);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }
    .mobile-overlay { position: fixed; inset: 0; background: rgba(6, 21, 17, .45); z-index: 35; }
    .mobile-drawer {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(78vw, 320px);
      padding: 5rem 1rem 1rem;
      background: linear-gradient(180deg, #0c5b47, #0a3f31);
      display: flex;
      flex-direction: column;
      gap: .5rem;
      transform: translateX(-100%);
      transition: transform .2s ease;
      z-index: 40;
    }
    .mobile-drawer.open { transform: translateX(0); }
    .mobile-drawer a {
      color: #fff;
      text-decoration: none;
      padding: .8rem .9rem;
      border-radius: 10px;
      background: rgba(255,255,255,.06);
    }
    .drawer-link-active { background: rgba(255,255,255,.18) !important; font-weight: 700; }
    @media (max-width: 980px) {
      .desktop-nav { display: none; }
      .mobile-only { display: inline-flex; }
      .shell-body { padding: .6rem; }
    }
  `]
})
export class AdminShellComponent {
  private store = inject(Store);
  private router = inject(Router);

  menuOpen = false;

  closeMenu(): void {
    this.menuOpen = false;
  }

  signOut(): void {
    this.closeMenu();
    this.store.dispatch(logout());
    this.router.navigateByUrl('/login');
  }
}
