import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/facades/auth.facade';
import { ForoFacade } from '../../core/facades/foro.facade';
import { ETIQUETA_ROL } from '../../core/models/usuario.model';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Avatar } from '../../shared/components/avatar';
import { CampoError } from '../../shared/components/campo-error';
import { EstadoVacio } from '../../shared/components/estado-vacio';
import { Modal } from '../../shared/components/modal';
import { TemaCard } from '../../shared/components/tema-card';

/** Página contenedora: perfil de la persona con sesión iniciada. */
@Component({
  selector: 'app-perfil',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, Avatar, TemaCard, EstadoVacio, Modal, CampoError],
  templateUrl: './perfil.html',
})
export class Perfil {
  protected readonly auth = inject(AuthFacade);
  protected readonly foro = inject(ForoFacade);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);

  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly usuario = this.auth.usuarioActual;
  protected readonly actividad = computed(() => {
    const u = this.usuario();
    return u ? this.auth.actividadDe(u.id) : { temas: 0, comentarios: 0 };
  });
  protected readonly ultimosTemas = computed(() => this.foro.misTemas().slice(0, 4));

  protected readonly confirmandoEliminacion = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly passwordEliminar = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly formEliminar = new FormGroup({ password: this.passwordEliminar });

  protected abrirEliminacion(): void {
    this.passwordEliminar.reset();
    this.enviado.set(false);
    this.error.set(null);
    this.confirmandoEliminacion.set(true);
  }

  protected eliminarCuenta(): void {
    this.enviado.set(true);
    this.passwordEliminar.markAsTouched();
    if (this.passwordEliminar.invalid) {
      return;
    }
    const resultado = this.auth.eliminarCuenta(this.passwordEliminar.value);
    if (!resultado.ok) {
      this.error.set(resultado.mensaje);
      return;
    }
    this.confirmandoEliminacion.set(false);
    this.notificaciones.exito(resultado.mensaje);
    this.router.navigate(['/']);
  }
}
