import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {Store} from '@ngrx/store';
import {logout} from '../state/auth/auth.actions';

@Component({
  selector: 'app-user-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatCardModule],
  template: `
    <mat-toolbar class="topbar">
      <div class="brand-row">
        <button mat-button class="menu-toggle mobile-only" (click)="menuOpen = !menuOpen">Menu</button>
        <strong>FreshMart</strong>
      </div>

      <span class="spacer"></span>

      <nav class="desktop-nav">
        <a mat-button routerLink="/app/dashboard" routerLinkActive #homeRla="routerLinkActive" [routerLinkActiveOptions]="{exact: true}" [class.active-link]="homeRla.isActive">Home</a>
        <a mat-button routerLink="/app/products" routerLinkActive #productsRla="routerLinkActive" [routerLinkActiveOptions]="{exact: false}" [class.active-link]="productsRla.isActive">Products</a>
        <a mat-raised-button color="accent" routerLink="/app/cart" routerLinkActive #cartRla="routerLinkActive" [routerLinkActiveOptions]="{exact: true}" [class.active-link]="cartRla.isActive">Cart</a>
        <a mat-button routerLink="/app/orders" routerLinkActive #ordersRla="routerLinkActive" [routerLinkActiveOptions]="{exact: false}" [class.active-link]="ordersRla.isActive">Orders</a>
        <a mat-button routerLink="/app/profile" routerLinkActive #profileRla="routerLinkActive" [routerLinkActiveOptions]="{exact: false}" [class.active-link]="profileRla.isActive">Profile</a>
      </nav>

      <button mat-button class="desktop-nav logout-btn" (click)="signOut()">Logout</button>
    </mat-toolbar>

    <div class="mobile-overlay" *ngIf="menuOpen" (click)="menuOpen = false"></div>
    <aside class="mobile-drawer" [class.open]="menuOpen">
      <a routerLink="/app/dashboard" routerLinkActive="drawer-link-active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Home</a>
      <a routerLink="/app/products" routerLinkActive="drawer-link-active" [routerLinkActiveOptions]="{exact: false}" (click)="closeMenu()">Products</a>
      <a routerLink="/app/cart" routerLinkActive="drawer-link-active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Cart</a>
      <a routerLink="/app/orders" routerLinkActive="drawer-link-active" [routerLinkActiveOptions]="{exact: false}" (click)="closeMenu()">Orders</a>
      <a routerLink="/app/profile" routerLinkActive="drawer-link-active" [routerLinkActiveOptions]="{exact: false}" (click)="closeMenu()">Profile</a>
      <button mat-raised-button color="primary" (click)="signOut()">Logout</button>
    </aside>

    <div class="hero">
      <h1>Fresh Groceries, Fast Delivery</h1>
      <p>Shop produce, dairy and everyday essentials from your neighborhood store.</p>
    </div>

    <div class="shell-body">
      <mat-card class="content">
        <router-outlet />
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
    .topbar { background: linear-gradient(90deg, #134e5e, #71b280); color: #fff; position: sticky; top: 0; z-index: 30; display: flex; gap: .75rem; }
    .brand-row { display: flex; align-items: center; gap: .75rem; }
    .spacer { flex: 1; }
    .desktop-nav { display: flex; align-items: center; gap: .25rem; }
    .desktop-nav a, .desktop-nav button { color: #fff; }
    .logout-btn { color: #fff; }
    .active-link {
      background: rgba(255,255,255,.2) !important;
      border-radius: 8px;
      font-weight: 700;
      box-shadow: inset 0 -3px 0 rgba(255,255,255,.65);
    }
    .mobile-only { display: none; }
    .hero { padding: 1.25rem 1.5rem; color: #18342c; }
    .hero h1 { margin: 0 0 .25rem; font-size: 1.7rem; }
    .hero p { margin: 0; opacity: .8; }
    .shell-body { flex: 1; min-height: 0; padding: 0 1rem 1rem; overflow: hidden; }
    .content { height: 100%; border-radius: 18px; padding: 1rem; min-width: 0; overflow: auto; overscroll-behavior: contain; }
    .mobile-overlay { position: fixed; inset: 0; background: rgba(6, 21, 17, .45); z-index: 35; }
    .mobile-drawer {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(78vw, 320px);
      padding: 5rem 1rem 1rem;
      background: linear-gradient(180deg, #145362, #183c30);
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
      .hero { padding: 1rem .9rem; }
      .hero h1 { font-size: 1.35rem; }
      .shell-body { padding: 0 .75rem .75rem; }
      .content { padding: .85rem; }
    }
  `]
})
export class UserShellComponent {
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
