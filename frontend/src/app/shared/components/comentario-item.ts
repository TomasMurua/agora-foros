import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Comentario } from '../../core/models/foro.model';
import { LIMITES, sinSoloEspacios } from '../../core/validators/agora.validators';
import { TiempoRelativoPipe } from '../pipes/tiempo-relativo.pipe';
import { Avatar } from './avatar';
import { CampoError } from './campo-error';
import { ContadorCaracteres } from './contador-caracteres';

/** Permisos que la página calcula con ForoFacade y entrega al comentario. */
export interface PermisosComentario {
  editar: boolean;
  eliminar: boolean;
  reportar: boolean;
  moderar: boolean;
}

/**
 * Componente de presentación: un comentario del tema. Si está baneado y quien
 * mira no modera, muestra el aviso "contenido moderado" en su lugar. No llama
 * a las fachadas: emite eventos y la página decide.
 */
@Component({
  selector: 'app-comentario-item',
  imports: [ReactiveFormsModule, Avatar, CampoError, ContadorCaracteres, TiempoRelativoPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @let c = comentario();
    @if (c.baneado && !permisos().moderar) {
      <div class="comentario comentario-moderado">
        <i class="bi bi-shield-slash" aria-hidden="true"></i>
        <span>Contenido moderado. Este comentario no cumplía las normas del foro.</span>
      </div>
    } @else {
      <article class="comentario" [class.comentario-baneado]="c.baneado" [id]="'comentario-' + c.id">
        <app-avatar [nombre]="c.autor" [color]="colorAutor()" />
        <div class="comentario-cuerpo">
          <header class="comentario-cabecera">
            <strong>{{ c.autor }}</strong>
            @if (esAutorTema()) {
              <span class="badge text-bg-light borde-suave">Autor del tema</span>
            }
            @if (c.baneado) {
              <span class="badge estado estado-baneado"><i class="bi bi-slash-circle" aria-hidden="true"></i> Baneado</span>
            }
            <time class="text-secondary small" [attr.datetime]="c.fechaCreacion" [title]="c.fechaCreacion | date: 'd MMM y, HH:mm'">
              {{ c.fechaCreacion | tiempoRelativo }}
            </time>
            @if (c.fechaActualizacion) {
              <span class="text-secondary small">(editado)</span>
            }
          </header>

          @if (editando()) {
            <form [formGroup]="formEdicion" (ngSubmit)="guardar()" novalidate class="mt-2">
              <label class="visually-hidden" [for]="'editar-' + c.id">Editar comentario</label>
              <textarea [id]="'editar-' + c.id" class="form-control" rows="3" [formControl]="texto" required
                [attr.minlength]="limites.min" [attr.maxlength]="limites.max"
                [class.is-invalid]="texto.invalid && (texto.touched || enviado())"></textarea>
              <div class="d-flex justify-content-between gap-2">
                <app-campo-error [control]="texto" [enviado]="enviado()" />
                <app-contador-caracteres class="ms-auto" [control]="texto" [maximo]="limites.max" />
              </div>
              <div class="d-flex gap-2 mt-2">
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="texto.invalid && enviado()">Guardar</button>
                <button type="button" class="btn btn-outline-secondary btn-sm" (click)="editando.set(false)">Cancelar</button>
              </div>
            </form>
          } @else {
            <p class="comentario-texto">{{ c.contenido }}</p>
          }

          @if (!editando() && tieneAcciones()) {
            <div class="comentario-acciones">
              @if (permisos().editar) {
                <button type="button" class="btn btn-link btn-sm" (click)="empezarEdicion()"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button>
              }
              @if (permisos().eliminar) {
                <button type="button" class="btn btn-link btn-sm text-danger" (click)="eliminar.emit()"><i class="bi bi-trash" aria-hidden="true"></i> Eliminar</button>
              }
              @if (permisos().reportar && reportado()) {
                <button type="button" class="btn btn-link btn-sm" disabled><i class="bi bi-flag-fill" aria-hidden="true"></i> Reportado</button>
              } @else if (permisos().reportar) {
                <button type="button" class="btn btn-link btn-sm" (click)="reportar.emit()"><i class="bi bi-flag" aria-hidden="true"></i> Reportar</button>
              }
              @if (permisos().moderar) {
                @if (c.baneado) {
                  <button type="button" class="btn btn-link btn-sm text-success" (click)="restaurar.emit()"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Restaurar</button>
                } @else {
                  <button type="button" class="btn btn-link btn-sm text-danger" (click)="banear.emit()"><i class="bi bi-slash-circle" aria-hidden="true"></i> Banear</button>
                }
              }
            </div>
          }
        </div>
      </article>
    }
  `,
})
export class ComentarioItem {
  readonly comentario = input.required<Comentario>();
  readonly permisos = input<PermisosComentario>({ editar: false, eliminar: false, reportar: false, moderar: false });
  readonly colorAutor = input<string | null | undefined>(null);
  readonly esAutorTema = input(false);
  /** true si quien mira ya tiene un reporte pendiente sobre este comentario. */
  readonly reportado = input(false);

  readonly editar = output<string>();
  readonly eliminar = output<void>();
  readonly reportar = output<void>();
  readonly banear = output<void>();
  readonly restaurar = output<void>();

  protected readonly limites = LIMITES.comentario;
  protected readonly editando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly texto = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(LIMITES.comentario.min),
      Validators.maxLength(LIMITES.comentario.max),
      sinSoloEspacios,
    ],
  });
  protected readonly formEdicion = new FormGroup({ texto: this.texto });

  protected tieneAcciones(): boolean {
    const p = this.permisos();
    return p.editar || p.eliminar || p.reportar || p.moderar;
  }

  protected empezarEdicion(): void {
    this.texto.reset(this.comentario().contenido);
    this.enviado.set(false);
    this.editando.set(true);
  }

  protected guardar(): void {
    this.enviado.set(true);
    this.texto.markAsTouched();
    if (this.texto.invalid) {
      return;
    }
    this.editar.emit(this.texto.value.trim());
    this.editando.set(false);
  }
}
