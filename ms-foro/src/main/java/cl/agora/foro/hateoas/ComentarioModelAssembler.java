package cl.agora.foro.hateoas;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.foro.controller.ComentarioController;
import cl.agora.foro.controller.TemaController;
import cl.agora.foro.dto.ComentarioResponse;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

@Component
public class ComentarioModelAssembler implements RepresentationModelAssembler<ComentarioResponse, EntityModel<ComentarioResponse>> {

    @Override
    public EntityModel<ComentarioResponse> toModel(ComentarioResponse c) {
        return EntityModel.of(c,
                linkTo(methodOn(ComentarioController.class).obtener(c.id())).withSelfRel(),
                linkTo(methodOn(TemaController.class).visualizar(c.temaId())).withRel("tema"));
    }
}
