import { Injectable, computed, inject } from '@angular/core';
import {
  Categoria,
  Comentario,
  DatosTema,
  FiltrosTemas,
  ResumenTema,
  Tema,
} from '../models/foro.model';
import { Resultado, exito, fallo } from '../models/resultado.model';
import { CategoriaRepository, ComentarioRepository, TemaRepository } from '../repositories/foro.repository';
import { ReporteRepository } from '../repositories/moderacion.repository';
import { AuthFacade } from './auth.facade';

/** Quita tildes y pasa a minúsculas para comparar textos en la búsqueda. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Patrón Facade: reúne categorías, temas y comentarios en una sola API para
 * los componentes. Aquí viven las reglas del foro: quién ve un tema baneado,
 * quién puede editar, cerrar o eliminar, y que no se comente un tema cerrado.
 *
 * Patrón Observer: las listas que expone (categorias, temasVisibles,
 * temasPopulares, estadisticas) son computed que observan los repositorios y
 * la sesión. Cuando alguien publica, comenta o un moderador banea, cada
 * pantalla que las lee se actualiza sin pedir los datos de nuevo.
 */
@Injectable({ providedIn: 'root' })
export class ForoFacade {
  private readonly auth = inject(AuthFacade);
  private readonly categoriasRepo = inject(CategoriaRepository);
  private readonly temasRepo = inject(TemaRepository);
  private readonly comentariosRepo = inject(ComentarioRepository);
  private readonly reportesRepo = inject(ReporteRepository);

  readonly categorias = computed(() =>
    [...this.categoriasRepo.todos()].sort((a, b) => a.id - b.id),
  );

  /** Temas que el usuario actual puede ver: los baneados solo los ven MODERADOR y ADMIN. */
  readonly temasVisibles = computed(() => {
    const modera = this.auth.esModerador();
    return this.temasRepo.todos().filter((t) => modera || t.estado !== 'BANEADO');
  });

  readonly temasPopulares = computed(() =>
    this.resumir(
      this.temasVisibles()
        .filter((t) => t.estado !== 'BANEADO')
        .sort((a, b) => b.vistas - a.vistas)
        .slice(0, 4),
    ),
  );

  readonly temasRecientes = computed(() =>
    this.resumir(
      [...this.temasVisibles()]
        .filter((t) => t.estado !== 'BANEADO')
        .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
        .slice(0, 5),
    ),
  );

  readonly estadisticas = computed(() => ({
    temas: this.temasRepo.todos().filter((t) => t.estado !== 'BANEADO').length,
    comentarios: this.comentariosRepo.todos().filter((c) => !c.baneado).length,
    categorias: this.categoriasRepo.todos().length,
  }));

  /** Autores con temas visibles, para el filtro de la búsqueda. */
  readonly autores = computed(() =>
    [...new Set(this.temasVisibles().map((t) => t.autor))].sort((a, b) => a.localeCompare(b)),
  );

