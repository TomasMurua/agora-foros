package cl.agora.foro.dto;

import cl.agora.foro.model.EstadoTema;
import cl.agora.foro.model.Tema;
import java.time.LocalDateTime;
import org.springframework.hateoas.server.core.Relation;

@Relation(itemRelation = "tema", collectionRelation = "temas")
public record TemaResponse(
        Long id,
        Long categoriaId,
        String categoria,
        Long usuarioId,
        String autor,
        String titulo,
        String contenido,
        EstadoTema estado,
        Long vistas,
        long cantidadComentarios,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion) {

    public static TemaResponse desde(Tema t, long cantidadComentarios) {
        return new TemaResponse(t.getId(), t.getCategoria().getId(), t.getCategoria().getNombre(), t.getUsuarioId(),
                t.getAutor(), t.getTitulo(), t.getContenido(), t.getEstado(), t.getVistas(), cantidadComentarios,
                t.getFechaCreacion(), t.getFechaActualizacion());
    }
}
