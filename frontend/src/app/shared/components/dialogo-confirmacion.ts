import { Component, inject } from '@angular/core';
import { ConfirmacionService } from '../../core/services/confirmacion.service';
import { Modal } from './modal';

/** Modal de confirmación para acciones destructivas. Observa ConfirmacionService. */
@Component({
  selector: 'app-dialogo-confirmacion',
  imports: [Modal],
  template: `
    @if (confirmacion.activa(); as peticion) {
      <app-modal [titulo]="peticion.titulo" [icono]="peticion.peligro ? 'exclamation-triangle' : 'question-circle'" (cerrar)="confirmacion.responder(false)">
        <div class="modal-body">
          <p class="mb-0">{{ peticion.mensaje }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" (click)="confirmacion.responder(false)">Cancelar</button>
          <button type="button" class="btn" [class.btn-danger]="peticion.peligro" [class.btn-primary]="!peticion.peligro" (click)="confirmacion.responder(true)">
            {{ peticion.textoConfirmar ?? 'Confirmar' }}
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class DialogoConfirmacion {
  protected readonly confirmacion = inject(ConfirmacionService);
}
