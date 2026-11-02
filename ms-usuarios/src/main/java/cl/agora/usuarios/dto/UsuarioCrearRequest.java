package cl.agora.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioCrearRequest(
        @NotBlank(message = "El nombre de usuario es obligatorio")
        @Size(min = 3, max = 30, message = "El nombre de usuario debe tener entre 3 y 30 caracteres")
        @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El nombre de usuario solo admite letras, números, punto, guion y guion bajo")
        String nombreUsuario,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 120, message = "El correo no puede superar 120 caracteres")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 60, message = "La contraseña debe tener entre 8 y 60 caracteres")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "La contraseña debe tener al menos una letra y un número")
        String password,

        @NotBlank(message = "El nombre completo es obligatorio")
        @Size(max = 100, message = "El nombre completo no puede superar 100 caracteres")
        String nombreCompleto,

        /** Opcional. Solo un ADMIN puede crear usuarios con un rol distinto de USUARIO. */
        Long rolId) {
}
