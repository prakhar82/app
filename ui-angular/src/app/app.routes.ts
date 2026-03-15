import {Routes} from '@angular/router';
import {authGuard} from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./core/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./core/auth/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'app',
    loadComponent: () => import('./layouts/user-shell.component').then(m => m.UserShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/storefront/dashboard/user-dashboard.component').then(m => m.UserDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/storefront/catalog/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/storefront/catalog/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/storefront/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/storefront/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/storefront/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/storefront/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {path: '', pathMatch: 'full', redirectTo: 'dashboard'}
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-shell.component').then(m => m.AdminShellComponent),
    canActivate: [authGuard],
    data: {roles: ['ADMIN']},
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/products/admin-products.component').then(m => m.AdminProductsComponent)
      },
      {
        path: 'upload',
        loadComponent: () => import('./features/admin/upload/admin-upload.component').then(m => m.AdminUploadComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/admin/inventory/admin-inventory.component').then(m => m.AdminInventoryComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      },
      {path: '', pathMatch: 'full', redirectTo: 'dashboard'}
    ]
  },
  {path: '', pathMatch: 'full', redirectTo: 'login'},
  {path: '**', redirectTo: 'login'}
];
