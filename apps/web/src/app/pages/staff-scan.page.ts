import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { humanizeApiError, statusLabel } from '../shared/models';

@Component({
  selector: 'app-staff-scan',
  imports: [FormsModule],
  template: `
    <h1 style="margin-top:32px">Escanear recogida</h1>
    <label class="field">Código o URL
      <input [(ngModel)]="raw" name="scan" autocomplete="off" />
    </label>
    @if (error()) { <p id="scan-action" class="cta-error">{{ error() }}</p> }
    @if (ok()) { <p class="muted">Marcado {{ statusLabel(ok()!) }}</p> }
    <button id="scan-action" class="btn btn-primary" type="button" (click)="scan()">Marcar recogida</button>
  `,
})
export class StaffScanPageComponent {
  private readonly api = inject(ApiService);
  raw = '';
  readonly error = signal('');
  readonly ok = signal<string | null>(null);
  readonly statusLabel = statusLabel;

  scan(): void {
    this.error.set('');
    this.ok.set(null);
    this.api.staffScan(this.raw).subscribe({
      next: (o) => this.ok.set(o.status),
      error: (e) => {
        this.error.set(humanizeApiError(e));
        queueMicrotask(() => document.getElementById('scan-action')?.scrollIntoView({ block: 'center' }));
      },
    });
  }
}
