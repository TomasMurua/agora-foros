import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../core/services/notificacion.service';

/** Dibuja los avisos (toasts) que observa del NotificacionService. */
@Component({
  selector: 'app-contenedor-avisos',
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3 avisos" aria-live="polite" aria-atomic="false">
      @for (aviso of notificaciones.avisos(); track aviso.id) {
        <div class="toast show aviso" [class]="'toast show aviso aviso-' + aviso.tipo" role="status">
          <div class="d-flex align-items-start gap-2 p-3">
            <i class="bi fs-5" aria-hidden="true"
              [class.bi-check-circle-fill]="aviso.tipo === 'exito'"
              [class.bi-exclamation-octagon-fill]="aviso.tipo === 'error'"
              [class.bi-info-circle-fill]="aviso.tipo === 'info'"></i>
            <div class="flex-grow-1">{{ aviso.mensaje }}</div>
            <button type="button" class="btn-close" aria-label="Cerrar aviso" (click)="notificaciones.cerrar(aviso.id)"></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContenedorAvisos {
  protected readonly notificaciones = inject(NotificacionService);
}
