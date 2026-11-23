import { Injectable } from '@angular/core';
import {
  NORMAS_INICIALES,
  REPORTES_INICIALES,
  SANCIONES_INICIALES,
} from '../../data/moderacion.data';
import { Norma, Reporte, Sancion, TipoContenido } from '../models/moderacion.model';
import { RepositorioMemoria } from './repositorio-memoria';

/** Patrón Repository: normas del foro en memoria. */
@Injectable({ providedIn: 'root' })
export class NormaRepository extends RepositorioMemoria<Norma> {
  constructor() {
    super(NORMAS_INICIALES);
  }

  buscarPorTitulo(titulo: string): Norma | undefined {
    const buscado = titulo.trim().toLowerCase();
    return this.todos().find((n) => n.titulo.toLowerCase() === buscado);
  }
}

/** Patrón Repository: reportes (denuncias) de temas y comentarios en memoria. */
@Injectable({ providedIn: 'root' })
export class ReporteRepository extends RepositorioMemoria<Reporte> {
  constructor() {
    super(REPORTES_INICIALES);
  }

  deContenido(tipo: TipoContenido, contenidoId: number): Reporte[] {
    return this.todos().filter((r) => r.tipoContenido === tipo && r.contenidoId === contenidoId);
  }
}

/** Patrón Repository: historial de sanciones (BANEAR y RESTAURAR) en memoria. */
@Injectable({ providedIn: 'root' })
export class SancionRepository extends RepositorioMemoria<Sancion> {
  constructor() {
    super(SANCIONES_INICIALES);
  }
}
