package cl.agora.moderacion.dto;

import cl.agora.moderacion.model.Gravedad;
import cl.agora.moderacion.model.Norma;
import java.time.LocalDateTime;
import org.springframework.hateoas.server.core.Relation;

@Relation(itemRelation = "norma", collectionRelation = "normas")
public record NormaResponse(Long id, String codigo, String titulo, String descripcion, Gravedad gravedad,
                            boolean activa, LocalDateTime fechaCreacion) {

    public static NormaResponse desde(Norma n) {
        return new NormaResponse(n.getId(), n.getCodigo(), n.getTitulo(), n.getDescripcion(), n.getGravedad(),
                n.estaActiva(), n.getFechaCreacion());
    }
}
