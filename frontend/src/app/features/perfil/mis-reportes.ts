import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModeracionFacade, ReporteDetallado } from '../../core/facades/moderacion.facade';
import { ConfirmacionService } from '../../core/services/confirmacion.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { EstadoVacio } from '../../shared/components/estado-vacio';
import { PluralPipe } from '../../shared/pipes/plural.pipe';

/** Página contenedora: reportes que envió la persona con sesión y en qué quedaron. */
@Component({
  selector: 'app-mis-reportes',
  imports: [RouterLink, DatePipe, EstadoVacio, PluralPipe],
  template: `
    <section class="cabecera-pagina">
      <div class="container">
        <p class="eyebrow">Tu actividad</p>
        <h1 class="titulo-pagina">Mis reportes</h1>
        <p class="bajada-pagina mb-0">{{ moderacion.misReportes().length | plural: 'reporte enviado' : 'reportes enviados' }}. Nadie más ve quién los envió.</p>
      </div>
    </section>
    <div class="container pb-5">
      @if (moderacion.misReportes().length) {
        <div class="lista-filas">
          @for (r of moderacion.misReportes(); track r.reporte.id) {
            <div class="fila">
              <div class="row g-2 align-items-center">
                <div class="col-12 col-md-6">
                  <span class="badge text-bg-light borde-suave me-1">{{ r.reporte.tipoContenido === 'TEMA' ? 'Tema' : 'Comentario' }}</span>
                  @if (r.temaId) {
                    <a class="fw-semibold" [routerLink]="['/temas', r.temaId]">{{ r.extracto }}</a>
                  } @else {
                    <span class="fw-semibold">{{ r.extracto }}</span>
                  }
                  <div class="small texto-suave">
                    {{ r.norma?.codigo }} {{ r.norma?.titulo }} · {{ r.reporte.fechaCreacion | date: 'd MMM y, HH:mm' }}
                  </div>
                  <div class="small"><span class="texto-suave">Motivo:</span> {{ r.reporte.motivo }}</div>
                </div>
                <div class="col-6 col-md-2">
                  <span class="badge" [class.text-bg-warning]="r.reporte.estado === 'PENDIENTE'" [class.text-bg-success]="r.reporte.estado === 'RESUELTO'"
                    [class.text-bg-secondary]="r.reporte.estado === 'DESCARTADO'">{{ nombreEstado(r) }}</span>
                </div>
                <div class="col-6 col-md-3 small texto-suave">
                  @if (r.reporte.resolucion) {
                    {{ r.reporte.resolucion }}
                  } @else {
                    En revisión por el equipo de moderación.
                  }
                </div>
                <div class="col-12 col-md-1 d-flex justify-content-md-end">
                  @if (r.reporte.estado === 'PENDIENTE') {
                    <button type="button" class="btn btn-sm btn-outline-danger" (click)="retirar(r)" [attr.aria-label]="'Retirar el reporte ' + r.reporte.id">
                      <i class="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <app-estado-vacio titulo="No has enviado reportes" texto="Si ves un tema o comentario que no cumple las normas, usa el botón Reportar.">
          <a class="btn btn-primary" routerLink="/normas">Ver las normas del foro</a>
        </app-estado-vacio>
      }
    </div>
  `,
})
export class MisReportes {
  protected readonly moderacion = inject(ModeracionFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected nombreEstado(r: ReporteDetallado): string {
    return { PENDIENTE: 'Pendiente', RESUELTO: 'Resuelto', DESCARTADO: 'Descartado' }[r.reporte.estado];
  }

  protected async retirar(r: ReporteDetallado): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Retirar reporte',
      mensaje: 'El equipo de moderación ya no verá este reporte.',
      textoConfirmar: 'Retirar',
      peligro: true,
    });
    if (ok) {
      this.notificaciones.resultado(this.moderacion.retirarReporte(r.reporte.id));
    }
  }
}
