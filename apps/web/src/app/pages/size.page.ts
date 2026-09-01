import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { eur, humanizeApiError, Size } from '../shared/models';

@Component({
  selector: 'app-size',
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <div class="skel" style="margin-top:32px"></div>
    } @else if (!size()) {
      <section class="empty">
        <h1>Esa vasija no está en la barra</h1>
        <a class="btn btn-secondary" routerLink="/">Volver</a>
      </section>
    } @else {
      <article class="hero">
        <figure class="media">
          <img [src]="size()!.photoUrl || '/assets/vaso.jpg'" [alt]="size()!.name" />
          <figcaption>{{ size()!.name }} · {{ size()!.ml }} ml</figcaption>
        </figure>
        <div>
          <h1>{{ size()!.name }}</h1>
          <p>{{ size()!.blurb }}</p>
          <p class="price">{{ eur(size()!.priceCents) }}</p>
          @if (error()) { <p class="cta-error">{{ error() }}</p> }
          <button class="btn btn-primary" type="button" (click)="add()">Añadir a la bandeja</button>
        </div>
      </article>
    }
  `,
})
export class SizePageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly size = signal<Size | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly eur = eur;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.api.size(slug).subscribe({
      next: (s) => {
        this.size.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  add(): void {
    if (!this.auth.getToken()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const s = this.size();
    if (!s) return;
    this.api.addCart('size', s.id, 1).subscribe({
      next: () => void this.router.navigateByUrl('/carrito'),
      error: (e) => this.error.set(humanizeApiError(e)),
    });
  }
}
