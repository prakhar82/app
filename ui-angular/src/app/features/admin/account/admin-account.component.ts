import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {PaymentAdminApiService} from '../../../core/api/payment-admin-api.service';

@Component({
  selector: 'app-admin-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <h3>Payment Account</h3>
    <p class="muted">Update the account details that receive incoming payments.</p>

    <mat-card class="card">
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full"><input matInput placeholder="Account holder name" formControlName="accountHolderName" /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><input matInput placeholder="IBAN" formControlName="iban" /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><input matInput placeholder="Bank name" formControlName="bankName" /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><input matInput placeholder="Payment reference" formControlName="paymentReference" /></mat-form-field>
        <button mat-raised-button color="primary" type="submit" [disabled]="saving">
          {{ saving ? 'Saving...' : 'Save Payment Account' }}
        </button>
      </form>
    </mat-card>

    <p class="ok" *ngIf="success">{{success}}</p>
    <p class="err" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .muted { color: #587067; margin-top: -.25rem; }
    .card { margin-top: .75rem; border-radius: 12px; padding: 1rem; background: #fcfffd; }
    .full { width: 100%; }
    .ok { color: #106b2f; margin-top: .75rem; }
    .err { color: #b42318; margin-top: .75rem; }
  `]
})
export class AdminAccountComponent {
  private api = inject(PaymentAdminApiService);
  private fb = inject(FormBuilder);

  saving = false;
  success = '';
  error = '';

  form = this.fb.group({
    accountHolderName: [''],
    iban: [''],
    bankName: [''],
    paymentReference: ['']
  });

  constructor() {
    this.api.getAccount().subscribe({
      next: (account) => this.form.patchValue({
        accountHolderName: account.accountHolderName || '',
        iban: account.iban || '',
        bankName: account.bankName || '',
        paymentReference: account.paymentReference || ''
      }),
      error: (err) => this.error = err?.error?.message || 'Failed to load payment account'
    });
  }

  save(): void {
    this.error = '';
    this.success = '';
    this.saving = true;
    const value = this.form.getRawValue();
    this.api.updateAccount({
      accountHolderName: (value.accountHolderName || '').trim() || undefined,
      iban: (value.iban || '').trim() || undefined,
      bankName: (value.bankName || '').trim() || undefined,
      paymentReference: (value.paymentReference || '').trim() || undefined
    }).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Payment account updated';
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Failed to update payment account';
      }
    });
  }
}
