import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [RouterLink],
  template: `
    <h1 style="margin-top:32px">Admin</h1>
    <p>
      <a class="btn btn-primary" routerLink="/admin/remojo">Remojo</a>
      <a class="btn btn-secondary" routerLink="/admin/stats">Estadística</a>
    </p>
  `,
})
export class AdminPageComponent {}
