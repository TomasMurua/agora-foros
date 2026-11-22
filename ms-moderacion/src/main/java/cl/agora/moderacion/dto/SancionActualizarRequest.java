package cl.agora.moderacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Corrige el motivo o la norma de una sanción ya registrada. No vuelve a ejecutar la acción. */
public record SancionActualizarRequest(
        @NotBlank(message = "El motivo es obligatorio")
        @Size(min = 10, max = 300, message = "El motivo debe tener entre 10 y 300 caracteres")
        String motivo,

        @Positive(message = "El id de la norma debe ser positivo")
        Long normaId) {
}
