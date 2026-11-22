import { Component, input, output } from '@angular/core';

/**
 * Componente de presentación: estructura de un modal de Bootstrap controlado
 * por Angular (sin el JavaScript de Bootstrap). El contenido se proyecta.
 */
@Component({
  selector: 'app-modal',
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
  template: `
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" [attr.aria-labelledby]="idTitulo" (click)="alClickFondo($event)">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" [class.modal-lg]="grande()">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" [id]="idTitulo">
              @if (icono()) {
                <i class="bi me-2" [class]="'bi me-2 bi-' + icono()" aria-hidden="true"></i>
              }
              {{ titulo() }}
            </h2>
            <button type="button" class="btn-close" aria-label="Cerrar" (click)="cerrar.emit()"></button>
          </div>
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class Modal {
  private static contador = 0;
  readonly titulo = input.required<string>();
  readonly icono = input<string>('');
  readonly grande = input(false);
  readonly cerrar = output<void>();
  protected readonly idTitulo = `modal-titulo-${++Modal.contador}`;

  protected alClickFondo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) {
      this.cerrar.emit();
    }
  }
}
