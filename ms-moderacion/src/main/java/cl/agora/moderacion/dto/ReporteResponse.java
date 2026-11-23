package cl.agora.moderacion.dto;

import cl.agora.moderacion.model.EstadoReporte;
import cl.agora.moderacion.model.Reporte;
import cl.agora.moderacion.model.TipoContenido;
import java.time.LocalDateTime;
import org.springframework.hateoas.server.core.Relation;

@Relation(itemRelation = "reporte", collectionRelation = "reportes")
public record ReporteResponse(Long id, TipoContenido tipoContenido, Long contenidoId, Long normaId, String norma,
                              String motivo, Long usuarioId, String reportadoPor, EstadoReporte estado,
                              String resueltoPor, String observacion, LocalDateTime fechaCreacion,
                              LocalDateTime fechaResolucion) {

    public static ReporteResponse desde(Reporte r) {
        return new ReporteResponse(r.getId(), r.getTipoContenido(), r.getContenidoId(), r.getNorma().getId(),
                r.getNorma().getCodigo() + " " + r.getNorma().getTitulo(), r.getMotivo(), r.getUsuarioId(),
                r.getReportadoPor(), r.getEstado(), r.getResueltoPor(), r.getObservacion(), r.getFechaCreacion(),
                r.getFechaResolucion());
    }
}
