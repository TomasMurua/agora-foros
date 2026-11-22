package cl.agora.moderacion.dto;

import cl.agora.moderacion.model.EstadoReporte;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** El moderador marca el reporte como RESUELTO o DESCARTADO. */
public record ReporteResolverRequest(
        @NotNull(message = "El estado es obligatorio (RESUELTO o DESCARTADO)")
        EstadoReporte estado,

        @Size(max = 300, message = "La observación no puede superar los 300 caracteres")
        String observacion) {
}
