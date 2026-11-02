package cl.agora.foro.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.foro.dto.CategoriaRequest;
import cl.agora.foro.dto.CategoriaResponse;
import cl.agora.foro.dto.MensajeResponse;
import cl.agora.foro.dto.TemaResponse;
import cl.agora.foro.hateoas.CategoriaModelAssembler;
import cl.agora.foro.hateoas.TemaModelAssembler;
import cl.agora.foro.service.CategoriaService;
import cl.agora.foro.service.TemaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Categorias del foro. La consulta es publica; crear, modificar y eliminar es solo para ADMIN. */
@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;
    private final TemaService temaService;
    private final CategoriaModelAssembler assembler;
    private final TemaModelAssembler temaAssembler;

    @GetMapping
    public ResponseEntity<CollectionModel<EntityModel<CategoriaResponse>>> listar() {
        return ResponseEntity.ok(assembler.toCollectionModel(categoriaService.listar())
                .add(linkTo(methodOn(CategoriaController.class).listar()).withSelfRel()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<CategoriaResponse>> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(assembler.toModel(categoriaService.obtener(id)));
    }

    /** Temas publicados en la categoria, los mas recientes primero. */
    @GetMapping("/{id}/temas")
    public ResponseEntity<CollectionModel<EntityModel<TemaResponse>>> temas(@PathVariable Long id) {
        return ResponseEntity.ok(temaAssembler.toCollectionModel(temaService.listarPorCategoria(id))
                .add(linkTo(methodOn(CategoriaController.class).temas(id)).withSelfRel())
                .add(linkTo(methodOn(CategoriaController.class).obtener(id)).withRel("categoria")));
    }

    @PostMapping
    public ResponseEntity<EntityModel<CategoriaResponse>> crear(@Valid @RequestBody CategoriaRequest req) {
        EntityModel<CategoriaResponse> modelo = assembler.toModel(categoriaService.crear(req));
        return ResponseEntity.created(modelo.getRequiredLink(IanaLinkRelations.SELF).toUri()).body(modelo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<CategoriaResponse>> actualizar(@PathVariable Long id,
                                                                     @Valid @RequestBody CategoriaRequest req) {
        return ResponseEntity.ok(assembler.toModel(categoriaService.actualizar(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeResponse> eliminar(@PathVariable Long id) {
        categoriaService.eliminar(id);
        return ResponseEntity.ok(new MensajeResponse("Categoría " + id + " eliminada correctamente"));
    }
}
