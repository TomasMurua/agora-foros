package cl.agora.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Todos los campos son opcionales: solo se modifican los que vienen en la solicitud. */
public record UsuarioActualizarRequest(
        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 120, message = "El correo no puede superar 120 caracteres")
        String correo,

        @Size(min = 8, max = 20, message = "La contraseña debe tener entre 8 y 20 caracteres")
        @Pattern(regexp = "^(?=.*[A-ZÁÉÍÓÚÑ])(?=.*[a-záéíóúñ])(?=.*\\d)(?=.*[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\\s])\\S+$",
                message = "La contraseña debe tener mayúscula, minúscula, número y carácter especial, y no puede tener espacios")
        String password,

        @Size(min = 2, max = 60, message = "El nombre completo debe tener entre 2 y 60 caracteres")
        @Pattern(regexp = "^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$", message = "El nombre completo solo admite letras y espacios")
        String nombreCompleto,

        /** Solo ADMIN. */
        Long rolId,

        /** Solo ADMIN. false bloquea la cuenta (no puede iniciar sesión). */
        Boolean activo) {

    /** Quita los espacios del inicio y del final antes de validar los largos. */
    public UsuarioActualizarRequest {
        correo = Textos.limpiar(correo);
        nombreCompleto = Textos.limpiar(nombreCompleto);
    }
}
