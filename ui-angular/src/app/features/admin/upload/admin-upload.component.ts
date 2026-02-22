import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-admin-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Admin Excel Upload</h2>
    <input type="file" (change)="onFile($event)" accept=".xlsx" />
    <pre *ngIf="result">{{result | json}}</pre>
  `
})
export class AdminUploadComponent {
  private http = inject(HttpClient);
  result: any;

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const form = new FormData();
    form.append('file', input.files[0]);
    this.http.post(`${environment.apiBaseUrl}/catalog/catalog/admin/upload`, form).subscribe(r => this.result = r);
  }
}
