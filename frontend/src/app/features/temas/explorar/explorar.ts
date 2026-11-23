import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, map, startWith } from 'rxjs';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { ForoFacade } from '../../../core/facades/foro.facade';
import { EstadoTema, FiltrosTemas, OrdenTemas } from '../../../core/models/foro.model';
import { CampoError } from '../../../shared/components/campo-error';
import { EstadoVacio } from '../../../shared/components/estado-vacio';
import { TemaCard } from '../../../shared/components/tema-card';

/** Página contenedora: búsqueda de temas con filtros. */
@Component({
  selector: 'app-explorar',
  imports: [ReactiveFormsModule, RouterLink, TemaCard, EstadoVacio, CampoError],
  templateUrl: './explorar.html',
})
export class Explorar {
  protected readonly foro = inject(ForoFacade);
  protected readonly auth = inject(AuthFacade);

  /** Parámetros opcionales de la URL: ?q=texto&categoria=1 */
  readonly q = input<string | undefined>('');
  readonly categoria = input<string | undefined>('');

  protected readonly filtros = new FormGroup({
    texto: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    categoriaId: new FormControl<number | null>(null),
    autor: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    estado: new FormControl<EstadoTema | ''>('', { nonNullable: true }),
    orden: new FormControl<OrdenTemas>('recientes', { nonNullable: true }),
  });

  private readonly valores = toSignal(
    this.filtros.valueChanges.pipe(
      debounceTime(150),
      startWith(null),
      map(() => this.filtros.getRawValue() as FiltrosTemas),
    ),
    { requireSync: true },
  );

  protected readonly resultados = computed(() => {
    const valores = this.valores();
    if (this.filtros.invalid) {
      return [];
    }
    return this.foro.buscarTemas(valores);
  });

  protected readonly hayFiltros = computed(() => {
    const v = this.valores();
    return !!(v.texto || v.categoriaId || v.autor || v.estado);
  });

  constructor() {
    // Observa los parámetros de la URL: la búsqueda rápida de la barra los cambia
    // aunque la página ya esté abierta.
    effect(() => {
      const texto = this.q() ?? '';
      const categoriaId = Number(this.categoria());
      untracked(() =>
        this.filtros.patchValue({
          texto,
          categoriaId: Number.isInteger(categoriaId) && categoriaId > 0 ? categoriaId : null,
        }),
      );
    });
  }

  protected limpiar(): void {
    this.filtros.reset();
  }
}
