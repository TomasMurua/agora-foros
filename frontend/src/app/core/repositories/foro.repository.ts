import { Injectable } from '@angular/core';
import {
  CATEGORIAS_INICIALES,
  COMENTARIOS_INICIALES,
  TEMAS_INICIALES,
} from '../../data/foro.data';
import { Categoria, Comentario, Tema } from '../models/foro.model';
import { RepositorioMemoria } from './repositorio-memoria';

/**
 * Patrón Repository: categorías del foro en memoria. Las fachadas son las
 * únicas que lo usan; los componentes nunca lo inyectan.
 */
@Injectable({ providedIn: 'root' })
export class CategoriaRepository extends RepositorioMemoria<Categoria> {
  constructor() {
    super(CATEGORIAS_INICIALES);
  }

  buscarPorNombre(nombre: string): Categoria | undefined {
    const buscado = nombre.trim().toLowerCase();
    return this.todos().find((c) => c.nombre.toLowerCase() === buscado);
  }
}

/**
 * Patrón Repository: temas del foro en memoria. Guarda el estado (ABIERTO,
 * CERRADO o BANEADO) y el contador de vistas, sin decidir quién puede verlos.
 */
@Injectable({ providedIn: 'root' })
export class TemaRepository extends RepositorioMemoria<Tema> {
  constructor() {
    super(TEMAS_INICIALES);
  }

  porCategoria(categoriaId: number): Tema[] {
    return this.todos().filter((t) => t.categoriaId === categoriaId);
  }

  porUsuario(usuarioId: number): Tema[] {
    return this.todos().filter((t) => t.usuarioId === usuarioId);
  }
}

/**
 * Patrón Repository: comentarios en memoria, con la marca "baneado" que pone
 * la moderación.
 */
@Injectable({ providedIn: 'root' })
export class ComentarioRepository extends RepositorioMemoria<Comentario> {
  constructor() {
    super(COMENTARIOS_INICIALES);
  }

  porTema(temaId: number): Comentario[] {
    return this.todos().filter((c) => c.temaId === temaId);
  }
}
