package cl.agora.moderacion.strategy;

import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Patrón Factory: entrega la estrategia que corresponde a un tipo de contenido y una acción.
 * Spring inyecta todas las implementaciones de AccionModeracionStrategy y la fábrica las indexa
 * al arrancar, así que una estrategia nueva queda disponible sin tocar esta clase.
 */
@Slf4j
@Component
public class AccionModeracionFactory {

    private record Clave(TipoContenido tipo, TipoAccion accion) {
    }

    private final Map<Clave, AccionModeracionStrategy> estrategias = new HashMap<>();

    public AccionModeracionFactory(List<AccionModeracionStrategy> disponibles) {
        for (AccionModeracionStrategy estrategia : disponibles) {
            Clave clave = new Clave(estrategia.tipoContenido(), estrategia.accion());
            if (estrategias.putIfAbsent(clave, estrategia) != null) {
                throw new IllegalStateException("Hay dos estrategias para " + clave);
            }
        }
        log.info("Acciones de moderación disponibles: {}", estrategias.keySet());
    }

    public AccionModeracionStrategy obtener(TipoContenido tipo, TipoAccion accion) {
        AccionModeracionStrategy estrategia = estrategias.get(new Clave(tipo, accion));
        if (estrategia == null) {
            throw ApiException.solicitudInvalida("La acción " + accion + " no está disponible para " + tipo);
        }
        return estrategia;
    }
}
