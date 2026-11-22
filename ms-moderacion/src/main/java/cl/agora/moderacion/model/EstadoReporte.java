package cl.agora.moderacion.model;

public enum EstadoReporte {
    /** Recién enviado, nadie lo ha revisado. */
    PENDIENTE,
    /** Un moderador lo revisó y tomó una acción. */
    RESUELTO,
    /** Un moderador lo revisó y el contenido cumple las normas. */
    DESCARTADO
}
