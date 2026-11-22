package cl.agora.moderacion.hateoas;

import cl.agora.moderacion.model.TipoContenido;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.hateoas.Link;
import org.springframework.stereotype.Component;

/** Arma el enlace al tema o comentario en ms-foro para las respuestas de esta API. */
@Component
public class EnlacesForo {

    private final String foroUrlPublica;

    public EnlacesForo(@Value("${app.foro.url-publica:${app.foro.url}}") String foroUrlPublica) {
        this.foroUrlPublica = foroUrlPublica.endsWith("/")
                ? foroUrlPublica.substring(0, foroUrlPublica.length() - 1)
                : foroUrlPublica;
    }

    public Link contenido(TipoContenido tipo, Long id) {
        String ruta = tipo == TipoContenido.TEMA ? "/api/temas/" : "/api/comentarios/";
        return Link.of(foroUrlPublica + ruta + id, "contenido");
    }
}
