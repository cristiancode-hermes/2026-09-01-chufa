import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Cart, eur, humanizeApiError, liters, MillDay } from '../shared/models';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink],
  template: `
    <h1 style="margin-top:32px">Pagar el encargo</h1>
    @if (loading()) {
      <div class="skel"></div>
    } @else if (!cart()?.items.length || !mill()) {
      <section class="empty">
        <h2>No hay nada que cobrar</h2>
        <a class="btn btn-primary" routerLink="/carrito">Volver a la bandeja</a>
      </section>
    } @else {
      <p class="muted">Remojo {{ mill()!.millDate }} · quedan {{ liters(mill()!.litersRemaining) }}</p>
      <div class="lines">
        @for (i of cart()!.items; track i.id) {
          <div class="line">
            <span>{{ i.qty }} × {{ i.name }}</span>
            <span>{{ eur(i.lineTotalCents) }}</span>
          </div>
        }
      </div>
      <p><strong>Total a cobrar: {{ eur(cart()!.liveTotalCents) }}</strong> · {{ liters(cart()!.liveMl) }}</p>
      @if (error()) { <p class="cta-error" role="alert">{{ error() }}</p> }
      <button id="pay-action" class="btn btn-primary" type="button" [disabled]="busy()" (click)="pay()">
        Pagar ahora
      </button>
    }
  `,
})
export class CheckoutPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly cart = signal<Cart | null>(null);
  readonly mill = signal<MillDay | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly eur = eur;
  readonly liters = liters;

  ngOnInit(): void {
    forkJoin({ cart: this.api.cart(), mill: this.api.millToday() }).subscribe({
      next: (res) => {
        this.cart.set(res.cart);
        this.mill.set(res.mill);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pay(): void {
    const mill = this.mill();
    if (!mill) return;
    this.busy.set(true);
    this.error.set('');
    this.api.checkout(mill.id).subscribe({
      next: (o) => void this.router.navigate(['/confirmacion', o.code]),
      error: (e) => {
        this.error.set(humanizeApiError(e));
        this.busy.set(false);
        queueMicrotask(() => document.getElementById('pay-action')?.scrollIntoView({ block: 'center' }));
      },
    });
  }
}
