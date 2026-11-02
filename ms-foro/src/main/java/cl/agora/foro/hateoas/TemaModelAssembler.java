package cl.agora.foro.hateoas;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.foro.controller.CategoriaController;
import cl.agora.foro.controller.TemaController;
import cl.agora.foro.dto.TemaResponse;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

@Component
public class TemaModelAssembler implements RepresentationModelAssembler<TemaResponse, EntityModel<TemaResponse>> {

    @Override
    public EntityModel<TemaResponse> toModel(TemaResponse t) {
        return EntityModel.of(t,
                linkTo(methodOn(TemaController.class).visualizar(t.id())).withSelfRel(),
                linkTo(methodOn(TemaController.class).comentarios(t.id())).withRel("comentarios"),
                linkTo(methodOn(CategoriaController.class).obtener(t.categoriaId())).withRel("categoria"));
    }
}
