import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { eur, liters, Order, statusLabel } from '../shared/models';

@Component({
  selector: 'app-public-order',
  template: `
    <div class="auth-minimal">
      @if (error()) {
        <h1>No hay un pedido con ese código</h1>
        <p>Pasa el QR otra vez o dicta el código en el mostrador.</p>
      } @else if (order(); as o) {
        <h1>{{ statusLabel(o.status) }}</h1>
        <p class="mono">{{ o.code }}</p>
        <p>{{ eur(o.totalCents) }} · {{ liters(o.totalMl) }}</p>
        @if (qr()) { <div class="qr" [innerHTML]="qr()"></div> }
      }
    </div>
  `,
})
export class PublicOrderPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly order = signal<Order | null>(null);
  readonly qr = signal<SafeHtml | null>(null);
  readonly error = signal(false);
  readonly eur = eur;
  readonly liters = liters;
  readonly statusLabel = statusLabel;

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') || '';
    this.api.ticket(code).subscribe({
      next: (o) => {
        this.order.set(o);
        if (o.qrSvg) this.qr.set(this.sanitizer.bypassSecurityTrustHtml(o.qrSvg));
      },
      error: () => this.error.set(true),
    });
  }
}
