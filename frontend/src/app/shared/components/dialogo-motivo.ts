import { ChangeDetectionStrategy, Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatosSancion, Norma } from '../../core/models/moderacion.model';
import { LIMITES, sinSoloEspacios } from '../../core/validators/agora.validators';
import { CampoError } from './campo-error';
import { ContadorCaracteres } from './contador-caracteres';
import { Modal } from './modal';

/**
 * Componente de presentación: formulario de "norma + motivo". Se usa para
 * reportar contenido, banearlo y restaurarlo. No guarda nada: emite los datos
 * y la página llama a la fachada.
 */
@Component({
  selector: 'app-dialogo-motivo',
  imports: [ReactiveFormsModule, Modal, CampoError, ContadorCaracteres],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-modal [titulo]="titulo()" [icono]="icono()" (cerrar)="cancelar.emit()">
      <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <div class="modal-body">
          @if (descripcion()) {
            <p class="text-secondary">{{ descripcion() }}</p>
          }
          @if (contexto()) {
            <blockquote class="cita-contenido">{{ contexto() }}</blockquote>
          }
          @if (pedirNorma()) {
            <div class="mb-3">
              <label class="form-label" for="dm-norma">Norma que se infringe</label>
              <select id="dm-norma" class="form-select" formControlName="normaId" required
                [class.is-invalid]="invalido('normaId')">
                <option [ngValue]="null" disabled>Elige una norma</option>
                @for (n of normas(); track n.id) {
                  <option [ngValue]="n.id">{{ n.codigo }} · {{ n.titulo }} (gravedad {{ n.gravedad.toLowerCase() }})</option>
                }
              </select>
              <app-campo-error [control]="form.controls.normaId" [enviado]="enviado()" [mensajes]="{ required: 'Elige la norma que se infringe.' }" />
            </div>
          }
          <div class="mb-1">
            <label class="form-label" for="dm-motivo">{{ etiquetaMotivo() }}</label>
            <textarea id="dm-motivo" class="form-control" rows="4" formControlName="motivo" required
              [attr.minlength]="limites.min" [attr.maxlength]="limites.max"
              [class.is-invalid]="invalido('motivo')" [placeholder]="placeholder()"></textarea>
            <div class="d-flex justify-content-between gap-2">
              <app-campo-error [control]="form.controls.motivo" [enviado]="enviado()" />
              <app-contador-caracteres class="ms-auto" [control]="form.controls.motivo" [maximo]="limites.max" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" (click)="cancelar.emit()">Cancelar</button>
          <button type="submit" class="btn" [class.btn-danger]="peligro()" [class.btn-primary]="!peligro()" [disabled]="form.invalid && enviado()">
            {{ textoConfirmar() }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class DialogoMotivo implements OnInit {
  readonly titulo = input.required<string>();
  readonly icono = input('flag');
  readonly descripcion = input('');
  readonly contexto = input('');
  readonly normas = input<Norma[]>([]);
  readonly pedirNorma = input(true);
  readonly normaInicial = input<number | null>(null);
  readonly etiquetaMotivo = input('Motivo');
  readonly placeholder = input('Explica en pocas palabras qué pasa con este contenido.');
  readonly textoConfirmar = input('Enviar');
  readonly peligro = input(false);
  readonly confirmar = output<DatosSancion>();
  readonly cancelar = output<void>();

  protected readonly limites = LIMITES.motivo;
  protected readonly enviado = signal(false);

  protected readonly form = new FormGroup({
    normaId: new FormControl<number | null>(null),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(LIMITES.motivo.min),
        Validators.maxLength(LIMITES.motivo.max),
        sinSoloEspacios,
      ],
    }),
  });

  ngOnInit(): void {
    if (this.pedirNorma()) {
      this.form.controls.normaId.addValidators(Validators.required);
      this.form.controls.normaId.setValue(this.normaInicial());
    }
  }

  protected invalido(campo: 'normaId' | 'motivo'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.enviado());
  }

  protected enviar(): void {
    this.enviado.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { normaId, motivo } = this.form.getRawValue();
    this.confirmar.emit({ normaId, motivo: motivo.trim() });
  }
}
