package cl.agora.usuarios.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.usuarios.dto.MensajeResponse;
import cl.agora.usuarios.dto.RolRequest;
import cl.agora.usuarios.dto.RolResponse;
import cl.agora.usuarios.hateoas.RolModelAssembler;
import cl.agora.usuarios.service.RolService;
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

/** Consulta publica de roles. Crear, modificar y eliminar roles queda reservado al ADMIN (ver SecurityConfig). */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RolController {

    private final RolService rolService;
    private final RolModelAssembler assembler;

    @GetMapping
    public ResponseEntity<CollectionModel<EntityModel<RolResponse>>> listar() {
        return ResponseEntity.ok(assembler.toCollectionModel(rolService.listar())
                .add(linkTo(methodOn(RolController.class).listar()).withSelfRel()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<RolResponse>> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(assembler.toModel(rolService.obtener(id)));
    }

    @PostMapping
    public ResponseEntity<EntityModel<RolResponse>> crear(@Valid @RequestBody RolRequest req) {
        EntityModel<RolResponse> modelo = assembler.toModel(rolService.crear(req));
        return ResponseEntity.created(modelo.getRequiredLink(IanaLinkRelations.SELF).toUri()).body(modelo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<RolResponse>> actualizar(@PathVariable Long id, @Valid @RequestBody RolRequest req) {
        return ResponseEntity.ok(assembler.toModel(rolService.actualizar(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeResponse> eliminar(@PathVariable Long id) {
        rolService.eliminar(id);
        return ResponseEntity.ok(new MensajeResponse("Rol " + id + " eliminado correctamente"));
    }
}
