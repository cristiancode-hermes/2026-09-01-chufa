import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-staff',
  imports: [RouterLink],
  template: `
    <h1 style="margin-top:32px">Mostrador</h1>
    <p>Cola de molienda y escaneo de QR.</p>
    <p>
      <a class="btn btn-primary" routerLink="/staff/cola">Cola</a>
      <a class="btn btn-secondary" routerLink="/staff/scan">Escanear</a>
    </p>
  `,
})
export class StaffPageComponent {}
