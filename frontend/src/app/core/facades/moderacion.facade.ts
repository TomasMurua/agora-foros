import { Injectable, computed, inject } from '@angular/core';
import {
  DatosReporte,
  DatosSancion,
  Norma,
  Reporte,
  Sancion,
  TipoContenido,
} from '../models/moderacion.model';
import { Comentario, Tema } from '../models/foro.model';
import { Resultado, exito, fallo } from '../models/resultado.model';
import { ComentarioRepository, TemaRepository } from '../repositories/foro.repository';
import {
  NormaRepository,
  ReporteRepository,
  SancionRepository,
} from '../repositories/moderacion.repository';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { AuthFacade } from './auth.facade';
import { LIMITES } from '../validators/agora.validators';

/** Reporte con el contenido y la norma ya resueltos, listo para la vista. */
export interface ReporteDetallado {
  reporte: Reporte;
  norma: Norma | undefined;
  tema: Tema | undefined;
  comentario: Comentario | undefined;
  /** Texto corto del contenido reportado. */
  extracto: string;
  /** Id del tema donde está el contenido, para enlazarlo. */
  temaId: number | null;
}

/** Sanción con la norma y el contenido resueltos, para el historial. */
export interface SancionDetallada {
  sancion: Sancion;
  norma: Norma | undefined;
  extracto: string;
  temaId: number | null;
}

/**
 * Patrón Facade: todo lo que hace el equipo de moderación pasa por aquí
 * (reportes, baneos, restauraciones y el historial de sanciones). Por dentro
 * coordina cinco repositorios; los componentes solo ven métodos con nombres
 * del negocio, como reportar() o banear().
 *
 * Patrón Observer: reportesPendientes, contenidoBaneado y sanciones son
 * computed que observan los repositorios. El contador de reportes de la barra
 * de navegación y el panel de moderación se actualizan solos cuando un
 * usuario reporta o un moderador resuelve.
 */
@Injectable({ providedIn: 'root' })
export class ModeracionFacade {
  private readonly auth = inject(AuthFacade);
  private readonly normasRepo = inject(NormaRepository);
  private readonly reportesRepo = inject(ReporteRepository);
  private readonly sancionesRepo = inject(SancionRepository);
  private readonly temasRepo = inject(TemaRepository);
  private readonly comentariosRepo = inject(ComentarioRepository);
  private readonly usuariosRepo = inject(UsuarioRepository);

  readonly normas = computed(() => [...this.normasRepo.todos()].sort((a, b) => a.id - b.id));

  readonly reportesPendientes = computed(() =>
    this.reportesRepo
      .todos()
      .filter((r) => r.estado === 'PENDIENTE')
      .sort((a, b) => a.fechaCreacion.localeCompare(b.fechaCreacion))
      .map((r) => this.detallar(r)),
  );

  readonly reportesCerrados = computed(() =>
    this.reportesRepo
      .todos()
      .filter((r) => r.estado !== 'PENDIENTE')
      .sort((a, b) => (b.fechaResolucion ?? '').localeCompare(a.fechaResolucion ?? ''))
      .map((r) => this.detallar(r)),
  );

  readonly cantidadPendientes = computed(() => this.reportesPendientes().length);

  /** Reportes que envió la persona con sesión, los más recientes primero. */
  readonly misReportes = computed(() => {
    const usuario = this.auth.usuarioActual();
    if (!usuario) {
      return [];
    }
    return this.reportesRepo
      .todos()
      .filter((r) => r.reportanteId === usuario.id)
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
      .map((r) => this.detallar(r));
  });

  readonly temasBaneados = computed(() =>
    this.temasRepo.todos().filter((t) => t.estado === 'BANEADO'),
  );

  readonly comentariosBaneados = computed(() =>
    this.comentariosRepo.todos().filter((c) => c.baneado),
  );

