package cl.agora.moderacion.client;

import cl.agora.moderacion.model.TipoContenido;

/** Datos mínimos de un tema o comentario de ms-foro que necesita la moderación. */
public record ContenidoForo(TipoContenido tipo, Long id, String autor, String resumen, boolean baneado) {

    public String descripcion() {
        String nombre = tipo == TipoContenido.TEMA ? "Tema" : "Comentario";
        return nombre + " " + id + " de " + autor + (baneado ? " (baneado)" : " (visible)");
    }
}
