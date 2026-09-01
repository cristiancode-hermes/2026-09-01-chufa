import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { liters, MillDay } from '../shared/models';

@Component({
  selector: 'app-admin-mill',
  imports: [FormsModule],
  template: `
    <h1 style="margin-top:32px">Remojo</h1>
    @if (mill(); as m) {
      <p>{{ m.millDate }} · {{ m.status }} · {{ liters(m.litersRemaining) }}</p>
      <label class="field">kg remojo
        <input name="kg" [(ngModel)]="kg" />
      </label>
      <label class="field">Estado
        <input name="st" [(ngModel)]="status" />
      </label>
      <button class="btn btn-primary" type="button" (click)="save()">Guardar</button>
    }
  `,
})
export class AdminMillPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly mill = signal<MillDay | null>(null);
  kg = '';
  status = '';
  readonly liters = liters;
  ngOnInit(): void {
    this.api.millToday().subscribe((m) => {
      this.mill.set(m);
      if (m) {
        this.kg = String(m.kgSoaked);
        this.status = m.status;
      }
    });
  }
  save(): void {
    const m = this.mill();
    if (!m) return;
    this.api.patchMill(m.id, { kgSoaked: Number(this.kg), status: this.status }).subscribe((d) => this.mill.set(d));
  }
}
