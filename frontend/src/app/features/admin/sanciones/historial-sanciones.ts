import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModeracionFacade } from '../../../core/facades/moderacion.facade';
import { AccionSancion, TipoContenido } from '../../../core/models/moderacion.model';
import { EstadoVacio } from '../../../shared/components/estado-vacio';

/** Página contenedora: historial de sanciones (BANEAR y RESTAURAR). */
@Component({
  selector: 'app-historial-sanciones',
  imports: [DatePipe, RouterLink, EstadoVacio],
  template: `
    <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
      <span class="small texto-suave me-2">Filtrar:</span>
      <div class="btn-group btn-group-sm" role="group" aria-label="Filtrar por acción">
        @for (a of acciones; track a.valor) {
          <button type="button" class="btn btn-outline-secondary" [class.active]="accion() === a.valor" [attr.aria-pressed]="accion() === a.valor" (click)="accion.set(a.valor)">{{ a.nombre }}</button>
        }
      </div>
      <div class="btn-group btn-group-sm" role="group" aria-label="Filtrar por tipo de contenido">
        @for (t of tipos; track t.valor) {
          <button type="button" class="btn btn-outline-secondary" [class.active]="tipo() === t.valor" [attr.aria-pressed]="tipo() === t.valor" (click)="tipo.set(t.valor)">{{ t.nombre }}</button>
        }
      </div>
    </div>
    @if (lista().length) {
      <ol class="linea-tiempo">
        @for (s of lista(); track s.sancion.id) {
          <li [class.restaurar]="s.sancion.accion === 'RESTAURAR'">
            <div class="panel">
              <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
                <span class="badge" [class.text-bg-danger]="s.sancion.accion === 'BANEAR'" [class.text-bg-success]="s.sancion.accion === 'RESTAURAR'">
                  {{ s.sancion.accion === 'BANEAR' ? 'Baneo' : 'Restauración' }}
                </span>
                <span class="badge text-bg-light borde-suave">{{ s.sancion.tipoContenido === 'TEMA' ? 'Tema' : 'Comentario' }} #{{ s.sancion.contenidoId }}</span>
                @if (s.norma; as n) {
                  <span class="badge gravedad" [class]="'badge gravedad gravedad-' + n.gravedad.toLowerCase()">{{ n.codigo }} · {{ n.titulo }}</span>
                }
                <time class="ms-auto small texto-suave" [attr.datetime]="s.sancion.fecha">{{ s.sancion.fecha | date: 'd MMM y, HH:mm' }}</time>
              </div>
              <p class="mb-1 fw-semibold">
                @if (s.temaId) {
                  <a [routerLink]="['/temas', s.temaId]">{{ s.extracto }}</a>
                } @else {
                  {{ s.extracto }}
                }
              </p>
              <p class="small mb-0"><span class="texto-suave">Motivo:</span> {{ s.sancion.motivo }} · <span class="texto-suave">por</span> {{ s.sancion.moderador }}</p>
            </div>
          </li>
        }
      </ol>
    } @else {
      <app-estado-vacio titulo="No hay sanciones con esos filtros" />
    }
  `,
})
export class HistorialSanciones {
  protected readonly moderacion = inject(ModeracionFacade);
  protected readonly accion = signal<AccionSancion | ''>('');
  protected readonly tipo = signal<TipoContenido | ''>('');
  protected readonly acciones: { valor: AccionSancion | ''; nombre: string }[] = [
    { valor: '', nombre: 'Todas' },
    { valor: 'BANEAR', nombre: 'Baneos' },
    { valor: 'RESTAURAR', nombre: 'Restauraciones' },
  ];
  protected readonly tipos: { valor: TipoContenido | ''; nombre: string }[] = [
    { valor: '', nombre: 'Todo' },
    { valor: 'TEMA', nombre: 'Temas' },
    { valor: 'COMENTARIO', nombre: 'Comentarios' },
  ];

  protected readonly lista = computed(() =>
    this.moderacion
      .sanciones()
      .filter((s) => (!this.accion() || s.sancion.accion === this.accion()) && (!this.tipo() || s.sancion.tipoContenido === this.tipo())),
  );
}
