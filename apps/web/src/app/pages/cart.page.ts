import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Addon, Cart, eur, liters, MillDay } from '../shared/models';

@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  template: `
    <h1 style="margin-top:32px">Bandeja</h1>
    @if (loading()) {
      <div class="skel"></div>
    } @else if (!cart() || !cart()!.items.length) {
      <section class="empty">
        <h2>La bandeja está vacía</h2>
        <p>Elige una vasija del remojo de hoy.</p>
        <a class="btn btn-primary" routerLink="/">Ver vasijas</a>
      </section>
    } @else {
      @if (mill() && cart()!.liveMl > mill()!.litersRemaining) {
        <p class="cta-error">Pediste {{ liters(cart()!.liveMl) }} y el remojo tiene {{ liters(mill()!.litersRemaining) }}. Baja la vasija.</p>
      }
      <div class="lines">
        @for (i of cart()!.items; track i.id) {
          <div class="line">
            <div>
              <strong>{{ i.name }}</strong>
              <div class="muted">{{ i.qty }} × {{ eur(i.unitPriceCents) }}</div>
            </div>
            <div>
              {{ eur(i.lineTotalCents) }}
              <button class="btn btn-ghost" type="button" (click)="remove(i.id)">Quitar</button>
            </div>
          </div>
        }
      </div>
      <p><strong>Total {{ eur(cart()!.liveTotalCents) }}</strong> · {{ liters(cart()!.liveMl) }}</p>
      <h3>Fartones y extras</h3>
      <div class="lines">
        @for (a of addons(); track a.id) {
          <div class="line">
            <div>{{ a.name }} · {{ eur(a.priceCents) }} · stock {{ a.stock }}</div>
            <button class="btn btn-secondary" type="button" (click)="addAddon(a.id)" [disabled]="a.stock < 1">Añadir</button>
          </div>
        }
      </div>
      <a class="btn btn-primary" routerLink="/checkout">Ir a pagar</a>
    }
  `,
})
export class CartPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly cart = signal<Cart | null>(null);
  readonly mill = signal<MillDay | null>(null);
  readonly addons = signal<Addon[]>([]);
  readonly loading = signal(true);
  readonly eur = eur;
  readonly liters = liters;

  ngOnInit(): void {
    forkJoin({ cart: this.api.cart(), mill: this.api.millToday(), addons: this.api.addons() }).subscribe({
      next: (res) => {
        this.cart.set(res.cart);
        this.mill.set(res.mill);
        this.addons.set(res.addons);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(id: string): void {
    this.api.removeCart(id).subscribe((c) => this.cart.set(c));
  }
  addAddon(id: string): void {
    this.api.addCart('addon', id, 1).subscribe((c) => this.cart.set(c));
  }
}
