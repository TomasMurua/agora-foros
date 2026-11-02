package cl.agora.foro.dto;

import cl.agora.foro.model.Categoria;
import java.time.LocalDateTime;
import org.springframework.hateoas.server.core.Relation;

@Relation(itemRelation = "categoria", collectionRelation = "categorias")
public record CategoriaResponse(Long id, String nombre, String descripcion, long cantidadTemas,
                                LocalDateTime fechaCreacion) {

    public static CategoriaResponse desde(Categoria c, long cantidadTemas) {
        return new CategoriaResponse(c.getId(), c.getNombre(), c.getDescripcion(), cantidadTemas, c.getFechaCreacion());
    }
}
