import {Routes} from '@angular/router';
import {authGuard} from './core/auth/auth.guard';
import {LoginComponent} from './core/auth/login.component';
import {RegisterComponent} from './core/auth/register.component';
import {VerifyEmailComponent} from './core/auth/verify-email.component';
import {UserShellComponent} from './layouts/user-shell.component';
import {AdminShellComponent} from './layouts/admin-shell.component';
import {UserDashboardComponent} from './features/storefront/dashboard/user-dashboard.component';
import {ProductListComponent} from './features/storefront/catalog/product-list.component';
import {ProductDetailComponent} from './features/storefront/catalog/product-detail.component';
import {CartComponent} from './features/storefront/cart/cart.component';
import {OrdersComponent} from './features/storefront/orders/orders.component';
import {CheckoutComponent} from './features/storefront/checkout/checkout.component';
import {ProfileComponent} from './features/storefront/profile/profile.component';
import {AdminDashboardComponent} from './features/admin/dashboard/admin-dashboard.component';
import {AdminProductsComponent} from './features/admin/products/admin-products.component';
import {AdminUploadComponent} from './features/admin/upload/admin-upload.component';
import {AdminInventoryComponent} from './features/admin/inventory/admin-inventory.component';
import {AdminOrdersComponent} from './features/admin/orders/admin-orders.component';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'verify-email', component: VerifyEmailComponent},
  {
    path: 'app',
    component: UserShellComponent,
    canActivate: [authGuard],
    children: [
      {path: 'dashboard', component: UserDashboardComponent},
      {path: 'products', component: ProductListComponent},
      {path: 'products/:id', component: ProductDetailComponent},
      {path: 'cart', component: CartComponent},
      {path: 'orders', component: OrdersComponent},
      {path: 'profile', component: ProfileComponent},
      {path: 'checkout', component: CheckoutComponent},
      {path: '', pathMatch: 'full', redirectTo: 'dashboard'}
    ]
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [authGuard],
    data: {roles: ['ADMIN']},
    children: [
      {path: 'dashboard', component: AdminDashboardComponent},
      {path: 'products', component: AdminProductsComponent},
      {path: 'upload', component: AdminUploadComponent},
      {path: 'inventory', component: AdminInventoryComponent},
      {path: 'orders', component: AdminOrdersComponent},
      {path: '', pathMatch: 'full', redirectTo: 'dashboard'}
    ]
  },
  {path: '', pathMatch: 'full', redirectTo: 'login'},
  {path: '**', redirectTo: 'login'}
];
