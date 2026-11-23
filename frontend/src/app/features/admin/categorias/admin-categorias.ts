import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminFacade, ICONOS_CATEGORIA } from '../../../core/facades/admin.facade';
import { ForoFacade } from '../../../core/facades/foro.facade';
import { Categoria } from '../../../core/models/foro.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { LIMITES, sinSoloEspacios, valorUnico } from '../../../core/validators/agora.validators';
import { CampoError } from '../../../shared/components/campo-error';
import { ContadorCaracteres } from '../../../shared/components/contador-caracteres';
import { plural } from '../../../core/utils/plural';
import { PluralPipe } from '../../../shared/pipes/plural.pipe';

/** Página contenedora: CRUD de categorías del foro. */
@Component({
  selector: 'app-admin-categorias',
  imports: [ReactiveFormsModule, CampoError, ContadorCaracteres, PluralPipe],
  templateUrl: './admin-categorias.html',
})
export class AdminCategorias {
  protected readonly admin = inject(AdminFacade);
  protected readonly foro = inject(ForoFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly iconos = ICONOS_CATEGORIA;
  protected readonly limites = LIMITES;
  protected readonly editandoId = signal<number | null>(null);
  protected readonly enviado = signal(false);

  protected readonly form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(LIMITES.nombreCategoria.min),
        Validators.maxLength(LIMITES.nombreCategoria.max),
        sinSoloEspacios,
        valorUnico((v) => this.admin.existeCategoria(v, this.editandoId())),
      ],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(LIMITES.descripcion.max)],
    }),
    icono: new FormControl('chat-square-text', { nonNullable: true, validators: [Validators.required] }),
  });

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.enviado());
  }

  protected editar(categoria: Categoria): void {
    this.editandoId.set(categoria.id);
    this.enviado.set(false);
    this.form.reset({ nombre: categoria.nombre, descripcion: categoria.descripcion, icono: categoria.icono });
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
    const resultado = id ? this.admin.editarCategoria(id, datos) : this.admin.crearCategoria(datos);
    if (this.notificaciones.resultado(resultado)) {
      this.cancelar();
    }
  }

  protected async eliminar(categoria: Categoria): Promise<void> {
    const temas = this.admin.temasDeCategoria(categoria.id);
    if (temas > 0) {
      this.notificaciones.error(`"${categoria.nombre}" tiene ${plural(temas, 'tema', 'temas')}. Solo se eliminan categorías vacías.`);
      return;
    }
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar categoría',
      mensaje: `Vas a eliminar la categoría "${categoria.nombre}". Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (ok) {
      this.notificaciones.resultado(this.admin.eliminarCategoria(categoria.id));
      if (this.editandoId() === categoria.id) {
        this.cancelar();
      }
    }
  }
}
