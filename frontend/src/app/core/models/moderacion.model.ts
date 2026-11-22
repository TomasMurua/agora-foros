export type Gravedad = 'BAJA' | 'MEDIA' | 'ALTA';

export const GRAVEDADES: readonly Gravedad[] = ['BAJA', 'MEDIA', 'ALTA'];

export interface Norma {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  gravedad: Gravedad;
}

export type TipoContenido = 'TEMA' | 'COMENTARIO';

export type EstadoReporte = 'PENDIENTE' | 'RESUELTO' | 'DESCARTADO';

export interface Reporte {
  id: number;
  tipoContenido: TipoContenido;
  contenidoId: number;
  normaId: number;
  motivo: string;
  reportanteId: number;
  reportante: string;
  estado: EstadoReporte;
  fechaCreacion: string;
  fechaResolucion: string | null;
  resueltoPor: string | null;
  resolucion: string | null;
}

/** CERRAR no es una sanción: solo BANEAR y RESTAURAR quedan en el historial. */
export type AccionSancion = 'BANEAR' | 'RESTAURAR';

export interface Sancion {
  id: number;
  tipoContenido: TipoContenido;
  contenidoId: number;
  accion: AccionSancion;
  normaId: number | null;
  motivo: string;
  moderadorId: number;
  moderador: string;
  fecha: string;
}

/** Lo que llena el usuario al reportar un tema o comentario. */
export interface DatosReporte {
  tipoContenido: TipoContenido;
  contenidoId: number;
  normaId: number;
  motivo: string;
}

/** Lo que llena el moderador al banear o restaurar. */
export interface DatosSancion {
  normaId: number | null;
  motivo: string;
}
