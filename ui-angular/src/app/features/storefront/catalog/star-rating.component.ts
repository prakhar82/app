import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rating" [class.interactive]="interactive" [style.--star-size]="size" [attr.aria-label]="ariaLabel">
      <div class="star" *ngFor="let star of stars">
        <span class="base">★</span>
        <span class="fill" [style.width.%]="fillPercent(star)">★</span>
        <ng-container *ngIf="interactive">
          <button type="button" class="hit left" (click)="select(star - 0.5)" [attr.aria-label]="'Rate ' + (star - 0.5) + ' stars'"></button>
          <button type="button" class="hit right" (click)="select(star)" [attr.aria-label]="'Rate ' + star + ' stars'"></button>
        </ng-container>
      </div>
      <span class="value" *ngIf="showValue">{{displayValue()}}</span>
    </div>
  `,
  styles: [`
    .rating { display: inline-flex; align-items: center; gap: .18rem; min-width: 0; }
    .star {
      position: relative;
      width: var(--star-size, 1.05rem);
      height: calc(var(--star-size, 1.05rem) * 1.08);
      line-height: 1;
      flex: 0 0 auto;
    }
    .base, .fill {
      position: absolute;
      inset: 0;
      font-size: var(--star-size, 1.05rem);
      line-height: 1;
      user-select: none;
      pointer-events: none;
    }
    .base { color: #d0ddd6; }
    .fill {
      color: #f2b94b;
      overflow: hidden;
      white-space: nowrap;
    }
    .interactive .star { cursor: pointer; }
    .hit {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 50%;
      border: 0;
      background: transparent;
      padding: 0;
      cursor: pointer;
    }
    .hit.left { left: 0; }
    .hit.right { right: 0; }
    .value { margin-left: .3rem; color: #567165; font-size: .88rem; white-space: nowrap; }
  `]
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() interactive = false;
  @Input() showValue = false;
  @Input() size = '1.05rem';
  @Input() ariaLabel = 'Star rating';
  @Output() ratingChange = new EventEmitter<number>();

  readonly stars = [1, 2, 3, 4, 5];

  fillPercent(star: number): number {
    const delta = Math.max(0, Math.min(1, this.rating - (star - 1)));
    return delta * 100;
  }

  select(value: number): void {
    if (!this.interactive) {
      return;
    }
    this.rating = value;
    this.ratingChange.emit(value);
  }

  displayValue(): string {
    return this.rating > 0 ? `${this.rating.toFixed(1)}/5` : 'No ratings';
  }
}
