import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { eur, liters, Order, statusLabel } from '../shared/models';

@Component({
  selector: 'app-orders',
  imports: [RouterLink],
  template: `
    <h1 style="margin-top:32px">Mis encargos</h1>
    @if (!orders().length) {
      <section class="empty">
        <h2>Todavía no has molido nada</h2>
        <a class="btn btn-primary" routerLink="/">Ver remojo</a>
      </section>
    } @else {
      <div class="lines">
        @for (o of orders(); track o.id) {
          <a class="line" [routerLink]="['/mis-pedidos', o.id]">
            <span class="mono">{{ o.code }}</span>
            <span>{{ statusLabel(o.status) }} · {{ eur(o.totalCents) }} · {{ liters(o.totalMl) }}</span>
          </a>
        }
      </div>
    }
  `,
})
export class OrdersPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly orders = signal<Order[]>([]);
  readonly eur = eur;
  readonly liters = liters;
  readonly statusLabel = statusLabel;
  ngOnInit(): void {
    this.api.myOrders().subscribe((rows) => this.orders.set(rows));
  }
}
