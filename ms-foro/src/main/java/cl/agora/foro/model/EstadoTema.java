package cl.agora.foro.model;

public enum EstadoTema {
    /** Se pueden agregar comentarios. */
    ABIERTO,
    /** Tema cerrado por su autor o por un moderador: ya no recibe comentarios. */
    CERRADO,
    /**
     * Tema baneado por moderación (ms-moderacion) por no cumplir una norma del foro.
     * Solo MODERADOR y ADMIN lo ven. No recibe comentarios ni se puede editar.
     */
    BANEADO
}
