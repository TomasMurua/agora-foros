import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/facades/auth.facade';
import { ETIQUETA_ROL } from '../../core/models/usuario.model';

/** Página a la que manda rolGuard cuando el rol no tiene permiso. */
@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink],
  template: `
    <div class="container py-5">
      <div class="pagina-error">
        <img src="ilustraciones/acceso.svg" alt="Candado frente a una puerta con columnas" width="300" height="240" />
        <p class="codigo-error">403</p>
        <h1 class="titulo-pagina">No tienes acceso a esta sección</h1>
        <p class="bajada-pagina">
          @if (auth.rol(); as rol) {
            Tu cuenta tiene el rol {{ etiquetaRol[rol] }} y esta página es para otro rol.
          } @else {
            Inicia sesión con una cuenta que tenga permiso.
          }
        </p>
        <a class="btn btn-primary mt-3" routerLink="/">Volver al inicio</a>
      </div>
    </div>
  `,
})
export class AccesoDenegado {
  protected readonly auth = inject(AuthFacade);
  protected readonly etiquetaRol = ETIQUETA_ROL;
}
