import { Norma, Reporte, Sancion } from '../core/models/moderacion.model';

/** Normas del foro, las mismas que carga ms-moderacion. */
export const NORMAS_INICIALES: readonly Norma[] = [
  {
    id: 1,
    codigo: 'N1',
    titulo: 'Respeto entre usuarios',
    descripcion: 'Sin insultos, acoso, amenazas ni discriminación de ningún tipo.',
    gravedad: 'ALTA',
  },
  {
    id: 2,
    codigo: 'N2',
    titulo: 'Sin spam ni publicidad',
    descripcion: 'No se permiten ventas, publicidad, enlaces de referidos ni mensajes repetidos.',
    gravedad: 'MEDIA',
  },
  {
    id: 3,
    codigo: 'N3',
    titulo: 'Publicar en la categoría correcta',
    descripcion: 'Cada tema va en la categoría que corresponde a su contenido.',
    gravedad: 'BAJA',
  },
  {
    id: 4,
    codigo: 'N4',
    titulo: 'Proteger datos personales',
    descripcion: 'No publicar teléfonos, direcciones, RUT, claves ni datos de otras personas.',
    gravedad: 'ALTA',
  },
  {
    id: 5,
    codigo: 'N5',
    titulo: 'Contenido legal',
    descripcion: 'Sin piratería, cuentas robadas, trampas para juegos ni contenido ilegal.',
    gravedad: 'ALTA',
  },
];

/** Reportes (denuncias) iniciales: dos pendientes y uno resuelto. */
export const REPORTES_INICIALES: readonly Reporte[] = [
  {
    id: 1,
    tipoContenido: 'TEMA',
    contenidoId: 2,
    normaId: 2,
    motivo: 'Parece publicidad de un servidor pagado.',
    reportanteId: 3,
    reportante: 'camila.diaz',
    estado: 'PENDIENTE',
    fechaCreacion: '2026-10-27T10:00:00',
    fechaResolucion: null,
    resueltoPor: null,
    resolucion: null,
  },
  {
    id: 2,
    tipoContenido: 'COMENTARIO',
    contenidoId: 3,
    normaId: 1,
    motivo: 'Comentario ofensivo hacia otros jugadores.',
    reportanteId: 5,
    reportante: 'fernanda.lagos',
    estado: 'PENDIENTE',
    fechaCreacion: '2026-10-27T11:30:00',
    fechaResolucion: null,
    resueltoPor: null,
    resolucion: null,
  },
  {
    id: 3,
    tipoContenido: 'TEMA',
    contenidoId: 5,
    normaId: 3,
    motivo: 'Creo que este tema iba en otra categoría.',
    reportanteId: 3,
    reportante: 'camila.diaz',
    estado: 'RESUELTO',
    fechaCreacion: '2026-10-29T17:00:00',
    fechaResolucion: '2026-10-29T19:30:00',
    resueltoPor: 'moderador',
    resolucion: 'Revisado: el tema corresponde a Música. Se le explicó a la usuaria.',
  },
];

/** Historial de sanciones. CERRAR un tema no es una sanción y no aparece aquí. */
export const SANCIONES_INICIALES: readonly Sancion[] = [
  {
    id: 1,
    tipoContenido: 'COMENTARIO',
    contenidoId: 4,
    accion: 'BANEAR',
    normaId: 1,
    motivo: 'Lenguaje ofensivo hacia otro usuario.',
    moderadorId: 2,
    moderador: 'moderador',
    fecha: '2026-10-28T10:00:00',
  },
  {
    id: 2,
    tipoContenido: 'COMENTARIO',
    contenidoId: 4,
    accion: 'RESTAURAR',
    normaId: null,
    motivo: 'Revisado en apelación: el comentario no infringe las normas.',
    moderadorId: 1,
    moderador: 'admin',
    fecha: '2026-10-28T15:00:00',
  },
  {
    id: 3,
    tipoContenido: 'TEMA',
    contenidoId: 7,
    accion: 'BANEAR',
    normaId: 2,
    motivo: 'Venta de cuentas de juego: publicidad y comercio no permitidos.',
    moderadorId: 1,
    moderador: 'admin',
    fecha: '2026-10-31T08:30:00',
  },
];
