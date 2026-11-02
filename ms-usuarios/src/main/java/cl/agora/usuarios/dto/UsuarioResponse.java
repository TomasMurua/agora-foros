package cl.agora.usuarios.dto;

import cl.agora.usuarios.model.Usuario;
import java.time.LocalDateTime;
import org.springframework.hateoas.server.core.Relation;

@Relation(itemRelation = "usuario", collectionRelation = "usuarios")
public record UsuarioResponse(
        Long id,
        String nombreUsuario,
        String correo,
        String nombreCompleto,
        String rol,
        Boolean activo,
        LocalDateTime fechaRegistro) {

    public static UsuarioResponse desde(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombreUsuario(), u.getCorreo(), u.getNombreCompleto(),
                u.getRol().getNombre(), u.getActivo(), u.getFechaRegistro());
    }
}
