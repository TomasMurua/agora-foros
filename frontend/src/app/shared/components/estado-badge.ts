import { Component, computed, input } from '@angular/core';
import { ETIQUETA_ESTADO_TEMA, EstadoTema } from '../../core/models/foro.model';

/** Componente de presentación: etiqueta de color según el estado del tema. */
@Component({
  selector: 'app-estado-badge',
  template: `
    <span class="badge estado" [class]="'badge estado estado-' + estado().toLowerCase()">
      <i class="bi" [class]="'bi ' + icono()" aria-hidden="true"></i>
      {{ etiqueta() }}
    </span>
  `,
})
export class EstadoBadge {
  readonly estado = input.required<EstadoTema>();
  protected readonly etiqueta = computed(() => ETIQUETA_ESTADO_TEMA[this.estado()]);
  protected readonly icono = computed(() => {
    switch (this.estado()) {
      case 'ABIERTO':
        return 'bi-unlock';
      case 'CERRADO':
        return 'bi-lock';
      default:
        return 'bi-slash-circle';
    }
  });
}
