import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { humanizeApiError } from '../shared/models';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-minimal">
      <h1>Alta en el molino</h1>
      <form (submit)="submit($event)">
        <label class="field">Username
          <input name="u" [(ngModel)]="username" autocomplete="off" />
        </label>
        <label class="field">Email
          <input name="e" [(ngModel)]="email" autocomplete="off" />
        </label>
        <label class="field">Contraseña
          <input name="p" type="password" [(ngModel)]="password" autocomplete="new-password" />
        </label>
        @if (error()) { <p class="cta-error">{{ error() }}</p> }
        <button class="btn btn-primary" type="submit">Crear cuenta</button>
      </form>
      <p><a routerLink="/login">Ya tengo cuenta</a></p>
    </div>
  `,
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  username = '';
  email = '';
  password = '';
  readonly error = signal('');

  submit(ev: Event): void {
    ev.preventDefault();
    this.error.set('');
    this.auth.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (e) => this.error.set(humanizeApiError(e)),
    });
  }
}
