export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  /** Nombre de un ícono de Bootstrap Icons, sin el prefijo "bi-". */
  icono: string;
  fechaCreacion: string;
}

export type EstadoTema = 'ABIERTO' | 'CERRADO' | 'BANEADO';

export const ETIQUETA_ESTADO_TEMA: Record<EstadoTema, string> = {
  ABIERTO: 'Abierto',
  CERRADO: 'Cerrado',
  BANEADO: 'Baneado',
};

export interface Tema {
  id: number;
  categoriaId: number;
  usuarioId: number;
  autor: string;
  titulo: string;
  contenido: string;
  estado: EstadoTema;
  vistas: number;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface Comentario {
  id: number;
  temaId: number;
  usuarioId: number;
  autor: string;
  contenido: string;
  baneado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

/** Datos de un tema que escribe el usuario al publicar o editar. */
export interface DatosTema {
  titulo: string;
  categoriaId: number;
  contenido: string;
}

export type OrdenTemas = 'recientes' | 'populares' | 'comentados';

/** Filtros de la pantalla "Explorar temas". */
export interface FiltrosTemas {
  texto: string;
  categoriaId: number | null;
  autor: string;
  estado: EstadoTema | '';
  orden: OrdenTemas;
}

/** Tema con los datos que necesita una tarjeta de la lista. */
export interface ResumenTema {
  tema: Tema;
  categoria: Categoria | undefined;
  comentarios: number;
}
