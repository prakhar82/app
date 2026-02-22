import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule],
  template: `
    <div class="tiles">
      <mat-card><h3>Fruits</h3><p>Fresh and seasonal picks.</p><button mat-button routerLink="/app/products">Explore</button></mat-card>
      <mat-card><h3>Vegetables</h3><p>Healthy greens daily.</p><button mat-button routerLink="/app/products">Explore</button></mat-card>
      <mat-card><h3>Dairy</h3><p>Milk, cheese and essentials.</p><button mat-button routerLink="/app/products">Explore</button></mat-card>
    </div>
  `,
  styles: [`
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; }
    mat-card { border-radius: 16px; background: linear-gradient(160deg, #ffffff, #f2faf4); }
    h3 { margin: 0 0 .4rem; }
    p { margin: 0 0 .75rem; color: #486258; }
  `]
})
export class UserDashboardComponent {}

