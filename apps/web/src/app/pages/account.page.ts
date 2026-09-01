import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-account',
  template: `
    <h1 style="margin-top:32px">Cuenta</h1>
    @if (auth.user(); as u) {
      <p>{{ u.username }} · {{ u.email }}</p>
      <p>Puntos de mola: <strong>{{ u.points }}</strong> (ml recogidos / 100)</p>
      <button class="btn btn-secondary" type="button" (click)="auth.logout()">Salir</button>
    }
    <h2>Bandeja de correo</h2>
    @if (!inbox().length) {
      <p class="muted">Sin avisos simulados.</p>
    } @else {
      <div class="lines">
        @for (m of inbox(); track m.id) {
          <div class="line">
            <span>{{ m.kind }}</span>
            <span class="muted">{{ m.body }}</span>
          </div>
        }
      </div>
    }
  `,
})
export class AccountPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly inbox = signal<Array<{ id: string; kind: string; body: string }>>([]);
  ngOnInit(): void {
    this.api.inbox().subscribe((rows) => this.inbox.set(rows));
  }
}
