import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ForoFacade } from '../../../core/facades/foro.facade';
import { Tema } from '../../../core/models/foro.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { EstadoBadge } from '../../../shared/components/estado-badge';
import { EstadoVacio } from '../../../shared/components/estado-vacio';
import { PluralPipe } from '../../../shared/pipes/plural.pipe';

/** Página contenedora: temas publicados por la persona con sesión iniciada. */
@Component({
  selector: 'app-mis-temas',
  imports: [RouterLink, DatePipe, EstadoBadge, EstadoVacio, PluralPipe],
  template: `
    <section class="cabecera-pagina">
      <div class="container d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
        <div>
          <p class="eyebrow">Tu actividad</p>
          <h1 class="titulo-pagina">Mis temas</h1>
          <p class="bajada-pagina mb-0">{{ foro.misTemas().length | plural: 'tema publicado' : 'temas publicados' }} · {{ totalVistas() | plural: 'vista' : 'vistas' }} en total</p>
        </div>
        <a class="btn btn-primary" routerLink="/temas/nuevo"><i class="bi bi-plus-lg" aria-hidden="true"></i> Publicar tema</a>
      </div>
    </section>
    <div class="container pb-5">
      @if (foro.misTemas().length) {
        <div class="lista-filas">
          @for (r of foro.misTemas(); track r.tema.id) {
            <div class="fila">
              <div class="row g-2 align-items-center">
                <div class="col-12 col-md-6">
                  <a class="fw-semibold" [routerLink]="['/temas', r.tema.id]">{{ r.tema.titulo }}</a>
                  <div class="small texto-suave">{{ r.categoria?.nombre }} · {{ r.tema.fechaCreacion | date: 'd MMM y' }}</div>
                </div>
                <div class="col-6 col-md-2"><app-estado-badge [estado]="r.tema.estado" /></div>
                <div class="col-6 col-md-2 small texto-suave">
                  <i class="bi bi-eye" aria-hidden="true"></i> {{ r.tema.vistas }} ·
                  <i class="bi bi-chat-left-text" aria-hidden="true"></i> {{ r.comentarios }}
                </div>
                <div class="col-12 col-md-2 d-flex gap-1 justify-content-md-end">
                  @if (foro.puedeEditarTema(r.tema)) {
                    <a class="btn btn-sm btn-outline-primary" [routerLink]="['/temas', r.tema.id, 'editar']" [attr.aria-label]="'Editar ' + r.tema.titulo"><i class="bi bi-pencil" aria-hidden="true"></i></a>
                  }
                  @if (foro.puedeCambiarEstado(r.tema)) {
                    <button type="button" class="btn btn-sm btn-outline-secondary" (click)="alternar(r.tema)"
                      [attr.aria-label]="(r.tema.estado === 'ABIERTO' ? 'Cerrar ' : 'Reabrir ') + r.tema.titulo">
                      <i class="bi" [class.bi-lock]="r.tema.estado === 'ABIERTO'" [class.bi-unlock]="r.tema.estado !== 'ABIERTO'" aria-hidden="true"></i>
                    </button>
                  }
                  <button type="button" class="btn btn-sm btn-outline-danger" (click)="eliminar(r.tema)" [attr.aria-label]="'Eliminar ' + r.tema.titulo"><i class="bi bi-trash" aria-hidden="true"></i></button>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <app-estado-vacio titulo="Todavía no publicas temas" texto="Cuando abras una conversación, la vas a encontrar aquí.">
          <a class="btn btn-primary" routerLink="/temas/nuevo">Publicar mi primer tema</a>
        </app-estado-vacio>
      }
    </div>
  `,
})
export class MisTemas {
  protected readonly foro = inject(ForoFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly totalVistas = computed(() =>
    this.foro.misTemas().reduce((suma, r) => suma + r.tema.vistas, 0),
  );

  protected alternar(tema: Tema): void {
    this.notificaciones.resultado(this.foro.alternarEstadoTema(tema.id));
  }

  protected async eliminar(tema: Tema): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar tema',
      mensaje: `Vas a eliminar "${tema.titulo}" y todos sus comentarios. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar tema',
      peligro: true,
    });
    if (ok) {
      this.notificaciones.resultado(this.foro.eliminarTema(tema.id));
    }
  }
}
