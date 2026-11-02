package cl.agora.foro.hateoas;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.foro.controller.CategoriaController;
import cl.agora.foro.dto.CategoriaResponse;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

@Component
public class CategoriaModelAssembler implements RepresentationModelAssembler<CategoriaResponse, EntityModel<CategoriaResponse>> {

    @Override
    public EntityModel<CategoriaResponse> toModel(CategoriaResponse c) {
        return EntityModel.of(c,
                linkTo(methodOn(CategoriaController.class).obtener(c.id())).withSelfRel(),
                linkTo(methodOn(CategoriaController.class).temas(c.id())).withRel("temas"),
                linkTo(methodOn(CategoriaController.class).listar()).withRel("categorias"));
    }
}
