import { TestBed } from '@angular/core/testing';
import { AuthFacade } from './auth.facade';
import { ModeracionFacade } from './moderacion.facade';

describe('ModeracionFacade', () => {
  let moderacion: ModeracionFacade;
  let auth: AuthFacade;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    moderacion = TestBed.inject(ModeracionFacade);
    auth = TestBed.inject(AuthFacade);
  });

  it('parte con dos reportes pendientes y tres sanciones', () => {
    expect(moderacion.cantidadPendientes()).toBe(2);
    expect(moderacion.sanciones()).toHaveLength(3);
  });

  it('un USUARIO reporta contenido ajeno, pero no el propio ni dos veces', () => {
    auth.iniciarSesion('matias.soto', 'Usuario2026!');
    const datos = { tipoContenido: 'TEMA' as const, contenidoId: 3, normaId: 3, motivo: 'Debería ir en otra categoría.' };
    expect(moderacion.reportar(datos).ok).toBe(true);
    expect(moderacion.reportar(datos).ok).toBe(false);
    expect(moderacion.reportar({ ...datos, contenidoId: 2 }).ok).toBe(false);
    expect(moderacion.cantidadPendientes()).toBe(3);
  });

  it('un USUARIO no puede banear', () => {
    auth.iniciarSesion('camila.diaz', 'Usuario2026!');
    expect(moderacion.banear('COMENTARIO', 1, { normaId: 1, motivo: 'Prueba de permisos.' }).ok).toBe(false);
  });

  it('sancionar un reporte banea el comentario, lo resuelve y deja la sanción en el historial', () => {
    auth.iniciarSesion('moderador', 'Moder2026!');
    expect(moderacion.sancionarReporte(2, { normaId: 1, motivo: 'Comentario ofensivo confirmado.' }).ok).toBe(true);
    expect(moderacion.comentariosBaneados().map((c) => c.id)).toContain(3);
    expect(moderacion.cantidadPendientes()).toBe(1);
    expect(moderacion.sanciones()[0].sancion.accion).toBe('BANEAR');

    expect(moderacion.restaurar('COMENTARIO', 3, 'Revisado en apelación.').ok).toBe(true);
    expect(moderacion.comentariosBaneados()).toHaveLength(0);
    expect(moderacion.sanciones()).toHaveLength(5);
  });
  it('cada usuario ve sus reportes y retira solo los pendientes', () => {
    auth.iniciarSesion('camila.diaz', 'Usuario2026!');
    expect(moderacion.misReportes().map((r) => r.reporte.id)).toEqual([3, 1]);
    expect(moderacion.retirarReporte(3).ok).toBe(false);
    expect(moderacion.retirarReporte(2).ok).toBe(false);
    expect(moderacion.retirarReporte(1).ok).toBe(true);
    expect(moderacion.misReportes()).toHaveLength(1);
  });

  it('solo el ADMIN corrige o borra sanciones del historial', () => {
    auth.iniciarSesion('moderador', 'Moder2026!');
    expect(moderacion.eliminarSancion(1).ok).toBe(false);
    auth.cerrarSesion();
    auth.iniciarSesion('admin', 'Admin2026!');
    expect(moderacion.corregirSancion(1, 'corto').ok).toBe(false);
    expect(moderacion.corregirSancion(1, 'Lenguaje ofensivo hacia otro usuario del foro.').ok).toBe(true);
    expect(moderacion.eliminarSancion(2).ok).toBe(true);
    expect(moderacion.sanciones()).toHaveLength(2);
  });
});
