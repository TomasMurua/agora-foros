import { Categoria, Comentario, Tema } from '../core/models/foro.model';

/** Categorías iniciales, iguales a bd/03_ms_foro.sql. */
export const CATEGORIAS_INICIALES: readonly Categoria[] = [
  {
    id: 1,
    nombre: 'Tecnología y Programación',
    descripcion:
      'Lenguajes, frameworks, hardware y todo lo que tenga que ver con desarrollo de software.',
    icono: 'cpu',
    fechaCreacion: '2026-10-20T10:00:00',
  },
  {
    id: 2,
    nombre: 'Videojuegos',
    descripcion: 'Lanzamientos, recomendaciones, partidas en línea y torneos.',
    icono: 'controller',
    fechaCreacion: '2026-10-20T10:05:00',
  },
  {
    id: 3,
    nombre: 'Cine y Series',
    descripcion: 'Estrenos, críticas y recomendaciones de películas y series.',
    icono: 'film',
    fechaCreacion: '2026-10-20T10:10:00',
  },
  {
    id: 4,
    nombre: 'Deportes',
    descripcion: 'Fútbol, tenis, running y cualquier deporte que quieras comentar.',
    icono: 'trophy',
    fechaCreacion: '2026-10-20T10:15:00',
  },
  {
    id: 5,
    nombre: 'Música',
    descripcion: 'Bandas, discos, conciertos e instrumentos.',
    icono: 'music-note-beamed',
    fechaCreacion: '2026-10-20T10:20:00',
  },
];

/**
 * Temas iniciales, iguales a bd/03_ms_foro.sql. El tema 7 (venta de cuentas) quedó
 * BANEADO por la sanción 3 del historial de moderación.
 */
export const TEMAS_INICIALES: readonly Tema[] = [
  {
    id: 1,
    categoriaId: 1,
    usuarioId: 3,
    autor: 'camila.diaz',
    titulo: '¿Spring Boot o Quarkus para microservicios?',
    contenido:
      'Estoy empezando un proyecto con microservicios en Java y no sé si quedarme con Spring Boot o probar Quarkus. ¿Qué experiencia tienen con cada uno?',
    estado: 'ABIERTO',
    vistas: 42,
    fechaCreacion: '2026-10-25T19:20:00',
    fechaActualizacion: null,
  },
  {
    id: 2,
    categoriaId: 2,
    usuarioId: 4,
    autor: 'matias.soto',
    titulo: 'Busco grupo para jugar cooperativo los fines de semana',
    contenido:
      'Juego en PC, principalmente shooters y juegos de supervivencia. Si alguien se suma, dejo mi usuario por mensaje.',
    estado: 'ABIERTO',
    vistas: 18,
    fechaCreacion: '2026-10-26T21:00:00',
    fechaActualizacion: null,
  },
  {
    id: 3,
    categoriaId: 3,
    usuarioId: 5,
    autor: 'fernanda.lagos',
    titulo: 'Series recomendadas para ver este mes',
    contenido:
      'Terminé todo lo que tenía pendiente. Recomienden series de ciencia ficción o de misterio que valgan la pena.',
    estado: 'ABIERTO',
    vistas: 27,
    fechaCreacion: '2026-10-27T22:15:00',
    fechaActualizacion: null,
  },
  {
    id: 4,
    categoriaId: 4,
    usuarioId: 3,
    autor: 'camila.diaz',
    titulo: 'Rutina para preparar mi primera media maratón',
    contenido:
      'Me inscribí para una media maratón en marzo. ¿Cuántos días a la semana entrenan y cómo reparten los kilómetros?',
    estado: 'ABIERTO',
    vistas: 11,
    fechaCreacion: '2026-10-28T07:40:00',
    fechaActualizacion: null,
  },
  {
    id: 5,
    categoriaId: 5,
    usuarioId: 4,
    autor: 'matias.soto',
    titulo: '¿Qué guitarra eléctrica recomiendan para empezar?',
    contenido:
      'Quiero aprender guitarra eléctrica y tengo un presupuesto acotado. ¿Conviene comprar usada o un pack de principiante?',
    estado: 'ABIERTO',
    vistas: 9,
    fechaCreacion: '2026-10-29T16:30:00',
    fechaActualizacion: null,
  },
  {
    id: 6,
    categoriaId: 1,
    usuarioId: 2,
    autor: 'moderador',
    titulo: 'Normas de la categoría Tecnología',
    contenido:
      'Antes de publicar, busca si tu pregunta ya fue respondida. Comparte código con formato y no publiques datos personales ni claves.',
    estado: 'CERRADO',
    vistas: 64,
    fechaCreacion: '2026-10-20T12:00:00',
    fechaActualizacion: null,
  },
  {
    id: 7,
    categoriaId: 2,
    usuarioId: 4,
    autor: 'matias.soto',
    titulo: 'Vendo cuentas con skins a precio de remate',
    contenido:
      'Tengo cuentas con todos los pases de temporada desbloqueados. Precios bajos solo esta semana, escríbanme por mensaje privado y les paso el link de pago.',
    estado: 'BANEADO',
    vistas: 5,
    fechaCreacion: '2026-10-30T23:10:00',
    fechaActualizacion: null,
  },
];

/** Comentarios iniciales, iguales a bd/03_ms_foro.sql. */
export const COMENTARIOS_INICIALES: readonly Comentario[] = [
  {
    id: 1,
    temaId: 1,
    usuarioId: 4,
    autor: 'matias.soto',
    contenido:
      'Spring Boot tiene mucha más documentación y comunidad. Para empezar me quedaria con eso.',
    baneado: false,
    fechaCreacion: '2026-10-25T20:02:00',
    fechaActualizacion: null,
  },
  {
    id: 2,
    temaId: 1,
    usuarioId: 5,
    autor: 'fernanda.lagos',
    contenido:
      'Quarkus arranca más rápido y usa menos memoria, pero Spring Boot 3 también soporta imágenes nativas.',
    baneado: false,
    fechaCreacion: '2026-10-25T21:10:00',
    fechaActualizacion: null,
  },
  {
    id: 3,
    temaId: 2,
    usuarioId: 3,
    autor: 'camila.diaz',
    contenido: '¡Me sumo! Juego los sábados en la tarde.',
    baneado: false,
    fechaCreacion: '2026-10-26T22:30:00',
    fechaActualizacion: null,
  },
  {
    id: 4,
    temaId: 3,
    usuarioId: 4,
    autor: 'matias.soto',
    contenido:
      'Si te gusta el misterio, busca series de detectives nórdicas. Son muy buenas.',
    baneado: false,
    fechaCreacion: '2026-10-28T09:15:00',
    fechaActualizacion: null,
  },
  {
    id: 5,
    temaId: 4,
    usuarioId: 5,
    autor: 'fernanda.lagos',
    contenido: 'Yo entreno 4 días: dos suaves, uno de series y una tirada larga el domingo.',
    baneado: false,
    fechaCreacion: '2026-10-28T12:00:00',
    fechaActualizacion: null,
  },
  {
    id: 6,
    temaId: 5,
    usuarioId: 3,
    autor: 'camila.diaz',
    contenido:
      'Una usada en buen estado suele salir mejor que un pack. Revisa bien el mástil antes de comprar.',
    baneado: false,
    fechaCreacion: '2026-10-29T18:45:00',
    fechaActualizacion: null,
  },
];
