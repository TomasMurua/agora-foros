import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página 404. */
@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  template: `
    <div class="container py-5">
      <div class="pagina-error">
        <img src="ilustraciones/no-encontrado.svg" alt="Columna griega caída junto a un signo de pregunta" width="320" height="250" />
        <p class="codigo-error">404</p>
        <h1 class="titulo-pagina">Esta página no está en la plaza</h1>
        <p class="bajada-pagina">El enlace puede estar mal escrito o la página ya no existe.</p>
        <div class="d-flex flex-wrap justify-content-center gap-2 mt-3">
          <a class="btn btn-primary" routerLink="/">Volver al inicio</a>
          <a class="btn btn-outline-primary" routerLink="/explorar">Explorar temas</a>
        </div>
      </div>
    </div>
  `,
})
export class NoEncontrado {}
