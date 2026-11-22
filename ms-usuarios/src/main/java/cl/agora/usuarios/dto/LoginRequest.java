package cl.agora.usuarios.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Debe indicar el nombre de usuario o el correo")
        String usuario,

        @NotBlank(message = "La contraseña es obligatoria")
        String password) {

    /** Quita los espacios del inicio y del final antes de validar los largos. */
    public LoginRequest {
        usuario = Textos.limpiar(usuario);
    }
}
