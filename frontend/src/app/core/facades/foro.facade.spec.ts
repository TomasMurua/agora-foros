import { TestBed } from '@angular/core/testing';
import { AuthFacade } from './auth.facade';
import { ForoFacade } from './foro.facade';
import { ModeracionFacade } from './moderacion.facade';

describe('ForoFacade', () => {
  let foro: ForoFacade;
  let auth: AuthFacade;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    foro = TestBed.inject(ForoFacade);
    auth = TestBed.inject(AuthFacade);
  });

  it('no deja publicar sin sesión', () => {
    const resultado = foro.publicarTema({ titulo: 'Un tema cualquiera', categoriaId: 1, contenido: 'x'.repeat(30) });
    expect(resultado.ok).toBe(false);
  });

  it('publica un tema abierto a nombre de quien tiene la sesión', () => {
    auth.iniciarSesion('camila.diaz', 'Usuario2026!');
    const antes = foro.temasVisibles().length;
    const resultado = foro.publicarTema({
      titulo: '¿Qué base de datos usan con Spring?',
      categoriaId: 1,
      contenido: 'Estoy comparando Oracle y PostgreSQL para un proyecto nuevo.',
    });
    expect(resultado.ok).toBe(true);
    expect(resultado.dato?.estado).toBe('ABIERTO');
    expect(resultado.dato?.autor).toBe('camila.diaz');
    expect(foro.temasVisibles().length).toBe(antes + 1);
    expect(foro.misTemas()[0].tema.id).toBe(resultado.dato?.id);
  });

  it('rechaza comentarios en un tema cerrado', () => {
    auth.iniciarSesion('camila.diaz', 'Usuario2026!');
    expect(foro.alternarEstadoTema(1).ok).toBe(true);
    expect(foro.temaPorId(1)?.estado).toBe('CERRADO');

    auth.cerrarSesion();
    auth.iniciarSesion('matias.soto', 'Usuario2026!');
    const resultado = foro.comentar(1, 'Quería sumar algo más a la conversación.');
    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toContain('cerrado');
  });

  it('permite comentar en un tema abierto', () => {
    auth.iniciarSesion('matias.soto', 'Usuario2026!');
    const antes = foro.comentariosDeTema(3).length;
    expect(foro.comentar(3, 'Recomiendo una serie de ciencia ficción.').ok).toBe(true);
    expect(foro.comentariosDeTema(3).length).toBe(antes + 1);
  });

  it('un USUARIO no puede editar ni cerrar el tema de otra persona', () => {
    auth.iniciarSesion('matias.soto', 'Usuario2026!');
    expect(foro.editarTema(1, { titulo: 'Cambio ajeno', categoriaId: 1, contenido: 'x'.repeat(30) }).ok).toBe(false);
    expect(foro.alternarEstadoTema(1).ok).toBe(false);
  });

  it('un tema baneado se oculta al USUARIO y lo sigue viendo el MODERADOR', () => {
    auth.iniciarSesion('moderador', 'Moder2026!');
    const moderacion = TestBed.inject(ModeracionFacade);
    expect(moderacion.banear('TEMA', 2, { normaId: 2, motivo: 'Publicidad de un servidor pagado.' }).ok).toBe(true);
    expect(foro.temasVisibles().some((t) => t.id === 2)).toBe(true);
    expect(foro.puedeVerTema(foro.temaPorId(2)!)).toBe(true);

    auth.cerrarSesion();
    auth.iniciarSesion('camila.diaz', 'Usuario2026!');
    expect(foro.temasVisibles().some((t) => t.id === 2)).toBe(false);
    expect(foro.buscarTemas({ texto: 'cooperativo', categoriaId: null, autor: '', estado: '', orden: 'recientes' })).toHaveLength(0);
    expect(foro.puedeVerTema(foro.temaPorId(2)!)).toBe(false);
  });

  it('el tema 7 de los datos iniciales llega baneado y oculto para visitantes', () => {
    expect(foro.temaPorId(7)?.estado).toBe('BANEADO');
    expect(foro.temasVisibles().some((t) => t.id === 7)).toBe(false);
  });

  it('registra una vista al abrir un tema', () => {
    const antes = foro.temaPorId(1)!.vistas;
    foro.registrarVista(1);
    expect(foro.temaPorId(1)!.vistas).toBe(antes + 1);
  });
});
