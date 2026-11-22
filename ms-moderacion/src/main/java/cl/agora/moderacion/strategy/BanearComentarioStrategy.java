package cl.agora.moderacion.strategy;

import cl.agora.moderacion.client.ContenidoForo;
import cl.agora.moderacion.client.ForoClient;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Oculta un comentario en ms-foro. */
@Component
@RequiredArgsConstructor
public class BanearComentarioStrategy implements AccionModeracionStrategy {

    private final ForoClient foroClient;

    @Override
    public TipoContenido tipoContenido() {
        return TipoContenido.COMENTARIO;
    }

    @Override
    public TipoAccion accion() {
        return TipoAccion.BANEAR;
    }

    @Override
    public ContenidoForo ejecutar(Long contenidoId, String token) {
        return foroClient.cambiarBaneo(TipoContenido.COMENTARIO, contenidoId, true, token);
    }
}
