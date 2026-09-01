import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { eur, humanizeApiError, liters, statusLabel } from '../shared/models';

@Component({
  selector: 'app-staff-queue',
  imports: [RouterLink],
  template: `
    <h1 style="margin-top:32px">Cola de {{ millDate() }}</h1>
    @if (error()) { <p class="cta-error">{{ error() }}</p> }
    @if (!orders().length) {
      <section class="empty">
        <h2>Nadie en la piedra</h2>
        <a class="btn btn-secondary" routerLink="/staff">Volver</a>
      </section>
    } @else {
      <div class="lines">
        @for (o of orders(); track o.id) {
          <div class="line">
            <div>
              <span class="mono">{{ o.code }}</span>
              <div class="muted">{{ statusLabel(o.status) }} · {{ eur(o.totalCents) }} · {{ liters(o.totalMl) }}</div>
            </div>
            <div>
              @if (o.status === 'paid') {
                <button class="btn btn-secondary" type="button" (click)="advance(o.id, 'milling')">Moler</button>
              }
              @if (o.status === 'milling') {
                <button class="btn btn-primary" type="button" (click)="advance(o.id, 'ready')">Lista</button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class StaffQueuePageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly orders = signal<Array<{ id: string; code: string; status: string; totalCents: number; totalMl: number }>>([]);
  readonly millDate = signal('');
  readonly error = signal('');
  readonly eur = eur;
  readonly liters = liters;
  readonly statusLabel = statusLabel;

  ngOnInit(): void {
    this.refresh();
  }
  refresh(): void {
    this.api.staffQueue().subscribe((q) => {
      this.millDate.set(q.millDate);
      this.orders.set(q.orders as any);
    });
  }
  advance(id: string, status: string): void {
    this.api.staffStatus(id, status).subscribe({
      next: () => this.refresh(),
      error: (e) => this.error.set(humanizeApiError(e)),
    });
  }
}
