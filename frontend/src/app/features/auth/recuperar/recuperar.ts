import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { NotificacionService } from '../../../core/services/notificacion.service';
import {
  LIMITES,
  PATRONES,
  camposIguales,
  codigoVerificacion,
  correoValido,
  passwordSegura,
} from '../../../core/validators/agora.validators';
import { CampoError } from '../../../shared/components/campo-error';
import { ChecklistPassword } from '../../../shared/components/checklist-password';

type Paso = 1 | 2 | 3;

/**
 * Página contenedora: recuperación de contraseña en tres pasos (correo,
 * código de 6 dígitos y nueva contraseña). No hay servidor de correo, así
 * que el código se muestra en un aviso en pantalla.
 */
@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink, CampoError, ChecklistPassword],
  templateUrl: './recuperar.html',
})
export class Recuperar {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly limites = LIMITES;
  protected readonly patrones = PATRONES;
  protected readonly pasos = [
    { numero: 1, nombre: 'Correo' },
    { numero: 2, nombre: 'Código' },
    { numero: 3, nombre: 'Nueva contraseña' },
  ];
  protected readonly paso = signal<Paso>(1);
  protected readonly enviado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<{ mensaje: string; codigo: string } | null>(null);
  protected readonly nombreUsuario = signal('');

  protected readonly formCorreo = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(LIMITES.correo.max), correoValido],
    }),
  });

  protected readonly formCodigo = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, codigoVerificacion],
    }),
  });

  protected readonly formPassword = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordSegura(() => this.nombreUsuario())],
      }),
      confirmacion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [camposIguales('password', 'confirmacion')] },
  );

  protected invalido(control: FormControl): boolean {
    return control.invalid && (control.touched || this.enviado());
  }

  protected enviarCorreo(): void {
    this.enviado.set(true);
    this.formCorreo.markAllAsTouched();
    if (this.formCorreo.invalid) {
      return;
    }
    const resultado = this.auth.solicitarRecuperacion(this.formCorreo.controls.correo.value);
    if (!resultado.ok) {
      this.error.set(resultado.mensaje);
      return;
    }
    this.error.set(null);
    this.aviso.set({ mensaje: resultado.mensaje, codigo: resultado.dato! });
    this.nombreUsuario.set(this.auth.nombreUsuarioEnRecuperacion());
    this.avanzar(2);
  }

  protected verificar(): void {
    this.enviado.set(true);
    this.formCodigo.markAllAsTouched();
    if (this.formCodigo.invalid) {
      return;
    }
    const resultado = this.auth.verificarCodigo(this.formCodigo.controls.codigo.value);
    if (!resultado.ok) {
      this.error.set(resultado.mensaje);
      if (resultado.mensaje.includes('Solicita')) {
        this.aviso.set(null);
        this.formCodigo.reset();
        this.avanzar(1);
        this.error.set(resultado.mensaje);
      }
      return;
    }
    this.error.set(null);
    this.notificaciones.exito(resultado.mensaje);
    this.avanzar(3);
  }

  protected guardar(): void {
    this.enviado.set(true);
    this.formPassword.markAllAsTouched();
    if (this.formPassword.invalid) {
      return;
    }
    const resultado = this.auth.restablecerPassword(this.formPassword.controls.password.value);
    if (!resultado.ok) {
      this.error.set(resultado.mensaje);
      return;
    }
    this.notificaciones.exito(resultado.mensaje);
    this.router.navigate(['/iniciar-sesion']);
  }

  protected reenviar(): void {
    this.formCodigo.reset();
    this.enviarCorreo();
  }

  private avanzar(paso: Paso): void {
    this.paso.set(paso);
    this.enviado.set(false);
  }
}
