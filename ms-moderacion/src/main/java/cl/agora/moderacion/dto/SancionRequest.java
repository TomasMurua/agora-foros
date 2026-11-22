package cl.agora.moderacion.dto;

import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Orden de moderación. Al BANEAR la norma es obligatoria. Si viene reporteId, el reporte queda
 * RESUELTO junto con los demás reportes pendientes del mismo contenido.
 */
public record SancionRequest(
        @NotNull(message = "Indique si la acción es sobre un TEMA o un COMENTARIO")
        TipoContenido tipoContenido,

        @NotNull(message = "El id del contenido es obligatorio")
        @Positive(message = "El id del contenido debe ser positivo")
        Long contenidoId,

        @NotNull(message = "La acción es obligatoria (BANEAR o RESTAURAR)")
        TipoAccion accion,

        @Positive(message = "El id de la norma debe ser positivo")
        Long normaId,

        @NotBlank(message = "El motivo es obligatorio")
        @Size(min = 10, max = 300, message = "El motivo debe tener entre 10 y 300 caracteres")
        String motivo,

        @Positive(message = "El id del reporte debe ser positivo")
        Long reporteId) {
}
