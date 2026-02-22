import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatTabsModule} from '@angular/material/tabs';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {MeApiService, MeProfile} from '../../../core/api/me-api.service';
import {Address} from '../../../core/api/address-api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTabsModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule, MatCardModule
  ],
  template: `
    <section class="profile-shell">
      <header class="profile-header">
        <h2>My Profile</h2>
        <p>Manage your personal details and delivery addresses.</p>
      </header>
    <mat-tab-group class="profile-tabs">
      <mat-tab label="Profile">
        <mat-card class="card">
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Email" formControlName="email" readonly /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Full name" formControlName="name" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Phone" formControlName="phone" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Preferred language (en/nl)" formControlName="preferredLanguage" /></mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Default delivery address</mat-label>
              <mat-select formControlName="defaultAddressId">
                <mat-option [value]="null">None</mat-option>
                <mat-option *ngFor="let a of addresses" [value]="a.id">{{addressLabel(a)}}</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="savingProfile">
              {{ savingProfile ? 'Saving...' : 'Save Profile' }}
            </button>
          </form>
        </mat-card>
      </mat-tab>

      <mat-tab label="Addresses">
        <mat-card class="card">
          <h3>Add Address</h3>
          <form [formGroup]="addressForm" (ngSubmit)="addAddress()">
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Label" formControlName="label" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Line 1" formControlName="line1" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Line 2" formControlName="line2" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="City" formControlName="city" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Postcode (e.g. 5611AB)" formControlName="postcode" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><input matInput placeholder="Country" formControlName="country" /></mat-form-field>
            <button mat-raised-button color="primary" [disabled]="addressForm.invalid">Add Address</button>
          </form>
        </mat-card>

        <mat-card class="card" *ngFor="let a of addresses">
          <div class="row">
            <div>
              <strong>{{a.label || 'Address'}}</strong>
              <div>{{a.line1}} {{a.line2}}</div>
              <div>{{a.postcode}} {{a.city}}, {{a.country}}</div>
            </div>
            <div class="actions">
              <button mat-stroked-button (click)="setDefault(a)">Set default</button>
              <button mat-stroked-button color="warn" (click)="remove(a)">Delete</button>
            </div>
          </div>
        </mat-card>
      </mat-tab>
    </mat-tab-group>
    </section>
    <p class="ok" *ngIf="success">{{success}}</p>
    <p class="err" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .profile-shell { max-width: 980px; margin: 0 auto; }
    .profile-header { margin-bottom: .75rem; }
    .profile-header h2 { margin: 0; font-size: 1.6rem; }
    .profile-header p { margin: .2rem 0 0; color: #5f6f67; }
    .profile-tabs { background: #fff; border-radius: 14px; }
    .card { margin-top: .75rem; border-radius: 12px; padding: 1rem; background: #fcfffd; }
    .full { width: 100%; }
    .row { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .actions { display: flex; gap: .5rem; }
    .ok { color: #106b2f; max-width: 980px; margin: .75rem auto 0; }
    .err { color: #b42318; max-width: 980px; margin: .75rem auto 0; }
    @media (max-width: 860px) { .row { flex-direction: column; align-items: flex-start; } }
  `]
})
export class ProfileComponent {
  private api = inject(MeApiService);
  private fb = inject(FormBuilder);

  profile: MeProfile | null = null;
  addresses: Address[] = [];
  success = '';
  error = '';
  savingProfile = false;

  profileForm = this.fb.group({
    email: [{value: '', disabled: true}],
    name: [''],
    phone: [''],
    preferredLanguage: [''],
    defaultAddressId: [null as number | null]
  });

  addressForm = this.fb.group({
    label: ['Home'],
    line1: ['', [Validators.required]],
    line2: [''],
    city: ['Eindhoven', [Validators.required]],
    postcode: ['', [Validators.required, Validators.pattern(/^[0-9]{4}\s?[A-Za-z]{2}$/)]],
    country: ['NL', [Validators.required]],
    isDefault: [false]
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.error = '';
    this.success = '';
    this.api.me().subscribe({
      next: (me) => {
        this.profile = me;
        this.profileForm.patchValue({
          email: me.email,
          name: me.name || '',
          phone: me.phone || '',
          preferredLanguage: me.preferredLanguage || '',
          defaultAddressId: me.defaultAddressId ?? null
        });
      },
      error: (err) => this.error = err?.error?.message || 'Failed to load profile'
    });
    this.api.listAddresses().subscribe({
      next: addresses => this.addresses = addresses,
      error: (err) => this.error = err?.error?.message || 'Failed to load addresses'
    });
  }

  saveProfile(): void {
    this.error = '';
    this.success = '';
    this.savingProfile = true;
    const value = this.profileForm.getRawValue();
    const rawDefault = value.defaultAddressId;
    const normalizedDefault = rawDefault === null || rawDefault === undefined ? null : Number(rawDefault);
    this.api.update({
      name: (value.name || '').trim() || undefined,
      phone: (value.phone || '').trim() || undefined,
      preferredLanguage: (value.preferredLanguage || '').trim() || undefined,
      defaultAddressId: Number.isNaN(normalizedDefault as number) ? null : normalizedDefault
    }).subscribe({
      next: () => {
        this.savingProfile = false;
        this.success = 'Profile updated';
        this.reload();
      },
      error: (err) => {
        this.savingProfile = false;
        this.error = err?.error?.message || 'Failed to update profile';
      }
    });
  }

  addAddress(): void {
    if (this.addressForm.invalid) {
      return;
    }
    this.api.addAddress(this.addressForm.getRawValue() as Address).subscribe({
      next: () => {
        this.success = 'Address added';
        this.addressForm.patchValue({line1: '', line2: '', postcode: ''});
        this.reload();
      },
      error: (err) => this.error = err?.error?.message || 'Failed to add address'
    });
  }

  setDefault(address: Address): void {
    if (!address.id) return;
    this.api.setDefaultAddress(address.id).subscribe({
      next: () => {
        this.success = 'Default address updated';
        this.reload();
      },
      error: (err) => this.error = err?.error?.message || 'Failed to set default'
    });
  }

  remove(address: Address): void {
    if (!address.id) return;
    this.api.deleteAddress(address.id).subscribe({
      next: () => {
        this.success = 'Address deleted';
        this.reload();
      },
      error: (err) => this.error = err?.error?.message || 'Failed to delete address'
    });
  }

  addressLabel(a: Address): string {
    return `${a.label || 'Address'} - ${a.line1}, ${a.postcode}`;
  }
}
