package cl.agora.moderacion.dto;

import cl.agora.moderacion.model.Sancion;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import java.time.LocalDateTime;
import org.springframework.hateoas.server.core.Relation;

@Relation(itemRelation = "sancion", collectionRelation = "sanciones")
public record SancionResponse(Long id, TipoContenido tipoContenido, Long contenidoId, TipoAccion accion,
                              Long normaId, String norma, String motivo, Long moderadorId, String moderador,
                              Long reporteId, LocalDateTime fecha, String resultado) {

    public static SancionResponse desde(Sancion s) {
        return desde(s, null);
    }

    /** resultado: lo que respondió ms-foro al ejecutar la acción (solo al registrarla). */
    public static SancionResponse desde(Sancion s, String resultado) {
        return new SancionResponse(s.getId(), s.getTipoContenido(), s.getContenidoId(), s.getAccion(),
                s.getNorma() == null ? null : s.getNorma().getId(),
                s.getNorma() == null ? null : s.getNorma().getCodigo() + " " + s.getNorma().getTitulo(),
                s.getMotivo(), s.getModeradorId(), s.getModerador(),
                s.getReporte() == null ? null : s.getReporte().getId(), s.getFecha(), resultado);
    }
}
