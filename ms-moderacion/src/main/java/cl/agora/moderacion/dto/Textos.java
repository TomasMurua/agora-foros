package cl.agora.moderacion.dto;

/** Limpieza de los textos que llegan en las solicitudes. */
final class Textos {

    private Textos() {
    }

    /** "  hola  " queda "hola"; así un título de puros espacios no pasa el largo mínimo. */
    static String limpiar(String valor) {
        return valor == null ? null : valor.strip();
    }
}
