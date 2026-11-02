package cl.agora.usuarios.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import cl.agora.usuarios.dto.MensajeResponse;
import cl.agora.usuarios.dto.UsuarioActualizarRequest;
import cl.agora.usuarios.dto.UsuarioCrearRequest;
import cl.agora.usuarios.dto.UsuarioResponse;
import cl.agora.usuarios.hateoas.UsuarioModelAssembler;
import cl.agora.usuarios.security.UsuarioActual;
import cl.agora.usuarios.service.UsuarioService;
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
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioModelAssembler assembler;

    /** Lista los usuarios (ADMIN y MODERADOR). Filtro opcional por rol: ?rol=USUARIO */
    @GetMapping
    public ResponseEntity<CollectionModel<EntityModel<UsuarioResponse>>> listar(
            @RequestParam(required = false) String rol) {
        CollectionModel<EntityModel<UsuarioResponse>> modelo = assembler.toCollectionModel(usuarioService.listar(rol))
                .add(linkTo(methodOn(UsuarioController.class).listar(rol)).withSelfRel());
        return ResponseEntity.ok(modelo);
    }

    /** Datos de la cuenta que inicio sesion. */
    @GetMapping("/me")
    public ResponseEntity<EntityModel<UsuarioResponse>> miCuenta(@AuthenticationPrincipal Jwt jwt) {
        UsuarioActual actual = UsuarioActual.desde(jwt);
        return ResponseEntity.ok(assembler.toModel(usuarioService.obtener(actual.id(), actual)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<UsuarioResponse>> obtener(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(assembler.toModel(usuarioService.obtener(id, UsuarioActual.desde(jwt))));
    }

    /** Registro publico de usuarios. Un ADMIN con token puede indicar el rol. */
    @PostMapping
    public ResponseEntity<EntityModel<UsuarioResponse>> crear(@Valid @RequestBody UsuarioCrearRequest req,
                                                              @AuthenticationPrincipal Jwt jwt) {
        EntityModel<UsuarioResponse> modelo = assembler.toModel(usuarioService.crear(req, UsuarioActual.desde(jwt)));
        return ResponseEntity.created(modelo.getRequiredLink(IanaLinkRelations.SELF).toUri()).body(modelo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<UsuarioResponse>> actualizar(@PathVariable Long id,
                                                                   @Valid @RequestBody UsuarioActualizarRequest req,
                                                                   @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(assembler.toModel(usuarioService.actualizar(id, req, UsuarioActual.desde(jwt))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeResponse> eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        usuarioService.eliminar(id, UsuarioActual.desde(jwt));
        return ResponseEntity.ok(new MensajeResponse("Usuario " + id + " eliminado correctamente"));
    }
}
