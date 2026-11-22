package cl.agora.moderacion.strategy;

import cl.agora.moderacion.client.ContenidoForo;
import cl.agora.moderacion.client.ForoClient;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Vuelve a publicar un tema en ms-foro. */
@Component
@RequiredArgsConstructor
public class RestaurarTemaStrategy implements AccionModeracionStrategy {

    private final ForoClient foroClient;

    @Override
    public TipoContenido tipoContenido() {
        return TipoContenido.TEMA;
    }

    @Override
    public TipoAccion accion() {
        return TipoAccion.RESTAURAR;
    }

    @Override
    public ContenidoForo ejecutar(Long contenidoId, String token) {
        return foroClient.cambiarBaneo(TipoContenido.TEMA, contenidoId, false, token);
    }
}
