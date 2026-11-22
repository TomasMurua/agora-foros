import { Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { sinSoloEspacios } from '../../../core/validators/agora.validators';
import { CampoError } from '../../../shared/components/campo-error';

/** Cuentas de prueba, las mismas del script de la base de datos. */
const CUENTAS_DEMO = [
  { usuario: 'admin', password: 'Admin2026!', rol: 'Administrador' },
  { usuario: 'moderador', password: 'Moder2026!', rol: 'Moderador' },
  { usuario: 'camila.diaz', password: 'Usuario2026!', rol: 'Usuario' },
];

/** Página contenedora: inicio de sesión con nombre de usuario o correo. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CampoError],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  /** ?volver=/ruta para regresar después del login. */
  readonly volver = input<string | undefined>(undefined);

  protected readonly cuentasDemo = CUENTAS_DEMO;
  protected readonly enviado = signal(false);
  protected readonly verPassword = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    identificador: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120), sinSoloEspacios],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
  });

  protected invalido(campo: 'identificador' | 'password'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.enviado());
  }

  protected usarCuenta(usuario: string, password: string): void {
    this.form.setValue({ identificador: usuario, password });
    this.error.set(null);
  }

  protected ingresar(): void {
    this.enviado.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { identificador, password } = this.form.getRawValue();
    const resultado = this.auth.iniciarSesion(identificador.trim(), password);
    if (!resultado.ok) {
      this.error.set(resultado.mensaje);
      return;
    }
    this.error.set(null);
    this.notificaciones.exito(resultado.mensaje);
    const destino = this.volver();
    this.router.navigateByUrl(destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/');
  }
}