  readonly misTemas = computed(() => {
    const usuario = this.auth.usuarioActual();
    if (!usuario) {
      return [];
    }
    return this.resumir(
      this.temasRepo
        .porUsuario(usuario.id)
        .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)),
    );
  });

  categoriaPorId(id: number): Categoria | undefined {
    return this.categoriasRepo.buscarPorId(id);
  }

  /** Cantidad de temas visibles por categoría. */
  temasEnCategoria(categoriaId: number): number {
    return this.temasVisibles().filter((t) => t.categoriaId === categoriaId && t.estado !== 'BANEADO')
      .length;
  }

  /** Devuelve el tema aunque esté baneado; la pantalla decide qué mostrar con puedeVerTema(). */
  temaPorId(id: number): Tema | undefined {
    return this.temasRepo.buscarPorId(id);
  }

  puedeVerTema(tema: Tema): boolean {
    return tema.estado !== 'BANEADO' || this.auth.esModerador();
  }

  resumenDe(tema: Tema): ResumenTema {
    return {
      tema,
      categoria: this.categoriasRepo.buscarPorId(tema.categoriaId),
      comentarios: this.comentariosRepo.porTema(tema.id).filter((c) => !c.baneado).length,
    };
  }

  buscarTemas(filtros: FiltrosTemas): ResumenTema[] {
    const texto = normalizar(filtros.texto ?? '');
    const autor = normalizar(filtros.autor ?? '');
    const lista = this.temasVisibles().filter((t) => {
      if (filtros.categoriaId && t.categoriaId !== Number(filtros.categoriaId)) {
        return false;
      }
      if (filtros.estado && t.estado !== filtros.estado) {
        return false;
      }
      if (autor && !normalizar(t.autor).includes(autor)) {
        return false;
      }
      if (texto) {
        return normalizar(`${t.titulo} ${t.contenido}`).includes(texto);
      }
      return true;
    });
    const resumenes = this.resumir(lista);
    switch (filtros.orden) {
      case 'populares':
        return resumenes.sort((a, b) => b.tema.vistas - a.tema.vistas);
      case 'comentados':
        return resumenes.sort((a, b) => b.comentarios - a.comentarios);
      default:
        return resumenes.sort((a, b) => b.tema.fechaCreacion.localeCompare(a.tema.fechaCreacion));
    }
  }

  temasDeCategoria(categoriaId: number): ResumenTema[] {
    return this.resumir(
      this.temasVisibles()
        .filter((t) => t.categoriaId === categoriaId)
        .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)),
    );
  }

  /** Comentarios en orden de publicación. Los baneados se incluyen; la vista muestra un aviso en su lugar. */
  comentariosDeTema(temaId: number): Comentario[] {
    return this.comentariosRepo
      .porTema(temaId)
      .sort((a, b) => a.fechaCreacion.localeCompare(b.fechaCreacion));
  }

  registrarVista(temaId: number): void {
    const tema = this.temasRepo.buscarPorId(temaId);
    if (tema && this.puedeVerTema(tema)) {
      this.temasRepo.actualizar(temaId, { vistas: tema.vistas + 1 });
    }
  }

  // ---- Permisos ----

  esAutor(tema: { usuarioId: number }): boolean {
    return this.auth.usuarioActual()?.id === tema.usuarioId;
  }

  puedeEditarTema(tema: Tema): boolean {
    return this.esAutor(tema) && tema.estado !== 'BANEADO';
  }

  puedeCambiarEstado(tema: Tema): boolean {
    return tema.estado !== 'BANEADO' && (this.esAutor(tema) || this.auth.esModerador());
  }

  puedeEliminarTema(tema: Tema): boolean {
    return this.esAutor(tema) || this.auth.esModerador();
  }

  puedeComentar(tema: Tema): boolean {
    return this.auth.estaAutenticado() && tema.estado === 'ABIERTO';
  }

  puedeEditarComentario(comentario: Comentario): boolean {
    return this.esAutor(comentario) && !comentario.baneado;
  }

  puedeEliminarComentario(comentario: Comentario): boolean {
    return this.esAutor(comentario) || this.auth.esModerador();
  }

  // ---- Operaciones ----

  publicarTema(datos: DatosTema): Resultado<Tema> {
    const usuario = this.auth.usuarioActual();
    if (!usuario) {
      return fallo('Debes iniciar sesión para publicar.');
    }
    if (!this.categoriasRepo.buscarPorId(Number(datos.categoriaId))) {
      return fallo('La categoría elegida no existe.');
    }
    const tema = this.temasRepo.crear({
      categoriaId: Number(datos.categoriaId),
      usuarioId: usuario.id,
      autor: usuario.nombreUsuario,
      titulo: datos.titulo.trim(),
      contenido: datos.contenido.trim(),
      estado: 'ABIERTO',
      vistas: 0,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: null,
    });
    return exito('Tu tema quedó publicado.', tema);
  }

  editarTema(id: number, datos: DatosTema): Resultado<Tema> {
    const tema = this.temasRepo.buscarPorId(id);
    if (!tema) {
      return fallo('El tema no existe.');
    }
    if (!this.puedeEditarTema(tema)) {
      return fallo('Solo el autor puede editar este tema.');
    }
    if (!this.categoriasRepo.buscarPorId(Number(datos.categoriaId))) {
      return fallo('La categoría elegida no existe.');
    }
    const actualizado = this.temasRepo.actualizar(id, {
      titulo: datos.titulo.trim(),
      categoriaId: Number(datos.categoriaId),
      contenido: datos.contenido.trim(),
      fechaActualizacion: new Date().toISOString(),
    });
    return exito('Los cambios del tema quedaron guardados.', actualizado);
  }

  /** Cierra un tema abierto o reabre uno cerrado. */
  alternarEstadoTema(id: number): Resultado<Tema> {
    const tema = this.temasRepo.buscarPorId(id);
    if (!tema) {
      return fallo('El tema no existe.');
    }
    if (!this.puedeCambiarEstado(tema)) {
      return fallo('No tienes permiso para cambiar el estado de este tema.');
    }
    const estado = tema.estado === 'ABIERTO' ? 'CERRADO' : 'ABIERTO';
    const actualizado = this.temasRepo.actualizar(id, { estado });
    return exito(
      estado === 'CERRADO' ? 'El tema quedó cerrado. Ya no recibe comentarios.' : 'El tema volvió a abrirse.',
      actualizado,
    );
  }

  eliminarTema(id: number): Resultado {
    const tema = this.temasRepo.buscarPorId(id);
    if (!tema) {
      return fallo('El tema no existe.');
    }
    if (!this.puedeEliminarTema(tema)) {
      return fallo('No tienes permiso para eliminar este tema.');
    }
    const idsComentarios = this.comentariosRepo.porTema(id).map((c) => c.id);
    this.comentariosRepo.eliminarDonde((c) => c.temaId === id);
    this.reportesRepo.eliminarDonde(
      (r) =>
        r.estado === 'PENDIENTE' &&
        ((r.tipoContenido === 'TEMA' && r.contenidoId === id) ||
          (r.tipoContenido === 'COMENTARIO' && idsComentarios.includes(r.contenidoId))),
    );
    this.temasRepo.eliminar(id);
    return exito('El tema y sus comentarios fueron eliminados.');
  }

  comentar(temaId: number, contenido: string): Resultado<Comentario> {
    const usuario = this.auth.usuarioActual();
    const tema = this.temasRepo.buscarPorId(temaId);
    if (!usuario) {
      return fallo('Debes iniciar sesión para comentar.');
    }
    if (!tema || !this.puedeVerTema(tema)) {
      return fallo('El tema no existe.');
    }
    if (tema.estado !== 'ABIERTO') {
      return fallo('El tema está cerrado y no recibe comentarios.');
    }
    const comentario = this.comentariosRepo.crear({
      temaId,
      usuarioId: usuario.id,
      autor: usuario.nombreUsuario,
      contenido: contenido.trim(),
      baneado: false,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: null,
    });
    return exito('Tu comentario quedó publicado.', comentario);
  }

  editarComentario(id: number, contenido: string): Resultado<Comentario> {
    const comentario = this.comentariosRepo.buscarPorId(id);
    if (!comentario) {
      return fallo('El comentario no existe.');
    }
    if (!this.puedeEditarComentario(comentario)) {
      return fallo('Solo el autor puede editar este comentario.');
    }
    const actualizado = this.comentariosRepo.actualizar(id, {
      contenido: contenido.trim(),
      fechaActualizacion: new Date().toISOString(),
    });
    return exito('El comentario quedó actualizado.', actualizado);
  }

  eliminarComentario(id: number): Resultado {
    const comentario = this.comentariosRepo.buscarPorId(id);
    if (!comentario) {
      return fallo('El comentario no existe.');
    }
    if (!this.puedeEliminarComentario(comentario)) {
      return fallo('No tienes permiso para eliminar este comentario.');
    }
    this.comentariosRepo.eliminar(id);
    this.reportesRepo.eliminarDonde(
      (r) => r.estado === 'PENDIENTE' && r.tipoContenido === 'COMENTARIO' && r.contenidoId === id,
    );
    return exito('El comentario fue eliminado.');
  }

  private resumir(temas: Tema[]): ResumenTema[] {
    return temas.map((t) => this.resumenDe(t));
  }
}
