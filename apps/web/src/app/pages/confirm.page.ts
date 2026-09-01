import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { eur, liters, Order, statusLabel } from '../shared/models';

@Component({
  selector: 'app-confirm',
  imports: [RouterLink],
  template: `
    <h1 style="margin-top:32px">Encargo cobrado</h1>
    @if (order(); as o) {
      <p>Código <span class="mono">{{ o.code }}</span> · {{ statusLabel(o.status) }}</p>
      <p>{{ eur(o.totalCents) }} · {{ liters(o.totalMl) }}</p>
      @if (qr()) {
        <div class="qr" [innerHTML]="qr()"></div>
      }
      <p><a [href]="o.qrUrl">{{ o.qrUrl }}</a></p>
      <a class="btn btn-secondary" [routerLink]="['/mis-pedidos', o.id]">Ver detalle</a>
    }
  `,
})
export class ConfirmPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly order = signal<Order | null>(null);
  readonly qr = signal<SafeHtml | null>(null);
  readonly eur = eur;
  readonly liters = liters;
  readonly statusLabel = statusLabel;

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') || '';
    this.api.ticket(code).subscribe((o) => {
      this.order.set(o);
      if (o.qrSvg) this.qr.set(this.sanitizer.bypassSecurityTrustHtml(o.qrSvg));
    });
  }
}
