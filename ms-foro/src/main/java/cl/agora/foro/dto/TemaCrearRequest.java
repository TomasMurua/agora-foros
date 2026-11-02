package cl.agora.foro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record TemaCrearRequest(
        @NotNull(message = "Debe indicar la categoría del tema")
        @Positive(message = "El id de la categoría debe ser positivo")
        Long categoriaId,

        @NotBlank(message = "El título es obligatorio")
        @Size(min = 5, max = 150, message = "El título debe tener entre 5 y 150 caracteres")
        String titulo,

        @NotBlank(message = "El contenido es obligatorio")
        @Size(min = 10, max = 4000, message = "El contenido debe tener entre 10 y 4000 caracteres")
        String contenido) {
}
