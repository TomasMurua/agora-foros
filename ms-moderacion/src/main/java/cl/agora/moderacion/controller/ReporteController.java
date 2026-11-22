package cl.agora.moderacion.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.moderacion.dto.MensajeResponse;
import cl.agora.moderacion.dto.ReporteCrearRequest;
import cl.agora.moderacion.dto.ReporteResolverRequest;
import cl.agora.moderacion.dto.ReporteResponse;
import cl.agora.moderacion.hateoas.ReporteModelAssembler;
import cl.agora.moderacion.model.EstadoReporte;
import cl.agora.moderacion.model.TipoContenido;
import cl.agora.moderacion.security.UsuarioActual;
import cl.agora.moderacion.service.ReporteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Reportes (denuncias) de los usuarios sobre temas y comentarios. */
@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;
    private final ReporteModelAssembler assembler;

    @PostMapping
    public ResponseEntity<EntityModel<ReporteResponse>> crear(@Valid @RequestBody ReporteCrearRequest req,
                                                              @AuthenticationPrincipal Jwt jwt) {
        EntityModel<ReporteResponse> modelo =
                assembler.toModel(reporteService.crear(req, UsuarioActual.desde(jwt), bearer(jwt)));
        return ResponseEntity.created(modelo.getRequiredLink(IanaLinkRelations.SELF).toUri()).body(modelo);
    }

    /** Bandeja de moderación: ?estado=PENDIENTE&tipo=TEMA&contenidoId=2 (todos opcionales). */
    @GetMapping
    public ResponseEntity<CollectionModel<EntityModel<ReporteResponse>>> listar(
            @RequestParam(required = false) EstadoReporte estado,
            @RequestParam(required = false) TipoContenido tipo,
            @RequestParam(required = false) Long contenidoId) {
        return ResponseEntity.ok(assembler.toCollectionModel(reporteService.listar(estado, tipo, contenidoId))
                .add(linkTo(methodOn(ReporteController.class).listar(estado, tipo, contenidoId)).withSelfRel()));
    }

    @GetMapping("/mios")
    public ResponseEntity<CollectionModel<EntityModel<ReporteResponse>>> mios(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(assembler.toCollectionModel(reporteService.mios(UsuarioActual.desde(jwt)))
                .add(linkTo(methodOn(ReporteController.class).mios(null)).withSelfRel()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<ReporteResponse>> obtener(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(assembler.toModel(reporteService.obtener(id, UsuarioActual.desde(jwt))));
    }

    /** El moderador cierra el reporte como RESUELTO o DESCARTADO. */
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<ReporteResponse>> resolver(@PathVariable Long id,
                                                                 @Valid @RequestBody ReporteResolverRequest req,
                                                                 @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(assembler.toModel(reporteService.resolver(id, req, UsuarioActual.desde(jwt))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeResponse> eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        reporteService.eliminar(id, UsuarioActual.desde(jwt));
        return ResponseEntity.ok(new MensajeResponse("Reporte " + id + " eliminado correctamente"));
    }

    static String bearer(Jwt jwt) {
        return "Bearer " + jwt.getTokenValue();
    }
}
