package cl.agora.usuarios.hateoas;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.usuarios.controller.RolController;
import cl.agora.usuarios.dto.RolResponse;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

@Component
public class RolModelAssembler implements RepresentationModelAssembler<RolResponse, EntityModel<RolResponse>> {

    @Override
    public EntityModel<RolResponse> toModel(RolResponse rol) {
        return EntityModel.of(rol,
                linkTo(methodOn(RolController.class).obtener(rol.id())).withSelfRel(),
                linkTo(methodOn(RolController.class).listar()).withRel("roles"));
    }
}
