import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { mensajeDeError } from '../../core/validators/agora.validators';

/**
 * Componente de presentación: muestra el primer error de un campo cuando la
 * persona ya lo tocó o intentó enviar el formulario. Los mensajes por defecto
 * salen de agora.validators.ts y se pueden reemplazar por campo.
 */
@Component({
  selector: 'app-campo-error',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (mensaje(); as texto) {
      <div class="invalid-feedback d-block" [id]="idError()" role="alert">
        <i class="bi bi-exclamation-circle me-1" aria-hidden="true"></i>{{ texto }}
      </div>
    }
  `,
})
export class CampoError {
  readonly control = input.required<AbstractControl | null>();
  readonly enviado = input(false);
  readonly mensajes = input<Record<string, string>>({});
  readonly idError = input<string | null>(null);

  // No es un computed: los errores del control cambian fuera de los signals.
  mensaje(): string | null {
    const control = this.control();
    if (!control || !control.errors || !(control.touched || this.enviado())) {
      return null;
    }
    const [clave, detalle] = Object.entries(control.errors)[0];
    return this.mensajes()[clave] ?? mensajeDeError(clave, detalle);
  }

}
