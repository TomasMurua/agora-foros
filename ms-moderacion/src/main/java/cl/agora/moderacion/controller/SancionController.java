package cl.agora.moderacion.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.moderacion.dto.MensajeResponse;
import cl.agora.moderacion.dto.SancionActualizarRequest;
import cl.agora.moderacion.dto.SancionRequest;
import cl.agora.moderacion.dto.SancionResponse;
import cl.agora.moderacion.hateoas.SancionModelAssembler;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import cl.agora.moderacion.security.UsuarioActual;
import cl.agora.moderacion.service.SancionService;
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

/** Sanciones: banear o restaurar temas y comentarios, con su historial. */
@RestController
@RequestMapping("/api/sanciones")
@RequiredArgsConstructor
public class SancionController {

    private final SancionService sancionService;
    private final SancionModelAssembler assembler;

    /** Banea o restaura el contenido en ms-foro y deja la sanción registrada. */
    @PostMapping
    public ResponseEntity<EntityModel<SancionResponse>> registrar(@Valid @RequestBody SancionRequest req,
                                                                  @AuthenticationPrincipal Jwt jwt) {
        EntityModel<SancionResponse> modelo = assembler.toModel(
                sancionService.registrar(req, UsuarioActual.desde(jwt), ReporteController.bearer(jwt)));
        return ResponseEntity.created(modelo.getRequiredLink(IanaLinkRelations.SELF).toUri()).body(modelo);
    }

    /** Historial: ?tipo=COMENTARIO&contenidoId=4&accion=BANEAR (todos opcionales). */
    @GetMapping
    public ResponseEntity<CollectionModel<EntityModel<SancionResponse>>> listar(
            @RequestParam(required = false) TipoContenido tipo,
            @RequestParam(required = false) Long contenidoId,
            @RequestParam(required = false) TipoAccion accion) {
        return ResponseEntity.ok(assembler.toCollectionModel(sancionService.listar(tipo, contenidoId, accion))
                .add(linkTo(methodOn(SancionController.class).listar(tipo, contenidoId, accion)).withSelfRel()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<SancionResponse>> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(assembler.toModel(sancionService.obtener(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<SancionResponse>> actualizar(@PathVariable Long id,
                                                                   @Valid @RequestBody SancionActualizarRequest req,
                                                                   @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(assembler.toModel(sancionService.actualizar(id, req, UsuarioActual.desde(jwt))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeResponse> eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        sancionService.eliminar(id, UsuarioActual.desde(jwt));
        return ResponseEntity.ok(new MensajeResponse("Sanción " + id + " eliminada del historial"));
    }
}
