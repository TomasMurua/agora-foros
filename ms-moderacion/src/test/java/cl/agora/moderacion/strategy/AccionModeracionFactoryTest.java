package cl.agora.moderacion.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import cl.agora.moderacion.client.ForoClient;
import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class AccionModeracionFactoryTest {

    private final ForoClient foroClient = mock(ForoClient.class);

    private final AccionModeracionFactory factory = new AccionModeracionFactory(List.of(
            new BanearTemaStrategy(foroClient), new RestaurarTemaStrategy(foroClient),
            new BanearComentarioStrategy(foroClient), new RestaurarComentarioStrategy(foroClient)));

    @Test
    void entregaLaEstrategiaDeCadaCombinacion() {
        assertThat(factory.obtener(TipoContenido.TEMA, TipoAccion.BANEAR)).isInstanceOf(BanearTemaStrategy.class);
        assertThat(factory.obtener(TipoContenido.TEMA, TipoAccion.RESTAURAR)).isInstanceOf(RestaurarTemaStrategy.class);
        assertThat(factory.obtener(TipoContenido.COMENTARIO, TipoAccion.BANEAR))
                .isInstanceOf(BanearComentarioStrategy.class);
        assertThat(factory.obtener(TipoContenido.COMENTARIO, TipoAccion.RESTAURAR))
                .isInstanceOf(RestaurarComentarioStrategy.class);
    }

    @Test
    void cadaEstrategiaLlamaAMsForoConElValorCorrecto() {
        factory.obtener(TipoContenido.TEMA, TipoAccion.BANEAR).ejecutar(7L, "Bearer t");
        factory.obtener(TipoContenido.COMENTARIO, TipoAccion.RESTAURAR).ejecutar(4L, "Bearer t");

        verify(foroClient).cambiarBaneo(TipoContenido.TEMA, 7L, true, "Bearer t");
        verify(foroClient).cambiarBaneo(TipoContenido.COMENTARIO, 4L, false, "Bearer t");
    }

    @Test
    void soloBanearExigeNorma() {
        assertThat(factory.obtener(TipoContenido.TEMA, TipoAccion.BANEAR).requiereNorma()).isTrue();
        assertThat(factory.obtener(TipoContenido.TEMA, TipoAccion.RESTAURAR).requiereNorma()).isFalse();
    }

    @Test
    void unaAccionSinEstrategiaDevuelve400() {
        AccionModeracionFactory incompleta = new AccionModeracionFactory(List.of(new BanearTemaStrategy(foroClient)));

        assertThatThrownBy(() -> incompleta.obtener(TipoContenido.COMENTARIO, TipoAccion.BANEAR))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void dosEstrategiasParaLoMismoNoArrancan() {
        assertThatThrownBy(() -> new AccionModeracionFactory(
                List.of(new BanearTemaStrategy(foroClient), new BanearTemaStrategy(foroClient))))
                .isInstanceOf(IllegalStateException.class);
    }
}
