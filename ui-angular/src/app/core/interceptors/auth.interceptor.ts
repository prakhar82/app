import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {switchMap, take} from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store<{auth: {token: string | null}}>);
  return store.select('auth').pipe(
    take(1),
    switchMap(state => {
      let token = state.token;
      if (!token) {
        try {
          const raw = sessionStorage.getItem('auth_state');
          if (raw) {
            const parsed = JSON.parse(raw) as {token?: string | null};
            token = parsed.token ?? null;
          }
        } catch {
          token = null;
        }
      }
      const authReq = token ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}, withCredentials: true}) : req;
      return next(authReq);
    })
  );
};
