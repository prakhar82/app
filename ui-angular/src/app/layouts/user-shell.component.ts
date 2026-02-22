import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {Router} from '@angular/router';
import {inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {logout} from '../state/auth/auth.actions';

@Component({
  selector: 'app-user-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatCardModule],
  template: `
    <mat-toolbar class="topbar">
      <strong>FreshMart</strong>
      <span class="spacer"></span>
      <button mat-button routerLink="/app/dashboard">Home</button>
      <button mat-button routerLink="/app/products">Products</button>
      <button mat-raised-button color="accent" routerLink="/app/cart">Cart</button>
      <button mat-button routerLink="/app/orders">Orders</button>
      <button mat-button routerLink="/app/profile">Profile</button>
      <button mat-button (click)="signOut()">Logout</button>
    </mat-toolbar>

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
    .topbar { background: linear-gradient(90deg, #134e5e, #71b280); color: #fff; position: sticky; top: 0; z-index: 20; }
    .spacer { flex: 1; }
    .hero { padding: 1.25rem 1.5rem; color: #18342c; }
    .hero h1 { margin: 0 0 .25rem; font-size: 1.7rem; }
    .hero p { margin: 0; opacity: .8; }
    .shell-body { padding: 0 1rem 1rem; }
    .content { border-radius: 18px; min-height: calc(100vh - 190px); padding: 1rem; }
  `]
})
export class UserShellComponent {
  private store = inject(Store);
  private router = inject(Router);

  signOut(): void {
    this.store.dispatch(logout());
    this.router.navigateByUrl('/login');
  }
}
