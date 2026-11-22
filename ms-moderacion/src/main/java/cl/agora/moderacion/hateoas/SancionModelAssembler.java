package cl.agora.moderacion.hateoas;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.moderacion.controller.NormaController;
import cl.agora.moderacion.controller.ReporteController;
import cl.agora.moderacion.controller.SancionController;
import cl.agora.moderacion.dto.SancionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SancionModelAssembler
        implements RepresentationModelAssembler<SancionResponse, EntityModel<SancionResponse>> {

    private final EnlacesForo enlacesForo;

    @Override
    public EntityModel<SancionResponse> toModel(SancionResponse s) {
        EntityModel<SancionResponse> modelo = EntityModel.of(s,
                linkTo(methodOn(SancionController.class).obtener(s.id())).withSelfRel(),
                enlacesForo.contenido(s.tipoContenido(), s.contenidoId()));
        if (s.normaId() != null) {
            modelo.add(linkTo(methodOn(NormaController.class).obtener(s.normaId())).withRel("norma"));
        }
        if (s.reporteId() != null) {
            modelo.add(linkTo(methodOn(ReporteController.class).obtener(s.reporteId(), null)).withRel("reporte"));
        }
        return modelo;
    }
}
