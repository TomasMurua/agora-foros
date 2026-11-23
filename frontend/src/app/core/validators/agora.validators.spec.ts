import { FormControl, FormGroup } from '@angular/forms';
import {
  camposIguales,
  codigoVerificacion,
  correoValido,
  mensajeDeError,
  nombrePersonaValido,
  nombreUsuarioValido,
  passwordSegura,
  sinSoloEspacios,
  valorUnico,
} from './agora.validators';

describe('Validadores de Ágora', () => {
  describe('passwordSegura', () => {
    const validar = (valor: string, usuario = '') => passwordSegura(() => usuario)(new FormControl(valor));

    it('acepta una contraseña que cumple todas las reglas', () => {
      expect(validar('Agora2026!')).toBeNull();
    });

    it('no valida un campo vacío (eso lo hace required)', () => {
      expect(validar('')).toBeNull();
    });

    it('marca cada regla incumplida con su propia clave', () => {
      const errores = validar('abc');
      expect(errores).toEqual(
        expect.objectContaining({ pwLongitud: true, pwMayuscula: true, pwNumero: true, pwEspecial: true }),
      );
      expect(errores?.['pwMinuscula']).toBeUndefined();
    });

    it('rechaza más de 20 caracteres', () => {
      expect(validar('Aa1!aaaaaaaaaaaaaaaaaaaa')?.['pwLongitud']).toBe(true);
    });

    it('exige minúscula', () => {
      expect(validar('AGORA2026!')?.['pwMinuscula']).toBe(true);
    });

    it('rechaza espacios', () => {
      expect(validar('Agora 2026!')?.['pwSinEspacios']).toBe(true);
    });

    it('rechaza contraseñas que contienen el nombre de usuario, sin importar mayúsculas', () => {
      expect(validar('Camila.Diaz1!', 'camila.diaz')?.['pwContieneUsuario']).toBe(true);
      expect(validar('Agora2026!', 'camila.diaz')).toBeNull();
    });
  });

  describe('camposIguales', () => {
    const crearGrupo = (a: string, b: string) =>
      new FormGroup(
        { password: new FormControl(a), confirmacion: new FormControl(b) },
        { validators: camposIguales('password', 'confirmacion') },
      );

    it('marca el grupo y la confirmación cuando no coinciden', () => {
      const grupo = crearGrupo('Agora2026!', 'Agora2026?');
      expect(grupo.errors).toEqual({ noCoincide: true });
      expect(grupo.controls.confirmacion.errors).toEqual({ noCoincide: true });
    });

    it('limpia el error cuando vuelven a coincidir', () => {
      const grupo = crearGrupo('Agora2026!', 'otra');
      grupo.controls.confirmacion.setValue('Agora2026!');
      expect(grupo.errors).toBeNull();
      expect(grupo.controls.confirmacion.errors).toBeNull();
    });
  });

  it('correoValido exige nombre@dominio.ext', () => {
    expect(correoValido(new FormControl('camila.diaz@correo.cl'))).toBeNull();
    expect(correoValido(new FormControl('camila@correo'))).toEqual({ correo: true });
    expect(correoValido(new FormControl('sin-arroba.cl'))).toEqual({ correo: true });
  });

  it('nombreUsuarioValido acepta minúsculas, números, punto y guion bajo (3 a 30)', () => {
    expect(nombreUsuarioValido(new FormControl('matias.soto_2'))).toBeNull();
    expect(nombreUsuarioValido(new FormControl('Matias'))).toEqual({ nombreUsuario: true });
    expect(nombreUsuarioValido(new FormControl('ab'))).toEqual({ nombreUsuario: true });
    expect(nombreUsuarioValido(new FormControl('con espacio'))).toEqual({ nombreUsuario: true });
  });

  it('nombrePersonaValido acepta letras con tilde y espacios', () => {
    expect(nombrePersonaValido(new FormControl('Matías Núñez'))).toBeNull();
    expect(nombrePersonaValido(new FormControl('R2D2'))).toEqual({ nombrePersona: true });
    expect(nombrePersonaValido(new FormControl('A'))).toEqual({ nombrePersona: true });
  });

  it('sinSoloEspacios rechaza textos en blanco', () => {
    expect(sinSoloEspacios(new FormControl('   '))).toEqual({ soloEspacios: true });
    expect(sinSoloEspacios(new FormControl(' hola '))).toBeNull();
  });

  it('valorUnico usa la función que entrega la fachada', () => {
    const validador = valorUnico((v) => ['admin', 'moderador'].includes(v));
    expect(validador(new FormControl('admin'))).toEqual({ yaExiste: true });
    expect(validador(new FormControl('nuevo.usuario'))).toBeNull();
  });

  it('codigoVerificacion exige 6 dígitos', () => {
    expect(codigoVerificacion(new FormControl('123456'))).toBeNull();
    expect(codigoVerificacion(new FormControl('12345a'))).toEqual({ codigo: true });
  });

  it('mensajeDeError entrega mensajes en español', () => {
    expect(mensajeDeError('required', true)).toBe('Este campo es obligatorio.');
    expect(mensajeDeError('minlength', { requiredLength: 5 })).toBe('Debe tener al menos 5 caracteres.');
    expect(mensajeDeError('pwMayuscula', true)).toContain('mayúscula');
  });
});
