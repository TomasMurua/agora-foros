import { Component, inject } from '@angular/core';
import { AuthFacade } from '../core/facades/auth.facade';
import { RouterLink } from '@angular/router';

/** Pie de página con enlaces y la nota de los datos de demostración. */
@Component({
  selector: 'app-pie',
  imports: [RouterLink],
  template: `
    <footer class="pie">
      <div class="container">
        <div class="row g-4">
          <div class="col-12 col-md-6 col-lg-5">
            <a class="marca marca-pie" routerLink="/">
              <img src="logo-agora.svg" alt="" width="34" height="34" />
              <span class="marca-texto"><span class="marca-agora">Ágora</span><span class="marca-foros">Foros</span></span>
            </a>
            <p class="mt-3 mb-0">La plaza donde se conversa de tecnología, juegos, cine, deporte y música. Pregunta, responde y aprende con otras personas.</p>
          </div>
          <div class="col-6 col-md-3 col-lg-2 offset-lg-1">
            <h2 class="pie-titulo">Explorar</h2>
            <ul class="list-unstyled">
              <li><a routerLink="/explorar">Todos los temas</a></li>
              <li><a routerLink="/normas">Normas del foro</a></li>
            </ul>
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <h2 class="pie-titulo">Tu cuenta</h2>
            <ul class="list-unstyled">
              @if (auth.estaAutenticado()) {
                <li><a routerLink="/perfil">Mi perfil</a></li>
                <li><a routerLink="/mis-temas">Mis temas</a></li>
                <li><a routerLink="/mis-reportes">Mis reportes</a></li>
                <li><a routerLink="/temas/nuevo">Publicar un tema</a></li>
              } @else {
                <li><a routerLink="/iniciar-sesion">Iniciar sesión</a></li>
                <li><a routerLink="/registro">Crear cuenta</a></li>
                <li><a routerLink="/recuperar-contrasena">Recuperar contraseña</a></li>
              }
            </ul>
          </div>
          <div class="col-12 col-lg-2">
            <h2 class="pie-titulo">Demostración</h2>
            <p class="small mb-0">Los datos viven en memoria. Al recargar la página vuelven a su estado inicial.</p>
          </div>
        </div>
        <hr />
        <p class="small mb-0">Ágora Foros, 2026. Proyecto académico de Desarrollo Full Stack III.</p>
      </div>
    </footer>
  `,
})
export class Pie {
  protected readonly auth = inject(AuthFacade);
}