  /** Todos los temas, para la tabla de contenido del panel. */
  readonly todosLosTemas = computed(() =>
    [...this.temasRepo.todos()].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)),
  );

  readonly sanciones = computed<SancionDetallada[]>(() =>
    [...this.sancionesRepo.todos()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((s) => {
        const { extracto, temaId } = this.describirContenido(s.tipoContenido, s.contenidoId);
        return {
          sancion: s,
          norma: s.normaId ? this.normasRepo.buscarPorId(s.normaId) : undefined,
          extracto,
          temaId,
        };
      }),
  );

  /** Lista de usuarios de solo lectura para el moderador (sin contraseñas). */
  readonly usuarios = computed(() =>
    this.usuariosRepo.todos().map(({ password: _password, ...resto }) => resto),
  );

  normaPorId(id: number | null): Norma | undefined {
    return id ? this.normasRepo.buscarPorId(id) : undefined;
  }

  /** true si el usuario actual ya tiene un reporte pendiente sobre ese contenido. */
  yaReportado(tipo: TipoContenido, contenidoId: number): boolean {
    const usuario = this.auth.usuarioActual();
    return (
      !!usuario &&
      this.reportesRepo
        .deContenido(tipo, contenidoId)
        .some((r) => r.reportanteId === usuario.id && r.estado === 'PENDIENTE')
    );
  }

  reportar(datos: DatosReporte): Resultado<Reporte> {
    const usuario = this.auth.usuarioActual();
    if (!usuario) {
      return fallo('Debes iniciar sesión para reportar.');
    }
    if (!this.normasRepo.buscarPorId(Number(datos.normaId))) {
      return fallo('Elige la norma que se infringe.');
    }
    const contenido =
      datos.tipoContenido === 'TEMA'
        ? this.temasRepo.buscarPorId(datos.contenidoId)
        : this.comentariosRepo.buscarPorId(datos.contenidoId);
    if (!contenido) {
      return fallo('El contenido que quieres reportar ya no existe.');
    }
    if (contenido.usuarioId === usuario.id) {
      return fallo('No puedes reportar tu propio contenido.');
    }
    if (this.yaReportado(datos.tipoContenido, datos.contenidoId)) {
      return fallo('Ya reportaste este contenido. El equipo de moderación lo está revisando.');
    }
    const reporte = this.reportesRepo.crear({
      tipoContenido: datos.tipoContenido,
      contenidoId: datos.contenidoId,
      normaId: Number(datos.normaId),
      motivo: datos.motivo.trim(),
      reportanteId: usuario.id,
      reportante: usuario.nombreUsuario,
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString(),
      fechaResolucion: null,
      resueltoPor: null,
      resolucion: null,
    });
    return exito('Gracias. Tu reporte llegó al equipo de moderación.', reporte);
  }

  /** El autor retira su reporte mientras nadie lo revisa. */
  retirarReporte(reporteId: number): Resultado {
    const usuario = this.auth.usuarioActual();
    const reporte = this.reportesRepo.buscarPorId(reporteId);
    if (!usuario || !reporte || reporte.reportanteId !== usuario.id) {
      return fallo('Ese reporte no es tuyo.');
    }
    if (reporte.estado !== 'PENDIENTE') {
      return fallo('Solo puedes retirar un reporte mientras está pendiente.');
    }
    this.reportesRepo.eliminar(reporteId);
    return exito('Retiraste el reporte.');
  }

  /** Solo ADMIN: corrige el motivo de una sanción. La acción ya hecha no cambia. */
  corregirSancion(sancionId: number, motivo: string): Resultado {
    if (!this.auth.esAdmin()) {
      return fallo('Solo un administrador puede corregir sanciones.');
    }
    const texto = motivo.trim();
    if (texto.length < LIMITES.motivo.min || texto.length > LIMITES.motivo.max) {
      return fallo(`El motivo debe tener entre ${LIMITES.motivo.min} y ${LIMITES.motivo.max} caracteres.`);
    }
    if (!this.sancionesRepo.actualizar(sancionId, { motivo: texto })) {
      return fallo('La sanción no existe.');
    }
    return exito('Corregiste el motivo de la sanción.');
  }

  /** Solo ADMIN: borra un registro del historial. No deshace el baneo ni la restauración. */
  eliminarSancion(sancionId: number): Resultado {
    if (!this.auth.esAdmin()) {
      return fallo('Solo un administrador puede borrar sanciones del historial.');
    }
    if (!this.sancionesRepo.eliminar(sancionId)) {
      return fallo('La sanción no existe.');
    }
    return exito('La sanción salió del historial. El contenido queda como estaba.');
  }

  /** Banea el contenido reportado y marca como resueltos todos sus reportes pendientes. */
  sancionarReporte(reporteId: number, datos: DatosSancion): Resultado {
    const reporte = this.reportesRepo.buscarPorId(reporteId);
    if (!reporte || reporte.estado !== 'PENDIENTE') {
      return fallo('El reporte ya fue atendido.');
    }
    const resultado = this.banear(reporte.tipoContenido, reporte.contenidoId, datos);
    if (!resultado.ok) {
      return resultado;
    }
    return exito('Reporte resuelto: el contenido quedó baneado.');
  }

  descartarReporte(reporteId: number, resolucion: string): Resultado {
    const moderador = this.auth.usuarioActual();
    const reporte = this.reportesRepo.buscarPorId(reporteId);
    if (!moderador || !this.auth.esModerador()) {
      return fallo('Solo el equipo de moderación puede atender reportes.');
    }
    if (!reporte || reporte.estado !== 'PENDIENTE') {
      return fallo('El reporte ya fue atendido.');
    }
    this.reportesRepo.actualizar(reporteId, {
      estado: 'DESCARTADO',
      fechaResolucion: new Date().toISOString(),
      resueltoPor: moderador.nombreUsuario,
      resolucion: resolucion.trim() || 'El contenido no infringe las normas.',
    });
    return exito('Reporte descartado. El contenido sigue publicado.');
  }

  banear(tipo: TipoContenido, contenidoId: number, datos: DatosSancion): Resultado {
    const moderador = this.auth.usuarioActual();
    if (!moderador || !this.auth.esModerador()) {
      return fallo('Solo el equipo de moderación puede banear contenido.');
    }
    if (!datos.normaId || !this.normasRepo.buscarPorId(Number(datos.normaId))) {
      return fallo('Elige la norma que se infringe.');
    }
    if (tipo === 'TEMA') {
      const tema = this.temasRepo.buscarPorId(contenidoId);
      if (!tema) {
        return fallo('El tema no existe.');
      }
      if (tema.estado === 'BANEADO') {
        return fallo('El tema ya está baneado.');
      }
      this.temasRepo.actualizar(contenidoId, { estado: 'BANEADO' });
    } else {
      const comentario = this.comentariosRepo.buscarPorId(contenidoId);
      if (!comentario) {
        return fallo('El comentario no existe.');
      }
      if (comentario.baneado) {
        return fallo('El comentario ya está baneado.');
      }
      this.comentariosRepo.actualizar(contenidoId, { baneado: true });
    }
    this.registrarSancion(tipo, contenidoId, 'BANEAR', Number(datos.normaId), datos.motivo);
    this.cerrarReportes(tipo, contenidoId, `Contenido baneado: ${datos.motivo.trim()}`);
    return exito(tipo === 'TEMA' ? 'El tema quedó baneado.' : 'El comentario quedó baneado.');
  }

  restaurar(tipo: TipoContenido, contenidoId: number, motivo: string): Resultado {
    const moderador = this.auth.usuarioActual();
    if (!moderador || !this.auth.esModerador()) {
      return fallo('Solo el equipo de moderación puede restaurar contenido.');
    }
    if (tipo === 'TEMA') {
      const tema = this.temasRepo.buscarPorId(contenidoId);
      if (!tema || tema.estado !== 'BANEADO') {
        return fallo('El tema no está baneado.');
      }
      this.temasRepo.actualizar(contenidoId, { estado: 'ABIERTO' });
    } else {
      const comentario = this.comentariosRepo.buscarPorId(contenidoId);
      if (!comentario || !comentario.baneado) {
        return fallo('El comentario no está baneado.');
      }
      this.comentariosRepo.actualizar(contenidoId, { baneado: false });
    }
    this.registrarSancion(tipo, contenidoId, 'RESTAURAR', null, motivo);
    return exito(tipo === 'TEMA' ? 'El tema volvió a estar visible.' : 'El comentario volvió a estar visible.');
  }

  describirContenido(tipo: TipoContenido, id: number): { extracto: string; temaId: number | null } {
    if (tipo === 'TEMA') {
      const tema = this.temasRepo.buscarPorId(id);
      return { extracto: tema ? tema.titulo : 'Tema eliminado', temaId: tema ? tema.id : null };
    }
    const comentario = this.comentariosRepo.buscarPorId(id);
    if (!comentario) {
      return { extracto: 'Comentario eliminado', temaId: null };
    }
    const texto = comentario.contenido;
    return {
      extracto: texto.length > 90 ? `${texto.slice(0, 90)}...` : texto,
      temaId: comentario.temaId,
    };
  }

  private registrarSancion(
    tipo: TipoContenido,
    contenidoId: number,
    accion: Sancion['accion'],
    normaId: number | null,
    motivo: string,
  ): void {
    const moderador = this.auth.usuarioActual()!;
    this.sancionesRepo.crear({
      tipoContenido: tipo,
      contenidoId,
      accion,
      normaId,
      motivo: motivo.trim(),
      moderadorId: moderador.id,
      moderador: moderador.nombreUsuario,
      fecha: new Date().toISOString(),
    });
  }

  private cerrarReportes(tipo: TipoContenido, contenidoId: number, resolucion: string): void {
    const moderador = this.auth.usuarioActual()!;
    for (const r of this.reportesRepo.deContenido(tipo, contenidoId)) {
      if (r.estado === 'PENDIENTE') {
        this.reportesRepo.actualizar(r.id, {
          estado: 'RESUELTO',
          fechaResolucion: new Date().toISOString(),
          resueltoPor: moderador.nombreUsuario,
          resolucion,
        });
      }
    }
  }

  private detallar(reporte: Reporte): ReporteDetallado {
    const tema =
      reporte.tipoContenido === 'TEMA' ? this.temasRepo.buscarPorId(reporte.contenidoId) : undefined;
    const comentario =
      reporte.tipoContenido === 'COMENTARIO'
        ? this.comentariosRepo.buscarPorId(reporte.contenidoId)
        : undefined;
    const { extracto, temaId } = this.describirContenido(reporte.tipoContenido, reporte.contenidoId);
    return {
      reporte,
      norma: this.normasRepo.buscarPorId(reporte.normaId),
      tema,
      comentario,
      extracto,
      temaId,
    };
  }
}
