package cl.agora.moderacion.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.TipoContenido;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class ForoClientTest {

    private MockRestServiceServer servidor;
    private ForoClient foroClient;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://ms-foro:8082");
        servidor = MockRestServiceServer.bindTo(builder).build();
        foroClient = new ForoClient(builder.build());
    }

    @Test
    void banearUnTemaReenviaElTokenYLeeLaRespuesta() {
        servidor.expect(requestTo("http://ms-foro:8082/api/temas/7/baneo"))
                .andExpect(method(HttpMethod.PUT))
                .andExpect(header("Authorization", "Bearer abc"))
                .andExpect(content().json("{\"baneado\":true}"))
                .andRespond(withSuccess("{\"id\":7,\"autor\":\"matias.soto\",\"titulo\":\"Vendo cuentas\",\"estado\":\"BANEADO\"}",
                        MediaType.APPLICATION_JSON));

        ContenidoForo c = foroClient.cambiarBaneo(TipoContenido.TEMA, 7L, true, "Bearer abc");

        assertThat(c.baneado()).isTrue();
        assertThat(c.autor()).isEqualTo("matias.soto");
        servidor.verify();
    }

    @Test
    void un404DeMsForoSeTraduceA404() {
        servidor.expect(requestTo("http://ms-foro:8082/api/comentarios/99/baneo"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> foroClient.cambiarBaneo(TipoContenido.COMENTARIO, 99L, true, "Bearer abc"))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void un409DeMsForoMantieneSuMensaje() {
        servidor.expect(requestTo("http://ms-foro:8082/api/temas/7/baneo"))
                .andRespond(withStatus(HttpStatus.CONFLICT).contentType(MediaType.APPLICATION_JSON)
                        .body("{\"status\":409,\"mensaje\":\"El tema ya está baneado\"}"));

        assertThatThrownBy(() -> foroClient.cambiarBaneo(TipoContenido.TEMA, 7L, true, "Bearer abc"))
                .isInstanceOf(ApiException.class)
                .hasMessage("El tema ya está baneado");
    }
}
