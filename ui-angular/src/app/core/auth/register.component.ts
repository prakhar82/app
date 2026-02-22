import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from './auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <mat-card class="auth-card">
        <div class="badge">FreshMart</div>
        <h2>Create Account</h2>
        <p class="subtitle">Register and verify your email to start ordering.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="full">
            <input matInput placeholder="Email" formControlName="email" />
            <mat-error *ngIf="form.controls.email.touched && form.controls.email.invalid">Valid email is required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Name (optional)" formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Phone (optional)" formControlName="phone" /></mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <input matInput type="password" placeholder="Password" formControlName="password" />
            <mat-error *ngIf="form.controls.password.touched && form.controls.password.invalid">Password must be at least 6 chars</mat-error>
          </mat-form-field>
          <button mat-raised-button color="primary" class="full cta" type="submit" [disabled]="loading">
            {{ loading ? 'Creating...' : 'Register' }}
          </button>
        </form>
        <a routerLink="/login" class="link">Already have an account? Login</a>
        <p class="error" *ngIf="error">{{error}}</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem; background:
      radial-gradient(circle at 18% 20%, #dcf8ec 0%, transparent 42%),
      radial-gradient(circle at 82% 10%, #fff1d2 0%, transparent 36%),
      linear-gradient(145deg, #f8fcfa, #ecf6f2); }
    .auth-card { width: 100%; max-width: 500px; border-radius: 20px; padding: 1.2rem; background: rgba(255,255,255,.96); }
    .badge { display: inline-block; padding: .2rem .65rem; border-radius: 999px; font-size: .78rem; background: #dbf4e9; color: #0f766e; }
    .subtitle { color: #5f7068; margin: .2rem 0 .9rem; }
    .full { width: 100%; }
    .cta { height: 44px; margin-top: .2rem; }
    .link { display: inline-block; margin-top: .8rem; color: #0f766e; text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }
    .error { color: #b42318; margin-top: .5rem; }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    name: [''],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    this.error = '';
    if (this.loading) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please enter a valid email and password.';
      return;
    }
    this.loading = true;
    const value = this.form.getRawValue();
    this.auth.register({
      email: value.email!,
      name: value.name || undefined,
      phone: value.phone || undefined,
      password: value.password!
    }).subscribe({
      next: () => this.router.navigate(['/verify-email'], {queryParams: {email: value.email}}),
      error: (err) => {
        this.error = err?.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
