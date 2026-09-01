import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="empty">
      <h1>Esa calle no sale a la horta</h1>
      <p>La ruta no existe. Vuelve al remojo de hoy.</p>
      <a class="btn btn-primary" routerLink="/">Portada</a>
    </section>
  `,
})
export class NotFoundPageComponent {}
