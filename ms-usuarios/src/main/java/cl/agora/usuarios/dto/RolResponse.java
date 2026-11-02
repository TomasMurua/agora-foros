package cl.agora.usuarios.dto;

import cl.agora.usuarios.model.Rol;
import org.springframework.hateoas.server.core.Relation;

@Relation(itemRelation = "rol", collectionRelation = "roles")
public record RolResponse(Long id, String nombre, String descripcion) {

    public static RolResponse desde(Rol rol) {
        return new RolResponse(rol.getId(), rol.getNombre(), rol.getDescripcion());
    }
}
