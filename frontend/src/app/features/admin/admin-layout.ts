import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminFacade } from '../../core/facades/admin.facade';

/** Estructura común de las páginas de administración (título y menú de secciones). */
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="cabecera-pagina cabecera-admin">
      <div class="container">
        <p class="eyebrow">Administración</p>
        <h1 class="titulo-pagina">Gestión del foro</h1>
        <div class="row g-2 mt-2 resumen-admin">
          <div class="col-6 col-md-3"><div class="cifra"><span>{{ admin.resumen().total }}</span>cuentas</div></div>
          <div class="col-6 col-md-3"><div class="cifra"><span>{{ admin.resumen().activos }}</span>activas</div></div>
          <div class="col-6 col-md-3"><div class="cifra"><span>{{ admin.resumen().bloqueados }}</span>bloqueadas</div></div>
          <div class="col-6 col-md-3"><div class="cifra"><span>{{ admin.resumen().moderadores }}</span>en el equipo</div></div>
        </div>
      </div>
    </section>
    <div class="container pb-5">
      <nav class="pestanas" aria-label="Secciones de administración">
        @for (s of secciones; track s.ruta) {
          <a class="pestana" [routerLink]="s.ruta" routerLinkActive="activa" ariaCurrentWhenActive="page">
            <i class="bi" [class]="'bi bi-' + s.icono" aria-hidden="true"></i>{{ s.nombre }}
          </a>
        }
      </nav>
      <router-outlet />
    </div>
  `,
})
export class AdminLayout {
  protected readonly admin = inject(AdminFacade);
  protected readonly secciones = [
    { ruta: 'usuarios', nombre: 'Usuarios', icono: 'people' },
    { ruta: 'categorias', nombre: 'Categorías', icono: 'grid' },
    { ruta: 'normas', nombre: 'Normas', icono: 'journal-check' },
    { ruta: 'sanciones', nombre: 'Sanciones', icono: 'clock-history' },
  ];
}
