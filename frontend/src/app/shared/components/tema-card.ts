import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ResumenTema } from '../../core/models/foro.model';
import { TiempoRelativoPipe } from '../pipes/tiempo-relativo.pipe';
import { EstadoBadge } from './estado-badge';
import { PluralPipe } from '../pipes/plural.pipe';

/** Componente de presentación: tarjeta de un tema en las listas. */
@Component({
  selector: 'app-tema-card',
  imports: [RouterLink, EstadoBadge, TiempoRelativoPipe, PluralPipe],
  template: `
    @let t = resumen().tema;
    <article class="tema-card" [class.tema-card-baneado]="t.estado === 'BANEADO'">
      <div class="tema-card-cuerpo">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
          @if (resumen().categoria; as cat) {
            <a class="chip-categoria" [routerLink]="['/categorias', cat.id]">
              <i class="bi" [class]="'bi bi-' + cat.icono" aria-hidden="true"></i>{{ cat.nombre }}
            </a>
          }
          @if (t.estado !== 'ABIERTO') {
            <app-estado-badge [estado]="t.estado" />
          }
        </div>
        <h3 class="tema-card-titulo">
          <a [routerLink]="['/temas', t.id]" class="stretched-link">{{ t.titulo }}</a>
        </h3>
        @if (mostrarExtracto()) {
          <p class="tema-card-extracto">{{ t.contenido }}</p>
        }
        <div class="tema-card-meta">
          <span><i class="bi bi-person" aria-hidden="true"></i>{{ t.autor }}</span>
          <span><i class="bi bi-clock" aria-hidden="true"></i>{{ t.fechaCreacion | tiempoRelativo }}</span>
          <span><i class="bi bi-eye" aria-hidden="true"></i>{{ t.vistas | plural: 'vista' : 'vistas' }}</span>
          <span><i class="bi bi-chat-left-text" aria-hidden="true"></i>{{ resumen().comentarios }} {{ resumen().comentarios === 1 ? 'comentario' : 'comentarios' }}</span>
        </div>
      </div>
    </article>
  `,
})
export class TemaCard {
  readonly resumen = input.required<ResumenTema>();
  readonly mostrarExtracto = input(true);
}
