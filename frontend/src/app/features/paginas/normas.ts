import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModeracionFacade } from '../../core/facades/moderacion.facade';

/** Página pública con las normas del foro. */
@Component({
  selector: 'app-normas-publicas',
  imports: [RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-12 col-md-8">
            <p class="eyebrow">Convivencia</p>
            <h1 class="titulo-pagina">Normas del foro</h1>
            <p class="bajada-pagina mb-0">Son pocas y claras. Si ves contenido que no las cumple, usa el botón Reportar y el equipo de moderación lo revisa.</p>
          </div>
          <div class="col-md-4 d-none d-md-block text-center">
            <img src="ilustraciones/normas.svg" alt="" width="160" height="160" />
          </div>
        </div>
      </div>
    </section>
    <div class="container pb-5">
      <div class="row g-3">
        @for (n of moderacion.normas(); track n.id) {
          <div class="col-12 col-md-6 col-lg-4">
            <article class="panel norma-card h-100">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="codigo-norma">{{ n.codigo }}</span>
                <span class="badge gravedad" [class]="'badge gravedad gravedad-' + n.gravedad.toLowerCase()">Gravedad {{ n.gravedad.toLowerCase() }}</span>
              </div>
              <h2 class="h5">{{ n.titulo }}</h2>
              <p class="mb-0 texto-suave">{{ n.descripcion }}</p>
            </article>
          </div>
        }
      </div>
      <div class="panel mt-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
        <i class="bi bi-info-circle fs-3 text-acento" aria-hidden="true"></i>
        <p class="mb-0 flex-grow-1">Cuando un tema o comentario no cumple una norma, el equipo de moderación puede banearlo. Queda registrado en el historial de sanciones y se puede restaurar si se revisa en apelación.</p>
        <a class="btn btn-outline-primary" routerLink="/explorar">Ir a los temas</a>
      </div>
    </div>
  `,
})
export class NormasPublicas {
  protected readonly moderacion = inject(ModeracionFacade);
}
