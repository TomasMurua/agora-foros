import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthFacade } from '../facades/auth.facade';
import { Rol } from '../models/usuario.model';
import { rolGuard } from './rol.guard';

describe('rolGuard', () => {
  let auth: AuthFacade;
  let router: Router;

  const ejecutar = (roles: Rol[], url = '/admin/usuarios') =>
    TestBed.runInInjectionContext(() =>
      rolGuard({ data: { roles } } as unknown as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthFacade);
    router = TestBed.inject(Router);
  });

  it('sin sesión manda al login y recuerda la ruta', () => {
    const resultado = ejecutar(['ADMIN']) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/iniciar-sesion?volver=%2Fadmin%2Fusuarios');
  });

  it('deja pasar a un ADMIN a una ruta de ADMIN', () => {
    auth.iniciarSesion('admin', 'Admin2026!');
    expect(ejecutar(['ADMIN'])).toBe(true);
  });

  it('deja pasar a MODERADOR al panel de moderación', () => {
    auth.iniciarSesion('moderador', 'Moder2026!');
    expect(ejecutar(['MODERADOR', 'ADMIN'], '/moderacion')).toBe(true);
  });

  it('manda a acceso denegado si el rol no alcanza', () => {
    auth.iniciarSesion('moderador', 'Moder2026!');
    expect(router.serializeUrl(ejecutar(['ADMIN']) as UrlTree)).toBe('/acceso-denegado');

    auth.cerrarSesion();
    auth.iniciarSesion('camila.diaz', 'Usuario2026!');
    expect(router.serializeUrl(ejecutar(['MODERADOR', 'ADMIN'], '/moderacion') as UrlTree)).toBe('/acceso-denegado');
  });
});
