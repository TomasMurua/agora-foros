package cl.agora.foro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoriaRequest(
        @NotBlank(message = "El nombre de la categoría es obligatorio")
        @Size(min = 3, max = 60, message = "El nombre debe tener entre 3 y 60 caracteres")
        String nombre,

        @Size(max = 300, message = "La descripción no puede superar 300 caracteres")
        String descripcion) {

    /** Quita los espacios del inicio y del final antes de validar los largos. */
    public CategoriaRequest {
        nombre = Textos.limpiar(nombre);
        descripcion = Textos.limpiar(descripcion);
    }
}
