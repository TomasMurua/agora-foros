import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar';
import { Pie } from './layout/pie';
import { ContenedorAvisos } from './shared/components/contenedor-avisos';
import { DialogoConfirmacion } from './shared/components/dialogo-confirmacion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Pie, ContenedorAvisos, DialogoConfirmacion],
  template: `
    <a class="saltar-contenido" href="#contenido">Saltar al contenido</a>
    <app-navbar />
    <main id="contenido" class="principal" tabindex="-1">
      <router-outlet />
    </main>
    <app-pie />
    <app-contenedor-avisos />
    <app-dialogo-confirmacion />
  `,
})
export class App {}
