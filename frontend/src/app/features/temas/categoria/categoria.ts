import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { ForoFacade } from '../../../core/facades/foro.facade';
import { EstadoVacio } from '../../../shared/components/estado-vacio';
import { TemaCard } from '../../../shared/components/tema-card';

/** Página contenedora: temas de una categoría. */
@Component({
  selector: 'app-categoria-pagina',
  imports: [RouterLink, TemaCard, EstadoVacio],
  template: `
    @if (categoria(); as cat) {
      <section class="cabecera-pagina cabecera-categoria">
        <div class="container">
          <nav aria-label="Ruta de navegación">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a routerLink="/">Inicio</a></li>
              <li class="breadcrumb-item"><a routerLink="/explorar">Explorar</a></li>
              <li class="breadcrumb-item active" aria-current="page">{{ cat.nombre }}</li>
            </ol>
          </nav>
          <div class="d-flex flex-column flex-md-row align-items-md-center gap-3">
            <span class="categoria-icono categoria-icono-grande"><i class="bi" [class]="'bi bi-' + cat.icono" aria-hidden="true"></i></span>
            <div class="flex-grow-1">
              <h1 class="titulo-pagina mb-1">{{ cat.nombre }}</h1>
              <p class="bajada-pagina mb-0">{{ cat.descripcion }}</p>
            </div>
            @if (auth.estaAutenticado()) {
              <a class="btn btn-primary" routerLink="/temas/nuevo" [queryParams]="{ categoria: cat.id }">
                <i class="bi bi-plus-lg" aria-hidden="true"></i> Publicar aquí
              </a>
            } @else {
              <a class="btn btn-outline-primary" routerLink="/iniciar-sesion">Inicia sesión para publicar</a>
            }
          </div>
        </div>
      </section>
      <div class="container pb-5">
        <div class="row g-4">
          <section class="col-12 col-lg-8">
            @if (temas().length) {
              <div class="d-grid gap-3">
                @for (r of temas(); track r.tema.id) {
                  <app-tema-card [resumen]="r" />
                }
              </div>
            } @else {
              <app-estado-vacio titulo="Todavía no hay temas aquí" texto="Sé la primera persona en abrir una conversación en esta categoría." />
            }
          </section>
          <aside class="col-12 col-lg-4">
            <div class="panel">
              <h2 class="h6 text-uppercase texto-suave">Otras categorías</h2>
              <ul class="list-unstyled lista-categorias mb-0">
                @for (otra of foro.categorias(); track otra.id) {
                  @if (otra.id !== cat.id) {
                    <li>
                      <a [routerLink]="['/categorias', otra.id]"><i class="bi" [class]="'bi bi-' + otra.icono" aria-hidden="true"></i>{{ otra.nombre }}</a>
                      <span class="badge text-bg-light borde-suave">{{ foro.temasEnCategoria(otra.id) }}</span>
                    </li>
                  }
                }
              </ul>
            </div>
          </aside>
        </div>
      </div>
    } @else {
      <div class="container py-5">
        <app-estado-vacio titulo="La categoría no existe" texto="Puede que la hayan eliminado o que el enlace esté mal escrito." imagen="ilustraciones/no-encontrado.svg">
          <a class="btn btn-primary" routerLink="/explorar">Ir a explorar</a>
        </app-estado-vacio>
      </div>
    }
  `,
})
export class CategoriaPagina {
  protected readonly foro = inject(ForoFacade);
  protected readonly auth = inject(AuthFacade);
  readonly id = input.required({ transform: numberAttribute });

  protected readonly categoria = computed(() => this.foro.categoriaPorId(this.id()));
  protected readonly temas = computed(() => this.foro.temasDeCategoria(this.id()));
}
