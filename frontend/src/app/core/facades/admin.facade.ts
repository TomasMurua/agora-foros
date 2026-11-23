import { Injectable, computed, inject } from '@angular/core';
import { Categoria } from '../models/foro.model';
import { Gravedad, Norma } from '../models/moderacion.model';
import { Resultado, exito, fallo } from '../models/resultado.model';
import { Rol, Usuario } from '../models/usuario.model';
import { CategoriaRepository, TemaRepository } from '../repositories/foro.repository';
import {
  NormaRepository,
  ReporteRepository,
  SancionRepository,
} from '../repositories/moderacion.repository';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { AuthFacade } from './auth.facade';
import { plural } from '../utils/plural';

export type UsuarioAdmin = Omit<Usuario, 'password'> & { temas: number };

export interface DatosCategoria {
  nombre: string;
  descripcion: string;
  icono: string;
}

export interface DatosNorma {
  titulo: string;
  descripcion: string;
  gravedad: Gravedad;
}

/** Íconos que el administrador puede elegir para una categoría. */
export const ICONOS_CATEGORIA: readonly { valor: string; nombre: string }[] = [
  { valor: 'cpu', nombre: 'Tecnología' },
  { valor: 'controller', nombre: 'Videojuegos' },
  { valor: 'film', nombre: 'Cine' },
  { valor: 'trophy', nombre: 'Deportes' },
  { valor: 'music-note-beamed', nombre: 'Música' },
  { valor: 'book', nombre: 'Libros' },
  { valor: 'camera', nombre: 'Fotografía' },
  { valor: 'cup-hot', nombre: 'Cocina' },
  { valor: 'globe-americas', nombre: 'Viajes' },
  { valor: 'chat-square-text', nombre: 'General' },
];

/**
 * Patrón Facade: operaciones exclusivas del rol ADMIN (cuentas, categorías y
 * normas). Revisa los permisos y las reglas antes de tocar los repositorios,
 * por ejemplo que un administrador no se bloquee a sí mismo o que no se borre
 * una categoría con temas.
 *
 * Patrón Observer: la lista de usuarios es un computed sobre el repositorio,
 * así la tabla de administración refleja al tiro los cambios de rol, los
 * bloqueos y las cuentas nuevas que se registran.
 */
@Injectable({ providedIn: 'root' })
export class AdminFacade {
  private readonly auth = inject(AuthFacade);
  private readonly usuariosRepo = inject(UsuarioRepository);
  private readonly categoriasRepo = inject(CategoriaRepository);
  private readonly temasRepo = inject(TemaRepository);
  private readonly normasRepo = inject(NormaRepository);
  private readonly reportesRepo = inject(ReporteRepository);
  private readonly sancionesRepo = inject(SancionRepository);

  readonly usuarios = computed<UsuarioAdmin[]>(() => {
    const temas = this.temasRepo.todos();
    return this.usuariosRepo.todos().map(({ password: _password, ...resto }) => ({
      ...resto,
      temas: temas.filter((t) => t.usuarioId === resto.id).length,
    }));
  });

  readonly resumen = computed(() => {
    const usuarios = this.usuariosRepo.todos();
    return {
      total: usuarios.length,
      activos: usuarios.filter((u) => u.activo).length,
      bloqueados: usuarios.filter((u) => !u.activo).length,
      moderadores: usuarios.filter((u) => u.rol !== 'USUARIO').length,
    };
  });

  esUsuarioActual(id: number): boolean {
    return this.auth.usuarioActual()?.id === id;
  }

  // ---- Usuarios ----

  cambiarRol(id: number, rol: Rol): Resultado {
    const control = this.validarSobreOtro(id);
    if (control) {
      return fallo(control);
    }
    const usuario = this.usuariosRepo.actualizar(id, { rol });
    return exito(`${usuario?.nombreUsuario} ahora tiene el rol ${rol}.`);
  }

  alternarBloqueo(id: number): Resultado {
    const control = this.validarSobreOtro(id);
    if (control) {
      return fallo(control);
    }
    const usuario = this.usuariosRepo.buscarPorId(id)!;
    this.usuariosRepo.actualizar(id, { activo: !usuario.activo });
    return exito(
      usuario.activo
        ? `La cuenta de ${usuario.nombreUsuario} quedó bloqueada.`
        : `La cuenta de ${usuario.nombreUsuario} volvió a estar activa.`,
    );
  }

  eliminarUsuario(id: number): Resultado {
    const control = this.validarSobreOtro(id);
    if (control) {
      return fallo(control);
    }
    const usuario = this.usuariosRepo.buscarPorId(id)!;
    this.usuariosRepo.eliminar(id);
    return exito(`La cuenta de ${usuario.nombreUsuario} fue eliminada.`);
  }

  // ---- Categorías ----

  existeCategoria(nombre: string, excluirId: number | null = null): boolean {
    const encontrada = this.categoriasRepo.buscarPorNombre(nombre);
    return encontrada !== undefined && encontrada.id !== excluirId;
  }

