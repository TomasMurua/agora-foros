package cl.agora.moderacion.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.moderacion.dto.MensajeResponse;
import cl.agora.moderacion.dto.NormaRequest;
import cl.agora.moderacion.dto.NormaResponse;
import cl.agora.moderacion.hateoas.NormaModelAssembler;
import cl.agora.moderacion.service.NormaService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Normas del foro. Leerlas es público; crearlas, modificarlas y eliminarlas es solo para ADMIN. */
@RestController
@RequestMapping("/api/normas")
@RequiredArgsConstructor
public class NormaController {

    private final NormaService normaService;
    private final NormaModelAssembler assembler;

    @GetMapping
    public ResponseEntity<CollectionModel<EntityModel<NormaResponse>>> listar(
            @RequestParam(defaultValue = "false") boolean soloActivas) {
        return ResponseEntity.ok(assembler.toCollectionModel(normaService.listar(soloActivas))
                .add(linkTo(methodOn(NormaController.class).listar(soloActivas)).withSelfRel()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<NormaResponse>> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(assembler.toModel(normaService.obtener(id)));
    }

    @PostMapping
    public ResponseEntity<EntityModel<NormaResponse>> crear(@Valid @RequestBody NormaRequest req) {
        EntityModel<NormaResponse> modelo = assembler.toModel(normaService.crear(req));
        return ResponseEntity.created(modelo.getRequiredLink(IanaLinkRelations.SELF).toUri()).body(modelo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<NormaResponse>> actualizar(@PathVariable Long id,
                                                                 @Valid @RequestBody NormaRequest req) {
        return ResponseEntity.ok(assembler.toModel(normaService.actualizar(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeResponse> eliminar(@PathVariable Long id) {
        normaService.eliminar(id);
        return ResponseEntity.ok(new MensajeResponse("Norma " + id + " eliminada correctamente"));
    }
}
