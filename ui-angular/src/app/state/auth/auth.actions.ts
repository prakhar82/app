import {createAction, props} from '@ngrx/store';
import {AuthResponse} from '../../core/auth/auth.service';

export const loginRequested = createAction('[Auth] Login Requested', props<{email: string; password: string}>());
export const loginSucceeded = createAction('[Auth] Login Succeeded', props<{response: AuthResponse}>());
export const loginFailed = createAction('[Auth] Login Failed', props<{error: string}>());
export const logout = createAction('[Auth] Logout');
