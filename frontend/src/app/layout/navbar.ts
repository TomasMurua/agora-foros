import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthFacade } from '../core/facades/auth.facade';
import { ModeracionFacade } from '../core/facades/moderacion.facade';
import { ETIQUETA_ROL } from '../core/models/usuario.model';
import { NotificacionService } from '../core/services/notificacion.service';
import { Avatar } from '../shared/components/avatar';

/** Barra de navegación. Muestra u oculta opciones según el rol de la sesión. */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule, Avatar],
  templateUrl: './navbar.html',
  host: { '(document:click)': 'alClickDocumento($event)' },
})
export class Navbar {
  protected readonly auth = inject(AuthFacade);
  protected readonly moderacion = inject(ModeracionFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly menuAbierto = signal(false);
  protected readonly cuentaAbierta = signal(false);
  protected readonly busqueda = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(100)],
  });
  protected readonly formBusqueda = new FormGroup({ texto: this.busqueda });

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuAbierto.set(false);
        this.cuentaAbierta.set(false);
      });
  }

  protected buscar(): void {
    const texto = this.busqueda.value.trim();
    this.router.navigate(['/explorar'], { queryParams: texto ? { q: texto } : {} });
    this.busqueda.reset();
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.notificaciones.info('Cerraste tu sesión. Vuelve pronto.');
    this.router.navigate(['/']);
  }

  protected alternarCuenta(evento: Event): void {
    evento.stopPropagation();
    this.cuentaAbierta.update((v) => !v);
  }

  protected alClickDocumento(evento: Event): void {
    const destino = evento.target as HTMLElement | null;
    if (this.cuentaAbierta() && !destino?.closest('.menu-cuenta')) {
      this.cuentaAbierta.set(false);
    }
  }
}
