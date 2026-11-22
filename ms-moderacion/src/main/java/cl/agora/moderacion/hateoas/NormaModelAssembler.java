package cl.agora.moderacion.hateoas;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.moderacion.controller.NormaController;
import cl.agora.moderacion.dto.NormaResponse;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

@Component
public class NormaModelAssembler implements RepresentationModelAssembler<NormaResponse, EntityModel<NormaResponse>> {

    @Override
    public EntityModel<NormaResponse> toModel(NormaResponse n) {
        return EntityModel.of(n,
                linkTo(methodOn(NormaController.class).obtener(n.id())).withSelfRel(),
                linkTo(methodOn(NormaController.class).listar(false)).withRel("normas"));
    }
}
