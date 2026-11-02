package cl.agora.foro.dto;

import cl.agora.foro.model.EstadoTema;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Campos opcionales. Titulo, contenido y categoria solo los cambia el autor.
 * El estado (ABIERTO / CERRADO) lo puede cambiar el autor, un MODERADOR o un ADMIN.
 */
public record TemaActualizarRequest(
        @Positive(message = "El id de la categoría debe ser positivo")
        Long categoriaId,

        @Size(min = 5, max = 150, message = "El título debe tener entre 5 y 150 caracteres")
        String titulo,

        @Size(min = 10, max = 4000, message = "El contenido debe tener entre 10 y 4000 caracteres")
        String contenido,

        EstadoTema estado) {
}
