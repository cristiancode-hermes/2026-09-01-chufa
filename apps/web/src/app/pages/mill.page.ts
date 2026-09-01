import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { eur, liters, MillDay, Size } from '../shared/models';

@Component({
  selector: 'app-mill',
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <div class="skel" style="margin-top:32px"></div>
    } @else if (netError()) {
      <section class="error-state">
        <h1>No pudimos hablar con la mola</h1>
        <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
      </section>
    } @else if (!mill()) {
      <section class="empty">
        <h1>Hoy el molino descansa</h1>
        <p>No hay remojo civil abierto en Madrid.</p>
      </section>
    } @else {
      <section class="hero">
        <div>
          <h1>Molienda de {{ mill()!.millDate }}</h1>
          <p>Los mismos litros que en portada: {{ liters(mill()!.litersRemaining) }} restantes.</p>
          <div class="meter">
            <div class="meter-bar"><span [style.width.%]="bar()"></span></div>
            <p class="muted">{{ mill()!.kgSoaked }} kg · estado {{ mill()!.status }}</p>
          </div>
          <p>Desde {{ eur(fromPrice()) }}</p>
          <a class="btn btn-primary" routerLink="/">Ver vasijas</a>
        </div>
        <figure class="media">
          <img src="/assets/mola.jpg" alt="Piedra de moler chufa" />
          <figcaption>La mola de piedra, todavía húmeda del remojo.</figcaption>
        </figure>
      </section>
    }
  `,
})
export class MillPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly mill = signal<MillDay | null>(null);
  readonly fromPrice = signal(0);
  readonly loading = signal(true);
  readonly netError = signal(false);
  readonly eur = eur;
  readonly liters = liters;

  ngOnInit(): void {
    this.load();
  }
  bar(): number {
    const m = this.mill();
    if (!m || !m.litersYield) return 0;
    return Math.max(4, Math.round((m.litersRemaining / m.litersYield) * 100));
  }
  load(): void {
    this.loading.set(true);
    forkJoin({ mill: this.api.millToday(), sizes: this.api.sizes() }).subscribe({
      next: (res) => {
        this.mill.set(res.mill);
        this.fromPrice.set(res.sizes.fromPriceCents);
        this.loading.set(false);
      },
      error: () => {
        this.netError.set(true);
        this.loading.set(false);
      },
    });
  }
}
