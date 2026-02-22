import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {AuthService} from '../../core/auth/auth.service';
import {loginFailed, loginRequested, loginSucceeded} from './auth.actions';
import {catchError, map, mergeMap, of} from 'rxjs';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);

  login$ = createEffect(() => this.actions$.pipe(
    ofType(loginRequested),
    mergeMap(action => this.authService.login(action.email, action.password).pipe(
      map(response => loginSucceeded({response})),
      catchError(() => of(loginFailed({error: 'Login failed'})))
    ))
  ));
}
