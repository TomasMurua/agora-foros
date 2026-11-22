import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ForoFacade } from '../../../core/facades/foro.facade';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { LIMITES, sinSoloEspacios } from '../../../core/validators/agora.validators';
import { CampoError } from '../../../shared/components/campo-error';
import { ContadorCaracteres } from '../../../shared/components/contador-caracteres';

/** Página contenedora: publicar un tema nuevo o editar uno propio (misma pantalla). */
@Component({
  selector: 'app-tema-form',
  imports: [ReactiveFormsModule, RouterLink, CampoError, ContadorCaracteres],
  templateUrl: './tema-form.html',
})
export class TemaForm implements OnInit {
  protected readonly foro = inject(ForoFacade);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);

  /** :id de la ruta al editar. */
  readonly id = input<string | undefined>(undefined);
  /** ?categoria= para preseleccionar la categoría al publicar. */
  readonly categoria = input<string | undefined>(undefined);

  protected readonly modoEdicion = computed(() => !!this.id());
  protected readonly enviado = signal(false);
  protected readonly limitesTitulo = LIMITES.tituloTema;
  protected readonly limitesContenido = LIMITES.contenidoTema;

  protected readonly form = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(LIMITES.tituloTema.min),
        Validators.maxLength(LIMITES.tituloTema.max),
        sinSoloEspacios,
      ],
    }),
    categoriaId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    contenido: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(LIMITES.contenidoTema.min),
        Validators.maxLength(LIMITES.contenidoTema.max),
        sinSoloEspacios,
      ],
    }),
  });

  ngOnInit(): void {
    if (this.modoEdicion()) {
      const tema = this.foro.temaPorId(Number(this.id()));
      if (!tema || !this.foro.puedeEditarTema(tema)) {
        this.notificaciones.error('Solo el autor puede editar este tema.');
        this.router.navigate(tema ? ['/temas', tema.id] : ['/explorar']);
        return;
      }
      this.form.setValue({ titulo: tema.titulo, categoriaId: tema.categoriaId, contenido: tema.contenido });
    } else {
      const categoriaId = Number(this.categoria());
      if (this.foro.categoriaPorId(categoriaId)) {
        this.form.controls.categoriaId.setValue(categoriaId);
      }
    }
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.enviado());
  }

  protected guardar(): void {
    this.enviado.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.notificaciones.error('Revisa los campos marcados antes de publicar.');
      return;
    }
    const datos = this.form.getRawValue();
    const resultado = this.modoEdicion()
      ? this.foro.editarTema(Number(this.id()), { ...datos, categoriaId: datos.categoriaId! })
      : this.foro.publicarTema({ ...datos, categoriaId: datos.categoriaId! });
    if (this.notificaciones.resultado(resultado) && resultado.dato) {
      this.router.navigate(['/temas', resultado.dato.id]);
    }
  }
}
