import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip" href="#main">Saltar al contenido</a>
    <header class="site-header">
      <div class="wrap nav">
        <a routerLink="/" class="brand">Chufa</a>
        <button class="nav-toggle" type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-label="Abrir menú">☰</button>
        <nav class="nav-links" [class.open]="open()">
          <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}" (click)="open.set(false)">Hoy</a>
          <a routerLink="/molienda" routerLinkActive="on" (click)="open.set(false)">Molienda</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/carrito" (click)="open.set(false)">Bandeja</a>
            <a routerLink="/mis-pedidos" (click)="open.set(false)">Mis encargos</a>
            <a routerLink="/cuenta" (click)="open.set(false)">Cuenta</a>
          } @else {
            <a routerLink="/login" (click)="open.set(false)">Entrar</a>
          }
          @if (auth.isStaff()) {
            <a routerLink="/staff" (click)="open.set(false)">Mostrador</a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin" (click)="open.set(false)">Admin</a>
          }
          <button class="theme-toggle" type="button" (click)="theme.toggle()" [attr.aria-label]="theme.isDark() ? 'Activar tema claro' : 'Activar tema oscuro'">
            {{ theme.isDark() ? '☀' : '☾' }}
          </button>
        </nav>
      </div>
    </header>
    <main id="main" class="wrap">
      <router-outlet />
    </main>
    <footer class="footer">
      <div class="wrap">Molino de xufa · remojo del día · Europe/Madrid</div>
    </footer>
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly open = signal(false);
}
