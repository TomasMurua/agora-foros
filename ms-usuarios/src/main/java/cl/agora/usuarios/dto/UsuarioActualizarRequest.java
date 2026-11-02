package cl.agora.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Todos los campos son opcionales: solo se modifican los que vienen en la solicitud. */
public record UsuarioActualizarRequest(
        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 120, message = "El correo no puede superar 120 caracteres")
        String correo,

        @Size(min = 8, max = 60, message = "La contraseña debe tener entre 8 y 60 caracteres")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "La contraseña debe tener al menos una letra y un número")
        String password,

        @Size(min = 1, max = 100, message = "El nombre completo debe tener entre 1 y 100 caracteres")
        String nombreCompleto,

        /** Solo ADMIN. */
        Long rolId,

        /** Solo ADMIN. false bloquea la cuenta (no puede iniciar sesión). */
        Boolean activo) {
}
