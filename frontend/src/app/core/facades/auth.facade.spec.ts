import { TestBed } from '@angular/core/testing';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { AuthFacade } from './auth.facade';

describe('AuthFacade', () => {
  let auth: AuthFacade;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthFacade);
  });

  it('inicia sesión con nombre de usuario o correo', () => {
    expect(auth.iniciarSesion('camila.diaz', 'Usuario2026!').ok).toBe(true);
    expect(auth.usuarioActual()?.nombreUsuario).toBe('camila.diaz');
    expect(auth.rol()).toBe('USUARIO');

    auth.cerrarSesion();
    expect(auth.iniciarSesion('ADMIN@agoraforos.cl', 'Admin2026!').ok).toBe(true);
    expect(auth.esAdmin()).toBe(true);
    expect(auth.esModerador()).toBe(true);
  });

  it('rechaza una contraseña incorrecta sin revelar cuál dato falló', () => {
    const resultado = auth.iniciarSesion('camila.diaz', 'Incorrecta1!');
    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toBe('Usuario o contraseña incorrectos.');
    expect(auth.estaAutenticado()).toBe(false);
  });

  it('no deja entrar a una cuenta bloqueada', () => {
    TestBed.inject(UsuarioRepository).actualizar(4, { activo: false });
    const resultado = auth.iniciarSesion('matias.soto', 'Usuario2026!');
    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toContain('bloqueada');
  });

  it('cierra la sesión si un administrador bloquea la cuenta en uso', () => {
    auth.iniciarSesion('fernanda.lagos', 'Usuario2026!');
    TestBed.inject(UsuarioRepository).actualizar(5, { activo: false });
    expect(auth.usuarioActual()).toBeNull();
  });

  it('registra una cuenta nueva con rol USUARIO e inicia sesión', () => {
    const resultado = auth.registrar({
      nombreCompleto: 'Javiera Rojas',
      nombreUsuario: 'javiera.rojas',
      correo: 'javiera@correo.cl',
      password: 'Agora2026!',
    });
    expect(resultado.ok).toBe(true);
    expect(auth.usuarioActual()?.rol).toBe('USUARIO');
    expect(auth.existeNombreUsuario('javiera.rojas')).toBe(true);
  });

  it('rechaza el registro con nombre de usuario o correo repetido', () => {
    const base = { nombreCompleto: 'Otra Persona', password: 'Agora2026!' };
    const porUsuario = auth.registrar({ ...base, nombreUsuario: 'camila.diaz', correo: 'nueva@correo.cl' });
    const porCorreo = auth.registrar({ ...base, nombreUsuario: 'otra.persona', correo: 'Camila.Diaz@correo.cl' });
    expect(porUsuario.ok).toBe(false);
    expect(porUsuario.mensaje).toContain('nombre de usuario');
    expect(porCorreo.ok).toBe(false);
    expect(porCorreo.mensaje).toContain('correo');
  });

  it('recupera la contraseña con el código de 6 dígitos', () => {
    const solicitud = auth.solicitarRecuperacion('matias.soto@correo.cl');
    expect(solicitud.ok).toBe(true);
    expect(solicitud.dato).toMatch(/^\d{6}$/);
    expect(auth.verificarCodigo('000000').ok).toBe(solicitud.dato === '000000');
    expect(auth.verificarCodigo(solicitud.dato!).ok).toBe(true);
    expect(auth.restablecerPassword('Guitarra2026!').ok).toBe(true);
    expect(auth.iniciarSesion('matias.soto', 'Guitarra2026!').ok).toBe(true);
  });

  it('cambia la contraseña solo si la actual es correcta', () => {
    auth.iniciarSesion('camila.diaz', 'Usuario2026!');
    expect(auth.cambiarPassword('Otra2026!', 'Maraton2026!').ok).toBe(false);
    expect(auth.cambiarPassword('Usuario2026!', 'Maraton2026!').ok).toBe(true);
  });
});
