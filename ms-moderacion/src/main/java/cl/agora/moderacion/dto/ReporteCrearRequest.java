package cl.agora.moderacion.dto;

import cl.agora.moderacion.model.TipoContenido;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ReporteCrearRequest(
        @NotNull(message = "Indique si reporta un TEMA o un COMENTARIO")
        TipoContenido tipoContenido,

        @NotNull(message = "El id del contenido es obligatorio")
        @Positive(message = "El id del contenido debe ser positivo")
        Long contenidoId,

        @NotNull(message = "Indique la norma que no se cumple")
        @Positive(message = "El id de la norma debe ser positivo")
        Long normaId,

        @NotBlank(message = "El motivo es obligatorio")
        @Size(min = 10, max = 300, message = "El motivo debe tener entre 10 y 300 caracteres")
        String motivo) {
}
