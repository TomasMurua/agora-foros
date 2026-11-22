package cl.agora.foro.dto;

import jakarta.validation.constraints.NotNull;

/** Lo envia ms-moderacion para banear (true) o restaurar (false) un tema o comentario. */
public record BaneoRequest(
        @NotNull(message = "Debe indicar si el contenido queda baneado (true) o restaurado (false)")
        Boolean baneado) {
}
