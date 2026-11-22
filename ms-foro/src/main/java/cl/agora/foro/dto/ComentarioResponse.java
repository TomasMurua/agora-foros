package cl.agora.foro.dto;

import cl.agora.foro.model.Comentario;
import java.time.LocalDateTime;
import org.springframework.hateoas.server.core.Relation;

@Relation(itemRelation = "comentario", collectionRelation = "comentarios")
public record ComentarioResponse(Long id, Long temaId, Long usuarioId, String autor, String contenido,
                                 boolean baneado, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion) {

    public static ComentarioResponse desde(Comentario c) {
        return new ComentarioResponse(c.getId(), c.getTema().getId(), c.getUsuarioId(), c.getAutor(), c.getContenido(),
                c.estaBaneado(), c.getFechaCreacion(), c.getFechaActualizacion());
    }
}
