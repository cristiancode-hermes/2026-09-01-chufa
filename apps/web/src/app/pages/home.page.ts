import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { eur, liters, MillDay, Size } from '../shared/models';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <div class="skel" style="margin-top:32px"></div>
    } @else if (netError()) {
      <section class="error-state">
        <h1>No pudimos hablar con la mola</h1>
        <p>Revisa la red y vuelve a pedir el remojo de hoy.</p>
        <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
      </section>
    } @else if (!mill() || mill()!.status === 'closed') {
      <section class="empty">
        <h1>Hoy el molino descansa</h1>
        <p>No hay remojo abierto. Vuelve mañana a primera hora.</p>
        <a class="btn btn-secondary" routerLink="/molienda">Ver molienda</a>
      </section>
    } @else {
      <section class="hero">
        <div>
          <span class="badge">Remojo de hoy</span>
          <h1>Horchata de la piedra, no de la nevera.</h1>
          <p>La chufa no se retiene un cuarto de hora. Se muele, se cobra, se recoge.</p>
          <div class="meter">
            <strong>{{ liters(mill()!.litersRemaining) }}</strong>
            <span class="muted"> restantes de {{ liters(mill()!.litersYield) }}</span>
            <div class="meter-bar" style="margin-top:8px">
              <span [style.width.%]="bar()"></span>
            </div>
            <p class="muted">{{ mill()!.kgSoaked }} kg en remojo · {{ mill()!.millDate }}</p>
          </div>
        </div>
        <figure class="media">
          <img src="/assets/horta.jpg" alt="Horta de chufa junto a la acequia" />
          <figcaption>Horta de xufa, acequia y tierra húmeda — no un gimnasio.</figcaption>
        </figure>
      </section>
      <h2>Vasijas</h2>
      <p class="muted">Desde {{ eur(fromPrice()) }} · el precio sale del molino, no de un número pintado.</p>
      <div class="size-grid" style="margin: 24px 0 48px">
        @for (s of sizes(); track s.id) {
          <article class="card">
            <img [src]="s.photoUrl || '/assets/vaso.jpg'" [alt]="s.name" />
            <div class="card-body">
              <h3>{{ s.name }}</h3>
              <p class="muted">{{ s.ml }} ml · {{ s.blurb }}</p>
              <p class="price">{{ eur(s.priceCents) }}</p>
              <a class="btn btn-primary" [routerLink]="['/vasijas', s.slug]">Elegir</a>
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class HomePageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly mill = signal<MillDay | null>(null);
  readonly sizes = signal<Size[]>([]);
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
    this.netError.set(false);
    forkJoin({ mill: this.api.millToday(), sizes: this.api.sizes() }).subscribe({
      next: (res) => {
        this.mill.set(res.mill);
        this.sizes.set(res.sizes.items);
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
