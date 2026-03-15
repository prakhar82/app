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
        <div class="link-row">
          <a class="link action-link" (click)="toggleForgot()">{{resetOpen ? 'Hide reset form' : 'Forgot password?'}}</a>
          <a routerLink="/register" class="link">Create account</a>
        </div>
        <div class="reset-box" *ngIf="resetOpen">
          <h3>Reset password</h3>
          <mat-form-field appearance="outline" class="full">
            <input matInput [formControl]="forgotForm.controls.email" placeholder="Email" />
          </mat-form-field>
          <ng-container *ngIf="resetStep === 'request'; else resetFields">
            <button mat-stroked-button color="primary" class="full" type="button" (click)="requestReset()">Send reset code</button>
          </ng-container>
          <ng-template #resetFields>
            <mat-form-field appearance="outline" class="full">
              <input matInput [formControl]="forgotForm.controls.code" placeholder="Reset code" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <input matInput type="password" [formControl]="forgotForm.controls.newPassword" placeholder="New password" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <input matInput type="password" [formControl]="forgotForm.controls.confirmPassword" placeholder="Confirm new password" />
            </mat-form-field>
            <button mat-raised-button color="primary" class="full" type="button" (click)="submitReset()">Reset password</button>
          </ng-template>
          <p class="ok" *ngIf="forgotSuccess">{{forgotSuccess}}</p>
          <p class="error" *ngIf="forgotError">{{forgotError}}</p>
        </div>
        <p class="error" *ngIf="error">{{error}}</p>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100dvh; overflow: hidden; }
    .login-wrap { height: 100dvh; display: grid; place-items: center; padding: .75rem; box-sizing: border-box; overflow: hidden; background:
      radial-gradient(circle at 20% 18%, #d9f7ea 0%, transparent 40%),
      radial-gradient(circle at 82% 8%, #fff2cf 0%, transparent 38%),
      linear-gradient(140deg, #f7fcfa, #edf7f3); }
    .login-card { width: 100%; max-width: 430px; border-radius: 20px; padding: 1rem; background: rgba(255,255,255,.95); }
    h2 { margin: .35rem 0 .25rem; }
    .badge { display: inline-block; padding: .2rem .65rem; border-radius: 999px; font-size: .78rem; background: #dbf4e9; color: #0f766e; }
    .subtitle { color: #5c6b63; margin-top: 0; margin-bottom: .9rem; }
    .full { width: 100%; }
    .cta { height: 44px; margin-top: .2rem; }
    .google { margin-top: .75rem; height: 42px; }
    .hint { margin: .75rem 0 0; color: #557067; font-size: .86rem; }
    .link-row { display: flex; justify-content: space-between; align-items: center; gap: .8rem; flex-wrap: wrap; margin-top: .8rem; }
    .link { display: inline-block; color: #0f766e; text-decoration: none; font-weight: 600; }
    .action-link { cursor: pointer; }
    .link:hover { text-decoration: underline; }
    .reset-box { margin-top: .8rem; padding-top: .8rem; border-top: 1px solid #e4ece7; }
    .reset-box h3 { margin: 0 0 .65rem; font-size: 1rem; }
    .ok { color: #126b2f; margin-top: .5rem; }
    .error { color: #b42318; margin-top: .5rem; }
    @media (max-width: 640px) {
      .login-card { max-width: none; padding: .9rem; }
      .subtitle { margin-bottom: .7rem; }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private authService = inject(AuthService);
  private router = inject(Router);
  environment = environment;
  form = this.fb.group({email: ['', [Validators.required]], password: ['', [Validators.required]]});
  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: [''],
    newPassword: [''],
    confirmPassword: ['']
  });
  error = '';
  forgotError = '';
  forgotSuccess = '';
  resetOpen = false;
  resetStep: 'request' | 'reset' = 'request';

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

  toggleForgot(): void {
    this.resetOpen = !this.resetOpen;
    this.forgotError = '';
    this.forgotSuccess = '';
  }

  requestReset(): void {
    const email = (this.forgotForm.controls.email.value || '').trim();
    if (!email) {
      this.forgotError = 'Email is required.';
      return;
    }
    this.forgotError = '';
    this.forgotSuccess = '';
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.resetStep = 'reset';
        this.forgotSuccess = 'Reset code sent to your email.';
      },
      error: (err) => {
        this.forgotError = err?.error?.message || 'Unable to send reset code.';
      }
    });
  }

  submitReset(): void {
    const email = (this.forgotForm.controls.email.value || '').trim();
    const code = (this.forgotForm.controls.code.value || '').trim();
    const newPassword = this.forgotForm.controls.newPassword.value || '';
    const confirmPassword = this.forgotForm.controls.confirmPassword.value || '';
    if (!email || !code || !newPassword) {
      this.forgotError = 'Email, reset code, and new password are required.';
      return;
    }
    if (newPassword !== confirmPassword) {
      this.forgotError = 'Passwords do not match.';
      return;
    }
    this.forgotError = '';
    this.forgotSuccess = '';
    this.authService.resetPassword({email, code, newPassword}).subscribe({
      next: () => {
        this.resetOpen = true;
        this.resetStep = 'request';
        this.forgotForm.patchValue({code: '', newPassword: '', confirmPassword: ''});
        this.forgotSuccess = 'Password reset successfully. Please sign in.';
      },
      error: (err) => {
        this.forgotError = err?.error?.message || 'Unable to reset password.';
      }
    });
  }
}
