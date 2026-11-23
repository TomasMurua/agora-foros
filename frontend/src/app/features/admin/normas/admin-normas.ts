import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminFacade } from '../../../core/facades/admin.facade';
import { ModeracionFacade } from '../../../core/facades/moderacion.facade';
import { GRAVEDADES, Gravedad, Norma } from '../../../core/models/moderacion.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { LIMITES, sinSoloEspacios, valorUnico } from '../../../core/validators/agora.validators';
import { CampoError } from '../../../shared/components/campo-error';
import { ContadorCaracteres } from '../../../shared/components/contador-caracteres';
import { PluralPipe } from '../../../shared/pipes/plural.pipe';

/** Página contenedora: CRUD de las normas del foro. */
@Component({
  selector: 'app-admin-normas',
  imports: [ReactiveFormsModule, CampoError, ContadorCaracteres, PluralPipe],
  templateUrl: './admin-normas.html',
})
export class AdminNormas {
  protected readonly admin = inject(AdminFacade);
  protected readonly moderacion = inject(ModeracionFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly gravedades = GRAVEDADES;
  protected readonly limites = LIMITES;
  protected readonly editandoId = signal<number | null>(null);
  protected readonly enviado = signal(false);

  protected readonly form = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(LIMITES.tituloNorma.min),
        Validators.maxLength(LIMITES.tituloNorma.max),
        sinSoloEspacios,
        valorUnico((v) => this.admin.existeNorma(v, this.editandoId())),
      ],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(LIMITES.descripcionNorma.min),
        Validators.maxLength(LIMITES.descripcionNorma.max),
        sinSoloEspacios,
      ],
    }),
    gravedad: new FormControl<Gravedad>('MEDIA', { nonNullable: true, validators: [Validators.required] }),
  });

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.enviado());
  }

  protected editar(norma: Norma): void {
    this.editandoId.set(norma.id);
    this.enviado.set(false);
    this.form.reset({ titulo: norma.titulo, descripcion: norma.descripcion, gravedad: norma.gravedad });
  }

  protected cancelar(): void {
    this.editandoId.set(null);
    this.enviado.set(false);
    this.form.reset();
  }

  protected guardar(): void {
    this.enviado.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const id = this.editandoId();
    const datos = this.form.getRawValue();
    const resultado = id ? this.admin.editarNorma(id, datos) : this.admin.crearNorma(datos);
    if (this.notificaciones.resultado(resultado)) {
      this.cancelar();
    }
  }

  protected async eliminar(norma: Norma): Promise<void> {
    const usos = this.admin.usosDeNorma(norma.id);
    if (usos > 0) {
      this.notificaciones.error(`La norma ${norma.codigo} aparece en ${usos === 1 ? 'un reporte o sanción' : `${usos} reportes o sanciones`} y no se puede eliminar. Desactívala en su lugar.`);
      return;
    }
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar norma',
      mensaje: `Vas a eliminar ${norma.codigo} "${norma.titulo}". Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (ok) {
      this.notificaciones.resultado(this.admin.eliminarNorma(norma.id));
      if (this.editandoId() === norma.id) {
        this.cancelar();
      }
    }
  }
}
