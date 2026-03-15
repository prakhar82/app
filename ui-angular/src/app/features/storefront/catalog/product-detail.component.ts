import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {catchError, forkJoin, of} from 'rxjs';
import {take} from 'rxjs/operators';
import {CatalogApiService, Product, ProductReview} from '../../../core/api/catalog-api.service';
import {InventoryApiService} from '../../../core/api/inventory-api.service';
import {CartApiService} from '../../../core/api/cart-api.service';
import {RouterLink} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {StarRatingComponent} from './star-rating.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, StarRatingComponent],
  template: `
    <div class="page" *ngIf="item">
      <mat-card class="detail">
        <img [src]="item.imageUrl || 'https://placehold.co/480x300'" [alt]="item.name" />
        <div>
          <h2>{{item.name}}</h2>
          <div class="rating-head">
            <app-star-rating [rating]="item.averageRating || 0" [showValue]="true" size="1.18rem" />
            <span class="review-count">{{item.reviewCount || 0}} review(s)</span>
          </div>
          <p>{{item.description}}</p>
          <p><strong>{{item.price | currency:'EUR'}}</strong> / {{item.unit}}</p>
          <p [class.bad]="item.availableQty <= 0">Available: {{item.availableQty ?? 0}}</p>
          <label class="qty-label">Qty <input type="number" [formControl]="qty" min="1" [max]="item.availableQty ?? 0" /></label>
          <p class="error" *ngIf="error">{{error}}</p>
          <p class="ok" *ngIf="success">{{success}}</p>
          <div class="actions">
            <button mat-raised-button color="primary" [disabled]="(item.availableQty ?? 0) <= 0" (click)="addToCart()">Add to Cart</button>
            <button mat-stroked-button routerLink="/app/cart">Go to Cart</button>
          </div>
        </div>
      </mat-card>

      <div class="review-layout">
        <mat-card class="review-form-card">
          <h3>Your Review</h3>
          <p class="muted">Rate this product with half-star precision and share a short comment.</p>
          <app-star-rating [rating]="reviewRating" [interactive]="true" [showValue]="true" size="1.45rem"
                           ariaLabel="Select your rating"
                           (ratingChange)="reviewRating = $event" />
          <mat-form-field appearance="outline" class="comment-field">
            <mat-label>Comment</mat-label>
            <textarea matInput [formControl]="reviewComment" rows="5" maxlength="1200"
                      placeholder="What did you like or dislike?"></textarea>
          </mat-form-field>
          <div class="review-actions">
            <button mat-raised-button color="primary" (click)="saveReview()" [disabled]="savingReview || reviewRating <= 0">
              {{savingReview ? 'Saving...' : 'Save Review'}}
            </button>
          </div>
        </mat-card>

        <mat-card class="review-list-card">
          <div class="review-list-head">
            <h3>Customer Reviews</h3>
            <span>{{reviews.length}} total</span>
          </div>

          <div class="review-list" *ngIf="reviews.length > 0; else emptyReviews">
            <article class="review-item" *ngFor="let review of reviews">
              <div class="review-top">
                <strong>{{review.userDisplayName}}</strong>
                <span>{{review.updatedAt | date:'mediumDate'}}</span>
              </div>
              <app-star-rating [rating]="review.rating" size="1rem" />
              <p class="comment" *ngIf="review.comment">{{review.comment}}</p>
            </article>
          </div>

          <ng-template #emptyReviews>
            <p class="muted">No reviews yet. Be the first to rate this product.</p>
          </ng-template>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .detail { display: grid; grid-template-columns: minmax(240px, 320px) 1fr; gap: 1rem; border-radius: 16px; }
    img { width: 100%; border-radius: 12px; object-fit: cover; }
    .rating-head { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; margin: .15rem 0 .4rem; }
    .review-count, .muted { color: #5f776c; }
    .bad { color: #a41818; font-weight: 700; }
    .qty-label { display: inline-flex; align-items: center; gap: .55rem; }
    .qty-label input { width: 90px; padding: .45rem .55rem; border: 1px solid #ccd8d2; border-radius: 8px; }
    .actions { display: flex; gap: .6rem; margin-top: .5rem; }
    .review-layout { display: grid; grid-template-columns: minmax(280px, 360px) 1fr; gap: 1rem; }
    .review-form-card, .review-list-card { border-radius: 16px; }
    .comment-field { width: 100%; margin-top: .85rem; }
    .review-actions { display: flex; justify-content: flex-start; }
    .review-list-head { display: flex; justify-content: space-between; gap: .7rem; align-items: center; margin-bottom: .8rem; }
    .review-list-head h3, .review-form-card h3 { margin: 0; }
    .review-list { display: grid; gap: .8rem; }
    .review-item { padding: .9rem; border: 1px solid #dfe8e3; border-radius: 12px; background: #fbfdfc; }
    .review-top { display: flex; justify-content: space-between; gap: .75rem; align-items: center; margin-bottom: .4rem; color: #567165; }
    .comment { margin: .55rem 0 0; color: #26463c; white-space: pre-wrap; }
    .error { color: #b42318; margin: .45rem 0 0; }
    .ok { color: #126b2f; margin: .45rem 0 0; }
    @media (max-width: 960px) {
      .detail, .review-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private catalogApi = inject(CatalogApiService);
  private inventoryApi = inject(InventoryApiService);
  private cartApi = inject(CartApiService);
  private store = inject(Store<{auth: {email: string | null}}>);
  qty = new FormControl(1, { nonNullable: true, validators: [Validators.min(1)] });
  reviewComment = new FormControl('', {nonNullable: true});
  item?: Product;
  reviews: ProductReview[] = [];
  error = '';
  success = '';
  reviewRating = 0;
  savingReview = false;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    forkJoin({
      products: this.catalogApi.listProducts(),
      inventory: this.inventoryApi.listItems(),
      reviews: id ? this.catalogApi.listReviews(Number(id)) : of([]),
      myReview: id ? this.catalogApi.getMyReview(Number(id)).pipe(catchError(() => of(null))) : of(null)
    }).subscribe(({products, inventory, reviews, myReview}) => {
      const found = products.find(p => String(p.id) === id);
      if (!found) {
        return;
      }
      const available = inventory.find(i => i.sku === found.sku)?.availableQty ?? 0;
      this.item = {...found, availableQty: available};
      this.reviews = reviews;
      if (myReview) {
        this.reviewRating = Number(myReview.rating);
        this.reviewComment.setValue(myReview.comment || '', {emitEvent: false});
      }
    });
  }

  addToCart(): void {
    this.error = '';
    this.success = '';
    if (!this.item) {
      return;
    }
    const quantity = Number(this.qty.value || 0);
    const available = this.item.availableQty ?? 0;
    if (quantity <= 0) {
      this.error = 'Quantity must be at least 1.';
      return;
    }
    if (quantity > available) {
      this.error = `Only ${available} item(s) available.`;
      return;
    }

    this.store.select('auth').pipe(take(1)).subscribe(auth => {
      const email = auth.email;
      if (!email) {
        this.error = 'Please login again.';
        return;
      }
      this.cartApi.list(email).subscribe(cart => {
        const existing = cart.find(c => c.sku === this.item!.sku);
        const newQty = (existing?.quantity ?? 0) + quantity;
        if (newQty > available) {
          this.error = `Cart qty cannot exceed available stock (${available}).`;
          return;
        }
        this.cartApi.upsert({
          userEmail: email,
          sku: this.item!.sku,
          itemName: this.item!.name,
          quantity: newQty
        }).subscribe({
          next: () => {
            this.item = {...this.item!, availableQty: Math.max(0, available - quantity)};
            this.success = 'Added to cart.';
          },
          error: (err) => {
            this.error = err?.error?.message || 'Unable to add to cart.';
          }
        });
      });
    });
  }

  saveReview(): void {
    if (!this.item || this.reviewRating <= 0) {
      this.error = 'Select a rating before saving your review.';
      return;
    }
    this.error = '';
    this.success = '';
    this.savingReview = true;
    this.catalogApi.saveMyReview(this.item.id, {
      rating: this.reviewRating,
      comment: this.reviewComment.value || undefined
    }).subscribe({
      next: () => {
        this.savingReview = false;
        this.success = 'Review saved.';
        this.reloadReviews(this.item!.id);
      },
      error: (err) => {
        this.savingReview = false;
        this.error = err?.error?.message || 'Unable to save review.';
      }
    });
  }

  private reloadReviews(productId: number): void {
    forkJoin({
      products: this.catalogApi.listProducts(),
      reviews: this.catalogApi.listReviews(productId),
      myReview: this.catalogApi.getMyReview(productId).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({products, reviews, myReview}) => {
        if (this.item) {
          const refreshed = products.find(p => p.id === this.item?.id);
          if (refreshed) {
            this.item = {...this.item, ...refreshed};
          }
        }
        this.reviews = reviews;
        if (myReview) {
          this.reviewRating = Number(myReview.rating);
          this.reviewComment.setValue(myReview.comment || '', {emitEvent: false});
        }
      }
    });
  }
}
