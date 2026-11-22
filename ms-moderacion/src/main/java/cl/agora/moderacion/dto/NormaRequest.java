package cl.agora.moderacion.dto;

import cl.agora.moderacion.model.Gravedad;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NormaRequest(
        @NotBlank(message = "El código es obligatorio")
        @Pattern(regexp = "^N[0-9]{1,3}$", message = "El código debe ser una N seguida de 1 a 3 dígitos, por ejemplo N6")
        String codigo,

        @NotBlank(message = "El título es obligatorio")
        @Size(min = 5, max = 80, message = "El título debe tener entre 5 y 80 caracteres")
        String titulo,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(min = 10, max = 500, message = "La descripción debe tener entre 10 y 500 caracteres")
        String descripcion,

        @NotNull(message = "La gravedad es obligatoria (BAJA, MEDIA o ALTA)")
        Gravedad gravedad,

        /** Opcional: si no viene, la norma queda activa. */
        Boolean activa) {
}
