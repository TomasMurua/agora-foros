package cl.agora.moderacion.hateoas;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.moderacion.controller.NormaController;
import cl.agora.moderacion.controller.ReporteController;
import cl.agora.moderacion.dto.ReporteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReporteModelAssembler
        implements RepresentationModelAssembler<ReporteResponse, EntityModel<ReporteResponse>> {

    private final EnlacesForo enlacesForo;

    @Override
    public EntityModel<ReporteResponse> toModel(ReporteResponse r) {
        return EntityModel.of(r,
                linkTo(methodOn(ReporteController.class).obtener(r.id(), null)).withSelfRel(),
                linkTo(methodOn(NormaController.class).obtener(r.normaId())).withRel("norma"),
                enlacesForo.contenido(r.tipoContenido(), r.contenidoId()));
    }
}
