package cl.agora.moderacion.strategy;

import cl.agora.moderacion.client.ContenidoForo;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;

/**
 * Patrón Strategy: cada acción de moderación (banear o restaurar un tema o un comentario) es una
 * estrategia distinta. SancionService no sabe cómo se ejecuta cada una: le pide la estrategia a
 * AccionModeracionFactory y la ejecuta. Para agregar una acción nueva basta con otra clase que
 * implemente esta interfaz.
 */
public interface AccionModeracionStrategy {

    TipoContenido tipoContenido();

    TipoAccion accion();

    /** Al banear, la sanción debe indicar la norma que no se cumplió. */
    default boolean requiereNorma() {
        return accion() == TipoAccion.BANEAR;
    }

    /**
     * Ejecuta la acción en ms-foro.
     *
     * @param contenidoId id del tema o comentario
     * @param token       header Authorization del moderador, se reenvía a ms-foro
     */
    ContenidoForo ejecutar(Long contenidoId, String token);
}
