package cl.agora.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioCrearRequest(
        @NotBlank(message = "El nombre de usuario es obligatorio")
        @Size(min = 3, max = 30, message = "El nombre de usuario debe tener entre 3 y 30 caracteres")
        @Pattern(regexp = "^[a-z0-9._]+$", message = "El nombre de usuario solo admite minúsculas, números, punto y guion bajo")
        String nombreUsuario,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 120, message = "El correo no puede superar 120 caracteres")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 20, message = "La contraseña debe tener entre 8 y 20 caracteres")
        @Pattern(regexp = "^(?=.*[A-ZÁÉÍÓÚÑ])(?=.*[a-záéíóúñ])(?=.*\\d)(?=.*[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\\s])\\S+$",
                message = "La contraseña debe tener mayúscula, minúscula, número y carácter especial, y no puede tener espacios")
        String password,

        @NotBlank(message = "El nombre completo es obligatorio")
        @Size(min = 2, max = 60, message = "El nombre completo debe tener entre 2 y 60 caracteres")
        @Pattern(regexp = "^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$", message = "El nombre completo solo admite letras y espacios")
        String nombreCompleto,

        /** Opcional. Solo un ADMIN puede crear usuarios con un rol distinto de USUARIO. */
        Long rolId) {

    /** Quita los espacios del inicio y del final antes de validar los largos. */
    public UsuarioCrearRequest {
        nombreUsuario = Textos.limpiar(nombreUsuario);
        correo = Textos.limpiar(correo);
        nombreCompleto = Textos.limpiar(nombreCompleto);
    }
}
