import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {loginFailed, loginSucceeded} from '../../state/auth/auth.actions';
import {AuthService} from './auth.service';
import {environment} from '../../../environments/environment';
import {MatCardModule} from '@angular/material/card';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, RouterLink],
  template: `
    <div class="login-wrap">
      <mat-card class="login-card">
        <div class="badge">FreshMart</div>
        <h2>Welcome Back</h2>
        <p class="subtitle">Login to manage your grocery store or continue shopping.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="full">
            <input matInput formControlName="email" placeholder="Email" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <input matInput type="password" formControlName="password" placeholder="Password" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" class="full cta">Sign in</button>
        </form>
        <button *ngIf="environment.authMode === 'GOOGLE'" mat-stroked-button color="accent" (click)="google()" class="full google">Continue with Google</button>
        <p *ngIf="environment.authMode !== 'GOOGLE'" class="hint">Google login is disabled in local DEV mode.</p>
        <a routerLink="/register" class="link">Create account</a>
        <p class="error" *ngIf="error">{{error}}</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem; background:
      radial-gradient(circle at 20% 18%, #d9f7ea 0%, transparent 40%),
      radial-gradient(circle at 82% 8%, #fff2cf 0%, transparent 38%),
      linear-gradient(140deg, #f7fcfa, #edf7f3); }
    .login-card { width: 100%; max-width: 460px; border-radius: 20px; padding: 1.2rem; background: rgba(255,255,255,.95); }
    h2 { margin: .35rem 0 .25rem; }
    .badge { display: inline-block; padding: .2rem .65rem; border-radius: 999px; font-size: .78rem; background: #dbf4e9; color: #0f766e; }
    .subtitle { color: #5c6b63; margin-top: 0; margin-bottom: .9rem; }
    .full { width: 100%; }
    .cta { height: 44px; margin-top: .2rem; }
    .google { margin-top: .75rem; height: 42px; }
    .hint { margin: .75rem 0 0; color: #557067; font-size: .86rem; }
    .link { display: inline-block; margin-top: .8rem; color: #0f766e; text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }
    .error { color: #b42318; margin-top: .5rem; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private authService = inject(AuthService);
  private router = inject(Router);
  environment = environment;
  form = this.fb.group({email: ['', [Validators.required]], password: ['', [Validators.required]]});
  error = '';

  submit(): void {
    const {email, password} = this.form.getRawValue();
    this.error = '';
    this.authService.login(email!, password!).subscribe({
      next: response => {
        this.store.dispatch(loginSucceeded({response}));
        this.router.navigateByUrl(response.role === 'ADMIN' ? '/admin/dashboard' : '/app/dashboard');
      },
      error: (err) => {
        const message = err?.error?.message || 'Login failed';
        this.error = message;
        this.store.dispatch(loginFailed({error: message}));
        if (err?.error?.code === 'ACCOUNT_NOT_ACTIVE') {
          this.router.navigate(['/verify-email'], {queryParams: {email}});
        }
      }
    });
  }

  google(): void {
    this.authService.googleLogin();
  }
}
