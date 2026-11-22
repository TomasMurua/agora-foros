import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/** Componente de presentación: caracteres restantes de un área de texto. */
@Component({
  selector: 'app-contador-caracteres',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <small class="contador" [class.text-danger]="restantes() < 0" [class.contador-alerta]="restantes() >= 0 && restantes() <= alerta()" aria-live="polite">
      {{ restantes() >= 0 ? restantes() + ' caracteres disponibles' : -restantes() + ' caracteres de más' }}
    </small>
  `,
})
export class ContadorCaracteres {
  readonly control = input.required<AbstractControl | null>();
  readonly maximo = input.required<number>();
  readonly alerta = input(30);

  restantes(): number {
    const valor = (this.control()?.value ?? '') as string;
    return this.maximo() - valor.length;
  }
}
