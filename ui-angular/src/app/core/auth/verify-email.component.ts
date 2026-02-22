import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from './auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <mat-card class="auth-card">
        <div class="badge">FreshMart</div>
        <h2>Verify Email</h2>
        <p class="subtitle">Enter the verification code sent to your inbox.</p>
        <form [formGroup]="form" (ngSubmit)="verify()">
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Email" formControlName="email" /></mat-form-field>
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Verification code" formControlName="code" /></mat-form-field>
          <button mat-raised-button color="primary" class="full cta" [disabled]="form.invalid || loading">
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
        </form>
        <button mat-stroked-button class="full resend" (click)="resend()" [disabled]="loading">Resend code</button>
        <a routerLink="/login" class="link">Back to login</a>
        <p class="ok" *ngIf="ok">{{ok}}</p>
        <p class="error" *ngIf="error">{{error}}</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem; background:
      radial-gradient(circle at 20% 16%, #dcf8ec 0%, transparent 42%),
      radial-gradient(circle at 82% 10%, #fff1d2 0%, transparent 36%),
      linear-gradient(145deg, #f8fcfa, #ecf6f2); }
    .auth-card { width: 100%; max-width: 500px; border-radius: 20px; padding: 1.2rem; background: rgba(255,255,255,.96); }
    .badge { display: inline-block; padding: .2rem .65rem; border-radius: 999px; font-size: .78rem; background: #dbf4e9; color: #0f766e; }
    .subtitle { color: #5f7068; margin: .2rem 0 .9rem; }
    .full { width: 100%; margin-bottom: .5rem; }
    .cta { height: 44px; }
    .resend { height: 40px; margin-top: .25rem; }
    .link { display: inline-block; margin-top: .65rem; color: #0f766e; text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }
    .error { color: #b42318; margin-top: .5rem; }
    .ok { color: #106b2f; margin-top: .5rem; }
  `]
})
export class VerifyEmailComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = false;
  error = '';
  ok = '';
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required]]
  });

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.patchValue({email});
    }
  }

  verify(): void {
    this.loading = true;
    this.error = '';
    this.ok = '';
    const {email, code} = this.form.getRawValue();
    this.auth.verify({email: email!, code: code!}).subscribe({
      next: () => {
        this.ok = 'Email verified. Redirecting to login...';
        setTimeout(() => this.router.navigateByUrl('/login'), 700);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Verification failed';
        this.loading = false;
      }
    });
  }

  resend(): void {
    const email = this.form.getRawValue().email;
    if (!email) {
      this.error = 'Email is required';
      return;
    }
    this.loading = true;
    this.error = '';
    this.ok = '';
    this.auth.resendCode(email).subscribe({
      next: () => {
        this.ok = 'Verification code resent. Check your email.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to resend code';
        this.loading = false;
      }
    });
  }
}
