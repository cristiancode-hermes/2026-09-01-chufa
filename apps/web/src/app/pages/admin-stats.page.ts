import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { StatPoint } from '../shared/models';

@Component({
  selector: 'app-admin-stats',
  template: `
    <h1 style="margin-top:32px">Litros 14 días</h1>
    @if (!series().length) {
      <p class="muted">Sin serie todavía.</p>
    } @else {
      <svg class="chart" viewBox="0 0 640 240" role="img" aria-label="Litros molidos frente a vendidos">
        <line x1="48" y1="16" x2="48" y2="200" stroke="currentColor" />
        <line x1="48" y1="200" x2="620" y2="200" stroke="currentColor" />
        <text x="8" y="24" font-size="11">L</text>
        @for (t of yTicks(); track t.label) {
          <text x="4" [attr.y]="t.y" font-size="10">{{ t.label }}</text>
        }
        @for (p of points(); track p.date) {
          <rect [attr.x]="p.x" [attr.y]="p.yYield" [attr.width]="10" [attr.height]="p.hYield" fill="#8B3A12" opacity="0.35">
            <title>{{ p.date }} molido {{ p.yieldLiters }} L</title>
          </rect>
          <rect [attr.x]="p.x + 12" [attr.y]="p.ySold" [attr.width]="10" [attr.height]="p.hSold" fill="#173A6E">
            <title>{{ p.date }} vendido {{ p.soldLiters }} L</title>
          </rect>
          <text [attr.x]="p.x" y="216" font-size="9">{{ p.label }}</text>
        }
      </svg>
      <p class="muted">Eje X: fecha Madrid · Y: litros · tooltip al pasar.</p>
    }
  `,
})
export class AdminStatsPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly series = signal<StatPoint[]>([]);
  readonly points = signal<
    Array<{
      date: string;
      label: string;
      x: number;
      yYield: number;
      hYield: number;
      ySold: number;
      hSold: number;
      yieldLiters: number;
      soldLiters: number;
    }>
  >([]);
  readonly yTicks = signal<Array<{ y: number; label: string }>>([]);

  ngOnInit(): void {
    this.api.adminStats().subscribe((rows) => {
      this.series.set(rows);
      const max = Math.max(1, ...rows.map((r) => Math.max(r.yieldLiters || r.litersYield / 1000, r.soldLiters || r.litersSold / 1000)));
      const innerH = 180;
      const ticks = [0, 0.5, 1].map((t) => ({
        y: 200 - t * innerH,
        label: (max * t).toFixed(0),
      }));
      this.yTicks.set(ticks);
      const step = rows.length ? 560 / rows.length : 40;
      this.points.set(
        rows.map((r, i) => {
          const yL = r.yieldLiters ?? r.litersYield / 1000;
          const sL = r.soldLiters ?? r.litersSold / 1000;
          const hY = (yL / max) * innerH;
          const hS = (sL / max) * innerH;
          return {
            date: r.date,
            label: r.date.slice(5),
            x: 56 + i * step,
            yYield: 200 - hY,
            hYield: hY,
            ySold: 200 - hS,
            hSold: hS,
            yieldLiters: yL,
            soldLiters: sL,
          };
        }),
      );
    });
  }
}
