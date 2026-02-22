import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {Router, RouterLink} from '@angular/router';
import {Store} from '@ngrx/store';
import {take} from 'rxjs/operators';
import {forkJoin} from 'rxjs';
import {CartApiService, CartItem} from '../../../core/api/cart-api.service';
import {CatalogApiService} from '../../../core/api/catalog-api.service';
import {OrderApiService} from '../../../core/api/order-api.service';
import {Address, AddressApiService} from '../../../core/api/address-api.service';
import {PostcodeApiService} from '../../../core/api/postcode-api.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatRadioModule, MatSelectModule, MatCheckboxModule, RouterLink
  ],
  template: `
    <h2>Checkout</h2>
    <p class="muted">Select delivery address and payment method.</p>

    <div class="layout" *ngIf="!loading; else loadingTpl">
      <mat-card class="left">
        <h3>Delivery Address</h3>

        <mat-radio-group [formControl]="addressMode">
          <mat-radio-button value="SAVED">Use saved address</mat-radio-button>
          <mat-radio-button value="NEW" class="ml">Add new address</mat-radio-button>
        </mat-radio-group>

        <div *ngIf="addressMode.value==='SAVED'" class="block">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Saved addresses</mat-label>
            <mat-select [formControl]="selectedAddressId">
              <mat-option *ngFor="let a of addresses" [value]="a.id">{{addressLabel(a)}}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <form [formGroup]="newAddressForm" *ngIf="addressMode.value==='NEW'" class="block">
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Label (Home/Work)" formControlName="label"/></mat-form-field>
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Line 1" formControlName="line1"/></mat-form-field>
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Line 2" formControlName="line2"/></mat-form-field>
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="City" formControlName="city"/></mat-form-field>
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Postcode (e.g. 5611AB)" formControlName="postcode" (blur)="validatePostcode()"/></mat-form-field>
          <mat-form-field appearance="outline" class="full"><input matInput placeholder="Country" formControlName="country"/></mat-form-field>
          <mat-checkbox formControlName="saveToProfile">Save this address to profile</mat-checkbox>
          <p class="error" *ngIf="postcodeError">{{postcodeError}}</p>
        </form>

        <h3>Payment Method</h3>
        <mat-radio-group [formControl]="paymentMethod">
          <mat-radio-button value="COD">Cash on Delivery</mat-radio-button>
          <mat-radio-button value="ONLINE" class="ml">Online Payment</mat-radio-button>
        </mat-radio-group>
      </mat-card>

      <mat-card class="right">
        <h3>Order Summary</h3>
        <div class="empty" *ngIf="items.length === 0">Your cart is empty.</div>
        <div class="line" *ngFor="let item of items">
          <span>{{item.itemName}} x {{item.quantity}}</span>
          <strong>{{lineTotal(item) | currency:'EUR'}}</strong>
        </div>
        <div class="total" *ngIf="items.length > 0">
          <span>Total</span>
          <strong>{{totalPrice() | currency:'EUR'}}</strong>
        </div>

        <button mat-raised-button color="primary" class="full" (click)="placeOrder()" [disabled]="items.length===0 || placing">
          {{ placing ? 'Placing Order...' : 'Place Order' }}
        </button>
        <button mat-stroked-button class="full mt" routerLink="/app/cart">Back to Cart</button>

        <p class="error" *ngIf="error">{{error}}</p>
        <p class="ok" *ngIf="success">{{success}}</p>
      </mat-card>
    </div>

    <ng-template #loadingTpl><p>Loading checkout...</p></ng-template>
  `,
  styles: [`
    .muted { color: #4d6057; margin-top: -.25rem; }
    .layout { display: grid; grid-template-columns: 1.2fr .8fr; gap: 1rem; }
    .left, .right { border-radius: 14px; }
    .full { width: 100%; }
    .line, .total { display: flex; justify-content: space-between; margin: .5rem 0; }
    .total { border-top: 1px solid #d2ded8; padding-top: .6rem; font-size: 1.05rem; }
    .empty { color: #61766d; }
    .mt { margin-top: .5rem; }
    .ml { margin-left: 1rem; }
    .block { margin-top: .75rem; }
    .error { color: #b42318; margin-top: .5rem; }
    .ok { color: #126b2f; margin-top: .5rem; }
    @media (max-width: 920px) { .layout { grid-template-columns: 1fr; } }
  `]
})
export class CheckoutComponent {
  private store = inject(Store<{auth: {email: string | null}}>);
  private cartApi = inject(CartApiService);
  private catalogApi = inject(CatalogApiService);
  private orderApi = inject(OrderApiService);
  private addressApi = inject(AddressApiService);
  private postcodeApi = inject(PostcodeApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  paymentMethod = this.fb.control<'COD' | 'ONLINE'>('COD', [Validators.required]);
  addressMode = this.fb.control<'SAVED' | 'NEW'>('SAVED', [Validators.required]);
  selectedAddressId = this.fb.control<number | null>(null);
  newAddressForm = this.fb.group({
    label: ['Home'],
    line1: ['', [Validators.required]],
    line2: [''],
    city: ['Eindhoven', [Validators.required]],
    postcode: ['', [Validators.required, Validators.pattern(/^[0-9]{4}\s?[A-Za-z]{2}$/)]],
    country: ['NL', [Validators.required]],
    saveToProfile: [true]
  });

  email = '';
  items: CartItem[] = [];
  addresses: Address[] = [];
  priceBySku: Record<string, number> = {};
  loading = true;
  placing = false;
  error = '';
  success = '';
  postcodeError = '';

  constructor() {
    this.store.select('auth').pipe(take(1)).subscribe(auth => {
      if (!auth.email) {
        this.error = 'Please login again.';
        this.loading = false;
        return;
      }
      this.email = auth.email;
      forkJoin({
        cart: this.cartApi.list(this.email),
        products: this.catalogApi.listProducts(),
        addresses: this.addressApi.list()
      }).subscribe({
        next: ({cart, products, addresses}) => {
          this.items = cart;
          this.addresses = addresses;
          this.selectedAddressId.setValue(addresses.find(a => a.isDefault)?.id ?? addresses[0]?.id ?? null);
          this.priceBySku = Object.fromEntries(products.map(p => [p.sku, Number(p.price || 0)]));
          if (addresses.length === 0) {
            this.addressMode.setValue('NEW');
          }
          this.loading = false;
        },
        error: () => {
          this.error = 'Unable to load checkout data.';
          this.loading = false;
        }
      });
    });
  }

  lineTotal(item: CartItem): number {
    return (this.priceBySku[item.sku] ?? 0) * item.quantity;
  }

  totalPrice(): number {
    return this.items.reduce((sum, item) => sum + this.lineTotal(item), 0);
  }

  addressLabel(a: Address): string {
    return `${a.label || 'Address'} - ${a.line1}, ${a.postcode} ${a.city}`;
  }

  validatePostcode(): void {
    if (this.addressMode.value !== 'NEW') {
      this.postcodeError = '';
      return;
    }
    const postcode = this.newAddressForm.getRawValue().postcode || '';
    if (!postcode) {
      return;
    }
    this.postcodeApi.validate(postcode, this.newAddressForm.getRawValue().country || 'NL').subscribe({
      next: (resp) => {
        this.postcodeError = resp.allowed ? '' : (resp.reason || 'Postcode not allowed');
      },
      error: () => this.postcodeError = 'Unable to validate postcode now'
    });
  }

  placeOrder(): void {
    this.error = '';
    this.success = '';
    if (this.items.length === 0 || this.placing) {
      return;
    }
    if (this.addressMode.value === 'NEW' && (this.newAddressForm.invalid || this.postcodeError)) {
      this.error = this.postcodeError || 'Please provide a valid address';
      return;
    }
    if (this.addressMode.value === 'SAVED' && !this.selectedAddressId.value) {
      this.error = 'Please select a saved address';
      return;
    }

    this.placing = true;
    const payload = {
      paymentMethod: this.paymentMethod.value!,
      items: this.items.map(item => ({
        sku: item.sku,
        name: item.itemName,
        qty: item.quantity,
        unitPrice: this.priceBySku[item.sku] ?? 0
      })),
      addressMode: this.addressMode.value!,
      addressId: this.addressMode.value === 'SAVED' ? this.selectedAddressId.value! : undefined,
      saveAddress: this.addressMode.value === 'NEW' ? !!this.newAddressForm.getRawValue().saveToProfile : undefined,
      newAddress: this.addressMode.value === 'NEW' ? {
        label: this.newAddressForm.getRawValue().label || undefined,
        line1: this.newAddressForm.getRawValue().line1!,
        line2: this.newAddressForm.getRawValue().line2 || undefined,
        city: this.newAddressForm.getRawValue().city!,
        postcode: this.newAddressForm.getRawValue().postcode!,
        country: this.newAddressForm.getRawValue().country!
      } : undefined
    };

    this.orderApi.checkout(payload).subscribe({
      next: (res) => {
        const deletes = this.items.map(item => this.cartApi.delete(this.email, item.sku));
        forkJoin(deletes).subscribe({
          next: () => {
            this.success = `Order ${res.orderRef} placed successfully.`;
            this.items = [];
            this.placing = false;
            setTimeout(() => this.router.navigateByUrl('/app/orders'), 700);
          },
          error: () => {
            this.placing = false;
            this.error = `Order ${res.orderRef} placed, but cart cleanup failed.`;
          }
        });
      },
      error: (err) => {
        this.placing = false;
        this.error = err?.error?.message || 'Unable to place order.';
      }
    });
  }
}
