package cl.agora.foro.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.foro.dto.ComentarioRequest;
import cl.agora.foro.dto.ComentarioResponse;
import cl.agora.foro.dto.MensajeResponse;
import cl.agora.foro.dto.TemaActualizarRequest;
import cl.agora.foro.dto.TemaCrearRequest;
import cl.agora.foro.dto.TemaResponse;
import cl.agora.foro.hateoas.ComentarioModelAssembler;
import cl.agora.foro.hateoas.TemaModelAssembler;
import cl.agora.foro.model.EstadoTema;
import cl.agora.foro.security.UsuarioActual;
import cl.agora.foro.service.ComentarioService;
import cl.agora.foro.service.TemaService;
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

@RestController
@RequestMapping("/api/temas")
@RequiredArgsConstructor
public class TemaController {

    private final TemaService temaService;
    private final ComentarioService comentarioService;
    private final TemaModelAssembler assembler;
    private final ComentarioModelAssembler comentarioAssembler;

    /**
     * Busqueda de temas. Todos los filtros son opcionales:
     * ?q=texto&categoriaId=1&autor=camila.diaz&estado=ABIERTO
     */
    @GetMapping
    public ResponseEntity<CollectionModel<EntityModel<TemaResponse>>> buscar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) String autor,
            @RequestParam(required = false) EstadoTema estado) {
        return ResponseEntity.ok(assembler.toCollectionModel(temaService.buscar(q, categoriaId, autor, estado))
                .add(linkTo(methodOn(TemaController.class).buscar(q, categoriaId, autor, estado)).withSelfRel()));
    }

    /** Temas mas vistos del foro. */
    @GetMapping("/populares")
    public ResponseEntity<CollectionModel<EntityModel<TemaResponse>>> populares(
            @RequestParam(defaultValue = "5") int limite) {
        return ResponseEntity.ok(assembler.toCollectionModel(temaService.masVistos(limite))
                .add(linkTo(methodOn(TemaController.class).populares(limite)).withSelfRel()));
    }

    /** Detalle de un tema (cada consulta suma una visita). */
    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<TemaResponse>> visualizar(@PathVariable Long id) {
        return ResponseEntity.ok(assembler.toModel(temaService.visualizar(id)));
    }

    @PostMapping
    public ResponseEntity<EntityModel<TemaResponse>> publicar(@Valid @RequestBody TemaCrearRequest req,
                                                              @AuthenticationPrincipal Jwt jwt) {
        EntityModel<TemaResponse> modelo = assembler.toModel(temaService.publicar(req, UsuarioActual.desde(jwt)));
        return ResponseEntity.created(modelo.getRequiredLink(IanaLinkRelations.SELF).toUri()).body(modelo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<TemaResponse>> actualizar(@PathVariable Long id,
                                                                @Valid @RequestBody TemaActualizarRequest req,
                                                                @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(assembler.toModel(temaService.actualizar(id, req, UsuarioActual.desde(jwt))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeResponse> eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        temaService.eliminar(id, UsuarioActual.desde(jwt));
        return ResponseEntity.ok(new MensajeResponse("Tema " + id + " eliminado correctamente"));
    }

    @GetMapping("/{id}/comentarios")
    public ResponseEntity<CollectionModel<EntityModel<ComentarioResponse>>> comentarios(@PathVariable Long id) {
        return ResponseEntity.ok(comentarioAssembler.toCollectionModel(comentarioService.listarPorTema(id))
                .add(linkTo(methodOn(TemaController.class).comentarios(id)).withSelfRel())
                .add(linkTo(methodOn(TemaController.class).visualizar(id)).withRel("tema")));
    }

    @PostMapping("/{id}/comentarios")
    public ResponseEntity<EntityModel<ComentarioResponse>> comentar(@PathVariable Long id,
                                                                    @Valid @RequestBody ComentarioRequest req,
                                                                    @AuthenticationPrincipal Jwt jwt) {
        EntityModel<ComentarioResponse> modelo =
                comentarioAssembler.toModel(comentarioService.comentar(id, req, UsuarioActual.desde(jwt)));
        return ResponseEntity.created(modelo.getRequiredLink(IanaLinkRelations.SELF).toUri()).body(modelo);
    }
}
