import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { humanizeApiError } from '../shared/models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-minimal">
      <p class="muted">Molino de barrio</p>
      <h1>Entra a Chufa</h1>
      <p>Username o email. La mola no rellena el formulario por ti.</p>
      <form (submit)="submit($event)">
        <label class="field">Username o email
          <input name="id" [(ngModel)]="identifier" autocomplete="off" />
        </label>
        <label class="field">Contraseña
          <input name="pw" type="password" [(ngModel)]="password" autocomplete="new-password" />
        </label>
        @if (error()) { <p class="cta-error">{{ error() }}</p> }
        <button class="btn btn-primary" type="submit" [disabled]="auth.loading()">Entrar</button>
      </form>
      <p><a routerLink="/registro">Crear cuenta</a></p>
      <div class="auth-demo">
        <strong>Cuenta de prueba con datos</strong><br>
        Cliente: <code>demo@chufa.dev</code> · <code>demo1234</code><br>
        Staff: <code>molienda@chufa.dev</code> · <code>demo1234</code>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  identifier = '';
  password = '';
  readonly error = signal('');

  submit(ev: Event): void {
    ev.preventDefault();
    this.error.set('');
    this.auth.login({ identifier: this.identifier, password: this.password }).subscribe({
      next: () => {
        const ret = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        void this.router.navigateByUrl(ret);
      },
      error: (e) => this.error.set(humanizeApiError(e)),
    });
  }
}
