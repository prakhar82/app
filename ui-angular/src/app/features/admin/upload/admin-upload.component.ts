import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-admin-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  template: `
    <h3>Admin Tools</h3>
    <p class="muted">Backup app data, restore from backup.zip, clean non-admin data, and download reports.</p>

    <div class="grid">
      <mat-card class="tool-card">
        <h4>Inventory Upload</h4>
        <p>Upload the Excel inventory and catalog file here.</p>
        <input type="file" accept=".xlsx,.xls" (change)="onUploadFile($event)" />
        <button mat-raised-button color="primary" (click)="uploadInventory()" [disabled]="!uploadFile">
          Upload Inventory Excel
        </button>
        <pre class="result" *ngIf="uploadResult">{{uploadResult | json}}</pre>
      </mat-card>

      <mat-card class="tool-card">
        <h4>Backup</h4>
        <p>Download full app-data backup as backup.zip.</p>
        <button mat-raised-button color="primary" (click)="downloadBackup()" [disabled]="busy === 'backup'">
          {{busy === 'backup' ? 'Preparing...' : 'Download backup.zip'}}
        </button>
      </mat-card>

      <mat-card class="tool-card">
        <h4>Restore</h4>
        <p>Upload a previously downloaded backup zip and restore all app records.</p>
        <input type="file" accept=".zip" (change)="onRestoreFile($event)" />
        <button mat-raised-button color="primary" (click)="restoreBackup()" [disabled]="!restoreFile || busy === 'restore'">
          {{busy === 'restore' ? 'Restoring...' : 'Upload backup.zip'}}
        </button>
      </mat-card>

      <mat-card class="tool-card danger">
        <h4>Cleanup</h4>
        <p>Delete app data but keep admin users. Use this only after downloading a backup.</p>
        <button mat-raised-button color="warn" (click)="cleanup()" [disabled]="busy === 'cleanup'">
          {{busy === 'cleanup' ? 'Cleaning...' : 'Clean System'}}
        </button>
      </mat-card>
    </div>

    <div class="grid reports">
      <mat-card class="tool-card">
        <h4>Orders Report</h4>
        <p>Export all orders in PDF or Excel format.</p>
        <div class="row">
          <button mat-stroked-button (click)="downloadReport('orders', 'pdf')">PDF</button>
          <button mat-stroked-button (click)="downloadReport('orders', 'xlsx')">Excel</button>
        </div>
      </mat-card>

      <mat-card class="tool-card">
        <h4>Inventory Report</h4>
        <p>Export inventory with low-stock items on top where available qty is below or equal to threshold.</p>
        <div class="row">
          <button mat-stroked-button (click)="downloadReport('inventory', 'pdf')">PDF</button>
          <button mat-stroked-button (click)="downloadReport('inventory', 'xlsx')">Excel</button>
        </div>
      </mat-card>
    </div>

    <p class="ok" *ngIf="message">{{message}}</p>
    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles: [`
    .muted { color: #587067; margin-top: -.25rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: .9rem; margin-top: .9rem; }
    .reports { margin-top: 1rem; }
    .tool-card { border-radius: 14px; display: flex; flex-direction: column; gap: .8rem; }
    .tool-card h4 { margin: 0; }
    .tool-card p { margin: 0; color: #5c7369; }
    .tool-card input { width: 100%; }
    .tool-card.danger { border: 1px solid #efc1bb; background: #fff8f6; }
    .row { display: flex; gap: .6rem; flex-wrap: wrap; }
    .result { margin: 0; max-height: 220px; overflow: auto; padding: .7rem; border-radius: 10px; background: #f4f8f6; font-size: .82rem; }
    .ok { color: #126b2f; margin-top: .8rem; }
    .error { color: #b42318; margin-top: .8rem; }
  `]
})
export class AdminUploadComponent {
  private readonly http = inject(HttpClient);
  busy: '' | 'backup' | 'restore' | 'cleanup' = '';
  error = '';
  message = '';
  restoreFile: File | null = null;
  uploadFile: File | null = null;
  uploadResult: any = null;

  downloadBackup(): void {
    this.busy = 'backup';
    this.clearMessages();
    this.http.get(`${environment.apiBaseUrl}/identity/admin/tools/backup`, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: response => {
        this.busy = '';
        this.saveBlob(response.body || new Blob(), this.fileNameFromHeader(response.headers.get('content-disposition')) || 'backup.zip');
        this.message = 'Backup downloaded.';
      },
      error: err => {
        this.busy = '';
        this.error = err?.error?.message || 'Unable to download backup.';
      }
    });
  }

  onRestoreFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.restoreFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  onUploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  uploadInventory(): void {
    if (!this.uploadFile) {
      return;
    }
    this.clearMessages();
    this.uploadResult = null;
    const form = new FormData();
    form.append('file', this.uploadFile);
    this.http.post(`${environment.apiBaseUrl}/catalog/catalog/admin/upload`, form).subscribe({
      next: response => {
        this.message = 'Inventory upload completed.';
        this.uploadResult = response;
        this.uploadFile = null;
      },
      error: err => {
        this.error = err?.error?.message || 'Unable to upload inventory file.';
      }
    });
  }

  restoreBackup(): void {
    if (!this.restoreFile) {
      return;
    }
    this.busy = 'restore';
    this.clearMessages();
    const form = new FormData();
    form.append('file', this.restoreFile);
    this.http.post(`${environment.apiBaseUrl}/identity/admin/tools/restore`, form).subscribe({
      next: () => {
        this.busy = '';
        this.message = 'Backup restored successfully.';
        this.restoreFile = null;
      },
      error: err => {
        this.busy = '';
        this.error = err?.error?.message || 'Unable to restore backup.';
      }
    });
  }

  cleanup(): void {
    if (!confirm('Clean app data and keep only admin users? Download backup.zip first.')) {
      return;
    }
    this.busy = 'cleanup';
    this.clearMessages();
    this.http.post(`${environment.apiBaseUrl}/identity/admin/tools/cleanup`, {}).subscribe({
      next: () => {
        this.busy = '';
        this.message = 'System cleaned. Admin users were preserved.';
      },
      error: err => {
        this.busy = '';
        this.error = err?.error?.message || 'Unable to clean system.';
      }
    });
  }

  downloadReport(kind: 'orders' | 'inventory', format: 'pdf' | 'xlsx'): void {
    this.clearMessages();
    this.http.get(`${environment.apiBaseUrl}/identity/admin/tools/reports/${kind}?format=${format}`, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: response => {
        this.saveBlob(
          response.body || new Blob(),
          this.fileNameFromHeader(response.headers.get('content-disposition')) || `${kind}.${format}`
        );
      },
      error: err => {
        this.error = err?.error?.message || 'Unable to download report.';
      }
    });
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  private fileNameFromHeader(header: string | null): string | null {
    if (!header) {
      return null;
    }
    const match = /filename=\"?([^\";]+)\"?/i.exec(header);
    return match ? match[1] : null;
  }

  private clearMessages(): void {
    this.error = '';
    this.message = '';
  }
}
