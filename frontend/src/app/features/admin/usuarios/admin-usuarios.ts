import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { AdminFacade, UsuarioAdmin } from '../../../core/facades/admin.facade';
import { normalizar } from '../../../core/facades/foro.facade';
import { ETIQUETA_ROL, ROLES, Rol } from '../../../core/models/usuario.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Avatar } from '../../../shared/components/avatar';
import { CampoError } from '../../../shared/components/campo-error';
import { EstadoVacio } from '../../../shared/components/estado-vacio';

/** Página contenedora: lista de cuentas con filtros, cambio de rol, bloqueo y eliminación. */
@Component({
  selector: 'app-admin-usuarios',
  imports: [ReactiveFormsModule, DatePipe, Avatar, EstadoVacio, CampoError],
  templateUrl: './admin-usuarios.html',
})
export class AdminUsuarios {
  protected readonly admin = inject(AdminFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly roles = ROLES;
  protected readonly etiquetaRol = ETIQUETA_ROL;

  protected readonly filtros = new FormGroup({
    texto: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] }),
    rol: new FormControl<Rol | ''>('', { nonNullable: true }),
    estado: new FormControl<'' | 'activos' | 'bloqueados'>('', { nonNullable: true }),
  });

  private readonly valores = toSignal(
    this.filtros.valueChanges.pipe(startWith(this.filtros.getRawValue())),
    { requireSync: true },
  );

  protected readonly lista = computed(() => {
    const { texto, rol, estado } = { ...this.filtros.getRawValue(), ...this.valores() };
    const buscado = normalizar(texto ?? '');
    return this.admin.usuarios().filter((u) => {
      if (rol && u.rol !== rol) return false;
      if (estado === 'activos' && !u.activo) return false;
      if (estado === 'bloqueados' && u.activo) return false;
      if (buscado) {
        return normalizar(`${u.nombreUsuario} ${u.nombreCompleto} ${u.correo}`).includes(buscado);
      }
      return true;
    });
  });

  protected async cambiarRol(u: UsuarioAdmin, evento: Event): Promise<void> {
    const select = evento.target as HTMLSelectElement;
    const rol = select.value as Rol;
    const ok = await this.confirmacion.confirmar({
      titulo: 'Cambiar rol',
      mensaje: `${u.nombreUsuario} pasará de ${ETIQUETA_ROL[u.rol]} a ${ETIQUETA_ROL[rol]}. Sus permisos cambian de inmediato.`,
      textoConfirmar: 'Cambiar rol',
    });
    if (ok) {
      this.notificaciones.resultado(this.admin.cambiarRol(u.id, rol));
    } else {
      select.value = u.rol;
    }
  }

  protected async alternarBloqueo(u: UsuarioAdmin): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: u.activo ? 'Bloquear cuenta' : 'Desbloquear cuenta',
      mensaje: u.activo
        ? `${u.nombreUsuario} no podrá iniciar sesión mientras su cuenta esté bloqueada. Si tiene una sesión abierta, se cerrará.`
        : `${u.nombreUsuario} podrá volver a iniciar sesión.`,
      textoConfirmar: u.activo ? 'Bloquear' : 'Desbloquear',
      peligro: u.activo,
    });
    if (ok) {
      this.notificaciones.resultado(this.admin.alternarBloqueo(u.id));
    }
  }

  protected async eliminar(u: UsuarioAdmin): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar cuenta',
      mensaje: `Vas a eliminar la cuenta de ${u.nombreUsuario}. Sus ${u.temas} temas quedarán publicados. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar cuenta',
      peligro: true,
    });
    if (ok) {
      this.notificaciones.resultado(this.admin.eliminarUsuario(u.id));
    }
  }
}
