import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { NotificacionService } from '../../../core/services/notificacion.service';
import {
  LIMITES,
  PATRONES,
  camposIguales,
  correoValido,
  nombrePersonaValido,
  nombreUsuarioValido,
  passwordSegura,
  valorUnico,
} from '../../../core/validators/agora.validators';
import { CampoError } from '../../../shared/components/campo-error';
import { ChecklistPassword } from '../../../shared/components/checklist-password';

/** Página contenedora: registro de una cuenta nueva con rol USUARIO. */
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, CampoError, ChecklistPassword],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly patrones = PATRONES;
  protected readonly limites = LIMITES;
  protected readonly enviado = signal(false);
  protected readonly verPassword = signal(false);

  protected readonly form = new FormGroup(
    {
      nombreCompleto: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(LIMITES.nombrePersona.min),
          Validators.maxLength(LIMITES.nombrePersona.max),
          nombrePersonaValido,
        ],
      }),
      nombreUsuario: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(LIMITES.nombreUsuario.min),
          Validators.maxLength(LIMITES.nombreUsuario.max),
          nombreUsuarioValido,
          valorUnico((v) => this.auth.existeNombreUsuario(v)),
        ],
      }),
      correo: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(LIMITES.correo.max),
          Validators.email,
          correoValido,
          valorUnico((v) => this.auth.existeCorreo(v)),
        ],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordSegura(() => this.nombreUsuarioIngresado())],
      }),
      confirmacion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      aceptaNormas: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    },
    { validators: [camposIguales('password', 'confirmacion')] },
  );

  constructor() {
    // Si cambia el nombre de usuario, la regla "no contener el usuario" se vuelve a revisar.
    this.form.controls.nombreUsuario.valueChanges.subscribe(() =>
      this.form.controls.password.updateValueAndValidity({ emitEvent: false }),
    );
  }

  private nombreUsuarioIngresado(): string {
    return this.form?.controls.nombreUsuario.value ?? '';
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.enviado());
  }

  protected registrar(): void {
    this.enviado.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.notificaciones.error('Revisa los campos marcados en rojo.');
      return;
    }
    const { nombreCompleto, nombreUsuario, correo, password } = this.form.getRawValue();
    const resultado = this.auth.registrar({ nombreCompleto, nombreUsuario, correo, password });
    if (this.notificaciones.resultado(resultado)) {
      this.router.navigate(['/perfil']);
    }
  }
}
