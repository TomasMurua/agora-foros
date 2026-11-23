import { Component, input } from '@angular/core';

/** Componente de presentación: ilustración y mensaje cuando una lista está vacía. */
@Component({
  selector: 'app-estado-vacio',
  template: `
    <div class="estado-vacio">
      <img [src]="imagen()" alt="" width="180" height="140" loading="lazy" />
      <h3 class="h5 mt-3">{{ titulo() }}</h3>
      @if (texto()) {
        <p class="text-secondary mb-3">{{ texto() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EstadoVacio {
  readonly titulo = input.required<string>();
  readonly texto = input('');
  readonly imagen = input('ilustraciones/vacio.svg');
}
