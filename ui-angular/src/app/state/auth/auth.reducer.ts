import {createReducer, on} from '@ngrx/store';
import {loginFailed, loginSucceeded, logout} from './auth.actions';

export interface AuthState { token: string | null; email: string | null; role: string | null; error: string | null; }

function loadInitialState(): AuthState {
  try {
    const raw = sessionStorage.getItem('auth_state');
    if (!raw) {
      return {token: null, email: null, role: null, error: null};
    }
    const parsed = JSON.parse(raw) as AuthState;
    return {
      token: parsed.token ?? null,
      email: parsed.email ?? null,
      role: parsed.role ?? null,
      error: null
    };
  } catch {
    return {token: null, email: null, role: null, error: null};
  }
}

function persist(state: AuthState): AuthState {
  try {
    sessionStorage.setItem('auth_state', JSON.stringify({
      token: state.token,
      email: state.email,
      role: state.role
    }));
  } catch {
    // ignore storage errors in private browsing contexts
  }
  return state;
}

const initialState: AuthState = loadInitialState();

export const authReducer = createReducer(
  initialState,
  on(loginSucceeded, (s, {response}) => persist({...s, token: response.accessToken, email: response.email, role: response.role, error: null})),
  on(loginFailed, (s, {error}) => ({...s, error})),
  on(logout, () => {
    try { sessionStorage.removeItem('auth_state'); } catch {}
    return {token: null, email: null, role: null, error: null};
  })
);
