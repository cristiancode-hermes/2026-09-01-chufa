import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { eur, humanizeApiError, liters, Order, statusLabel } from '../shared/models';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink],
  template: `
    @if (order(); as o) {
      <h1 style="margin-top:32px">{{ o.code }}</h1>
      <p>{{ statusLabel(o.status) }} · {{ eur(o.totalCents) }} · {{ liters(o.totalMl) }}</p>
      <div class="lines">
        @for (l of o.lines; track l.id) {
          <div class="line">
            <span>{{ l.qty }} × {{ l.nameSnapshot }}</span>
            <span>{{ eur(l.lineTotalCents) }}</span>
          </div>
        }
      </div>
      @if (qr()) { <div class="qr" [innerHTML]="qr()"></div> }
      @if (error()) { <p class="cta-error">{{ error() }}</p> }
      @if (o.status === 'paid') {
        <button class="btn btn-secondary" type="button" (click)="cancel(o.id)">Cancelar</button>
      }
      <p><a routerLink="/mis-pedidos">Todos los encargos</a></p>
    } @else if (!loading()) {
      <section class="empty">
        <h1>Encargo no encontrado</h1>
        <a class="btn btn-secondary" routerLink="/mis-pedidos">Volver</a>
      </section>
    }
  `,
})
export class OrderDetailPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly order = signal<Order | null>(null);
  readonly qr = signal<SafeHtml | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly eur = eur;
  readonly liters = liters;
  readonly statusLabel = statusLabel;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.api.myOrder(id).subscribe({
      next: (o) => {
        this.order.set(o);
        if (o.qrSvg) this.qr.set(this.sanitizer.bypassSecurityTrustHtml(o.qrSvg));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cancel(id: string): void {
    this.api.cancel(id).subscribe({
      next: (o) => this.order.set(o),
      error: (e) => this.error.set(humanizeApiError(e)),
    });
  }
}
