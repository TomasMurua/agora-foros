import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/facades/auth.facade';
import { COLORES_AVATAR } from '../../core/models/usuario.model';
import { NotificacionService } from '../../core/services/notificacion.service';
import {
  LIMITES,
  PATRONES,
  camposIguales,
  correoValido,
  nombrePersonaValido,
  passwordSegura,
  valorUnico,
} from '../../core/validators/agora.validators';
import { Avatar } from '../../shared/components/avatar';
import { CampoError } from '../../shared/components/campo-error';
import { ChecklistPassword } from '../../shared/components/checklist-password';
import { ContadorCaracteres } from '../../shared/components/contador-caracteres';

/** Página contenedora: modificar los datos del perfil y cambiar la contraseña. */
@Component({
  selector: 'app-editar-perfil',
  imports: [ReactiveFormsModule, RouterLink, Avatar, CampoError, ChecklistPassword, ContadorCaracteres],
  templateUrl: './editar-perfil.html',
})
export class EditarPerfil {
  protected readonly auth = inject(AuthFacade);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly colores = COLORES_AVATAR;
  protected readonly limites = LIMITES;
  protected readonly patrones = PATRONES;
  protected readonly enviadoDatos = signal(false);
  protected readonly enviadoPassword = signal(false);
  protected readonly errorPassword = signal<string | null>(null);

  private readonly usuario = this.auth.usuarioActual()!;

  protected readonly formDatos = new FormGroup({
    nombreCompleto: new FormControl(this.usuario.nombreCompleto, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(LIMITES.nombrePersona.min),
        Validators.maxLength(LIMITES.nombrePersona.max),
        nombrePersonaValido,
      ],
    }),
    correo: new FormControl(this.usuario.correo, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(LIMITES.correo.max),
        correoValido,
        valorUnico((v) => this.auth.existeCorreo(v)),
      ],
    }),
    bio: new FormControl(this.usuario.bio, {
      nonNullable: true,
      validators: [Validators.maxLength(LIMITES.bio.max)],
    }),
    colorAvatar: new FormControl(this.usuario.colorAvatar, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly formPassword = new FormGroup(
    {
      actual: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      nueva: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordSegura(() => this.usuario.nombreUsuario)],
      }),
      confirmacion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [camposIguales('nueva', 'confirmacion')] },
  );

  protected invalidoDatos(campo: keyof typeof this.formDatos.controls): boolean {
    const c = this.formDatos.controls[campo];
    return c.invalid && (c.touched || this.enviadoDatos());
  }

  protected invalidoPassword(campo: keyof typeof this.formPassword.controls): boolean {
    const c = this.formPassword.controls[campo];
    return c.invalid && (c.touched || this.enviadoPassword());
  }

  protected guardarDatos(): void {
    this.enviadoDatos.set(true);
    this.formDatos.markAllAsTouched();
    if (this.formDatos.invalid) {
      return;
    }
    if (this.notificaciones.resultado(this.auth.actualizarPerfil(this.formDatos.getRawValue()))) {
      this.formDatos.markAsPristine();
      this.enviadoDatos.set(false);
    }
  }

  protected cambiarPassword(): void {
    this.enviadoPassword.set(true);
    this.formPassword.markAllAsTouched();
    if (this.formPassword.invalid) {
      return;
    }
    const { actual, nueva } = this.formPassword.getRawValue();
    const resultado = this.auth.cambiarPassword(actual, nueva);
    if (!resultado.ok) {
      this.errorPassword.set(resultado.mensaje);
      return;
    }
    this.errorPassword.set(null);
    this.notificaciones.exito(resultado.mensaje);
    this.formPassword.reset();
    this.enviadoPassword.set(false);
  }
}