  temasDeCategoria(id: number): number {
    return this.temasRepo.porCategoria(id).length;
  }

  crearCategoria(datos: DatosCategoria): Resultado<Categoria> {
    const permiso = this.validarAdmin();
    if (permiso) {
      return fallo(permiso);
    }
    if (this.existeCategoria(datos.nombre)) {
      return fallo('Ya existe una categoría con ese nombre.');
    }
    const categoria = this.categoriasRepo.crear({
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      icono: datos.icono || 'chat-square-text',
      fechaCreacion: new Date().toISOString(),
    });
    return exito(`La categoría "${categoria.nombre}" quedó creada.`, categoria);
  }

  editarCategoria(id: number, datos: DatosCategoria): Resultado<Categoria> {
    const permiso = this.validarAdmin();
    if (permiso) {
      return fallo(permiso);
    }
    if (!this.categoriasRepo.buscarPorId(id)) {
      return fallo('La categoría no existe.');
    }
    if (this.existeCategoria(datos.nombre, id)) {
      return fallo('Ya existe una categoría con ese nombre.');
    }
    const categoria = this.categoriasRepo.actualizar(id, {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      icono: datos.icono || 'chat-square-text',
    });
    return exito('La categoría quedó actualizada.', categoria);
  }

  eliminarCategoria(id: number): Resultado {
    const permiso = this.validarAdmin();
    if (permiso) {
      return fallo(permiso);
    }
    const categoria = this.categoriasRepo.buscarPorId(id);
    if (!categoria) {
      return fallo('La categoría no existe.');
    }
    const temas = this.temasDeCategoria(id);
    if (temas > 0) {
      return fallo(`No se puede eliminar: la categoría tiene ${plural(temas, 'tema', 'temas')}. Muévelos o elimínalos primero.`);
    }
    this.categoriasRepo.eliminar(id);
    return exito(`La categoría "${categoria.nombre}" fue eliminada.`);
  }

  // ---- Normas ----

  existeNorma(titulo: string, excluirId: number | null = null): boolean {
    const encontrada = this.normasRepo.buscarPorTitulo(titulo);
    return encontrada !== undefined && encontrada.id !== excluirId;
  }

  usosDeNorma(id: number): number {
    return (
      this.reportesRepo.todos().filter((r) => r.normaId === id).length +
      this.sancionesRepo.todos().filter((s) => s.normaId === id).length
    );
  }

  crearNorma(datos: DatosNorma): Resultado<Norma> {
    const permiso = this.validarAdmin();
    if (permiso) {
      return fallo(permiso);
    }
    if (this.existeNorma(datos.titulo)) {
      return fallo('Ya existe una norma con ese título.');
    }
    const siguiente = this.normasRepo.todos().reduce((max, n) => Math.max(max, n.id), 0) + 1;
    const norma = this.normasRepo.crear({
      codigo: `N${siguiente}`,
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      gravedad: datos.gravedad,
    });
    return exito(`La norma ${norma.codigo} quedó creada.`, norma);
  }

  editarNorma(id: number, datos: DatosNorma): Resultado<Norma> {
    const permiso = this.validarAdmin();
    if (permiso) {
      return fallo(permiso);
    }
    if (!this.normasRepo.buscarPorId(id)) {
      return fallo('La norma no existe.');
    }
    if (this.existeNorma(datos.titulo, id)) {
      return fallo('Ya existe una norma con ese título.');
    }
    const norma = this.normasRepo.actualizar(id, {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      gravedad: datos.gravedad,
    });
    return exito(`La norma ${norma?.codigo} quedó actualizada.`, norma);
  }

  eliminarNorma(id: number): Resultado {
    const permiso = this.validarAdmin();
    if (permiso) {
      return fallo(permiso);
    }
    const norma = this.normasRepo.buscarPorId(id);
    if (!norma) {
      return fallo('La norma no existe.');
    }
    const usos = this.usosDeNorma(id);
    if (usos > 0) {
      return fallo(`No se puede eliminar: la citan ${usos === 1 ? 'un reporte o sanción' : `${usos} reportes o sanciones`}. Desactívala en su lugar.`);
    }
    this.normasRepo.eliminar(id);
    return exito(`La norma ${norma.codigo} fue eliminada.`);
  }

  /** Devuelve el mensaje de error, o null si la sesión es de un ADMIN. */
  private validarAdmin(): string | null {
    return this.auth.esAdmin() ? null : 'Solo un administrador puede hacer esto.';
  }

  /** Reglas comunes al actuar sobre la cuenta de otra persona. Devuelve el mensaje de error o null. */
  private validarSobreOtro(id: number): string | null {
    const permiso = this.validarAdmin();
    if (permiso) {
      return permiso;
    }
    if (!this.usuariosRepo.buscarPorId(id)) {
      return 'La cuenta no existe.';
    }
    if (this.esUsuarioActual(id)) {
      return 'No puedes cambiar tu propia cuenta desde la administración.';
    }
    return null;
  }
}
