package cl.agora.moderacion.model;

/** Acciones que registra una sanción. */
public enum TipoAccion {
    /** Oculta el contenido a los usuarios por no cumplir una norma. */
    BANEAR,
    /** Vuelve a publicar un contenido baneado (por ejemplo, tras una apelación). */
    RESTAURAR
}
