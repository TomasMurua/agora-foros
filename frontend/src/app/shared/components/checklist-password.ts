import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { REGLAS_PASSWORD } from '../../core/validators/agora.validators';

/** Componente de presentación: lista en vivo de las reglas de la contraseña. */
@Component({
  selector: 'app-checklist-password',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ul class="checklist-password" [id]="idLista()" aria-label="Requisitos de la contraseña">
      @for (regla of reglas; track regla.clave) {
        @let ok = cumple(regla.clave);
        <li [class.cumple]="ok" [class.falla]="!ok && tocado()">
          <i class="bi" [class.bi-check-circle-fill]="ok" [class.bi-circle]="!ok" aria-hidden="true"></i>
          <span>{{ regla.mensaje }}</span>
          <span class="visually-hidden">{{ ok ? '(cumple)' : '(pendiente)' }}</span>
        </li>
      }
    </ul>
  `,
})
export class ChecklistPassword {
  readonly control = input.required<AbstractControl | null>();
  readonly nombreUsuario = input<string>('');
  readonly idLista = input<string>('reglas-password');
  protected readonly reglas = REGLAS_PASSWORD;

  cumple(clave: string): boolean {
    const valor = (this.control()?.value ?? '') as string;
    const regla = REGLAS_PASSWORD.find((r) => r.clave === clave)!;
    return valor !== '' && regla.cumple(valor, this.nombreUsuario() ?? '');
  }

  tocado(): boolean {
    const c = this.control();
    return !!c && (c.touched || c.dirty);
  }
}
