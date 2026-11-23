package cl.agora.moderacion.client;

import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.TipoContenido;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Puerta de entrada (Gateway) a ms-foro. Es la única clase que conoce sus rutas y formatos.
 * Reenvía el token del moderador, así ms-foro aplica sus propias reglas de permisos.
 */
@Slf4j
@Component
public class ForoClient {

    private final RestClient restClient;

    /** Recibe el RestClient configurado en ForoClientConfig (URL base de ms-foro y tiempos de espera). */
    public ForoClient(RestClient foroRestClient) {
        this.restClient = foroRestClient;
    }

    /** Consulta un tema o comentario con el token de quien pregunta (404 si no existe o no lo puede ver). */
    public ContenidoForo obtener(TipoContenido tipo, Long id, String token) {
        return ejecutar(tipo, id, () -> restClient.get()
                .uri(tipo == TipoContenido.TEMA ? ruta(tipo) + "/{id}?sumarVisita=false" : ruta(tipo) + "/{id}", id)
                .header(HttpHeaders.AUTHORIZATION, token)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(JsonNode.class));
    }

    /** Banea (true) o restaura (false) el contenido en ms-foro. */
    public ContenidoForo cambiarBaneo(TipoContenido tipo, Long id, boolean baneado, String token) {
        ContenidoForo contenido = ejecutar(tipo, id, () -> restClient.put()
                .uri(ruta(tipo) + "/{id}/baneo", id)
                .header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(Map.of("baneado", baneado))
                .retrieve()
                .body(JsonNode.class));
        log.info("ms-foro confirmó: {}", contenido.descripcion());
        return contenido;
    }

    private ContenidoForo ejecutar(TipoContenido tipo, Long id, Supplier<JsonNode> llamada) {
        try {
            JsonNode json = llamada.get();
            if (json == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "ms-foro respondió sin contenido");
            }
            return aContenido(tipo, json);
        } catch (RestClientResponseException ex) {
            throw traducir(tipo, id, ex);
        } catch (ResourceAccessException ex) {
            log.error("No se pudo contactar a ms-foro: {}", ex.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El servicio del foro no responde. Intente de nuevo en unos minutos");
        }
    }

    private static ContenidoForo aContenido(TipoContenido tipo, JsonNode json) {
        boolean baneado = tipo == TipoContenido.TEMA
                ? "BANEADO".equals(json.path("estado").asText())
                : json.path("baneado").asBoolean(false);
        String resumen = tipo == TipoContenido.TEMA ? json.path("titulo").asText() : json.path("contenido").asText();
        if (resumen.length() > 80) {
            resumen = resumen.substring(0, 77) + "...";
        }
        return new ContenidoForo(tipo, json.path("id").asLong(), json.path("autor").asText(), resumen, baneado);
    }

    /** Convierte las respuestas de error de ms-foro en errores de esta API. */
    private static ApiException traducir(TipoContenido tipo, Long id, RestClientResponseException ex) {
        HttpStatusCode status = ex.getStatusCode();
        String nombre = tipo == TipoContenido.TEMA ? "el tema" : "el comentario";
        String mensajeForo = extraerMensaje(ex);
        if (status.value() == 404) {
            return ApiException.noEncontrado("No existe " + nombre + " con id " + id + " en el foro");
        }
        if (status.value() == 409) {
            return ApiException.conflicto(mensajeForo != null ? mensajeForo : "ms-foro rechazó la operación");
        }
        if (status.value() == 401 || status.value() == 403) {
            return ApiException.prohibido("El foro no autorizó la operación con su sesión");
        }
        log.error("ms-foro respondió {} al moderar {} {}: {}", status.value(), tipo, id, ex.getResponseBodyAsString());
        return new ApiException(HttpStatus.BAD_GATEWAY, "El servicio del foro respondió con un error");
    }

    private static String extraerMensaje(RestClientResponseException ex) {
        try {
            JsonNode body = ex.getResponseBodyAs(JsonNode.class);
            return body == null ? null : body.path("mensaje").asText(null);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static String ruta(TipoContenido tipo) {
        return tipo == TipoContenido.TEMA ? "/api/temas" : "/api/comentarios";
    }
}
