import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {map, take} from 'rxjs/operators';

export const authGuard: CanActivateFn = (route) => {
  const store = inject(Store<{auth: {token: string | null; role: string | null}}>);
  const router = inject(Router);
  const requiredRoles = route.data?.['roles'] as string[] | undefined;
  return store.select('auth').pipe(
    take(1),
    map(state => {
      if (!state.token) {
        return router.createUrlTree(['/login']);
      }
      if (requiredRoles?.length && (!state.role || !requiredRoles.includes(state.role))) {
        return router.createUrlTree(['/app/dashboard']);
      }
      return true;
    })
  );
};
