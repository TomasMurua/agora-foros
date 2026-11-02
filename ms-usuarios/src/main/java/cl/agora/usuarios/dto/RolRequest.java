package cl.agora.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RolRequest(
        @NotBlank(message = "El nombre del rol es obligatorio")
        @Size(max = 30, message = "El nombre del rol no puede superar 30 caracteres")
        @Pattern(regexp = "^[A-Za-z_]+$", message = "El nombre del rol solo admite letras y guion bajo")
        String nombre,

        @Size(max = 200, message = "La descripción no puede superar 200 caracteres")
        String descripcion) {
}
