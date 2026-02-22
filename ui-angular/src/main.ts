import {bootstrapApplication} from '@angular/platform-browser';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {provideStore} from '@ngrx/store';
import {provideAnimations} from '@angular/platform-browser/animations';
import {AppComponent} from './app/app.component';
import {routes} from './app/app.routes';
import {authReducer} from './app/state/auth/auth.reducer';
import {catalogReducer} from './app/state/catalog/catalog.reducer';
import {cartReducer} from './app/state/cart/cart.reducer';
import {ordersReducer} from './app/state/orders/orders.reducer';
import {authInterceptor} from './app/core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({auth: authReducer, catalog: catalogReducer, cart: cartReducer, orders: ordersReducer})
  ]
});
