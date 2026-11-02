package cl.agora.foro.controller;

import cl.agora.foro.dto.ComentarioRequest;
import cl.agora.foro.dto.ComentarioResponse;
import cl.agora.foro.dto.MensajeResponse;
import cl.agora.foro.hateoas.ComentarioModelAssembler;
import cl.agora.foro.security.UsuarioActual;
import cl.agora.foro.service.ComentarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Comentarios individuales. Para listar o agregar comentarios de un tema ver TemaController. */
@RestController
@RequestMapping("/api/comentarios")
@RequiredArgsConstructor
public class ComentarioController {

    private final ComentarioService comentarioService;
    private final ComentarioModelAssembler assembler;

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<ComentarioResponse>> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(assembler.toModel(comentarioService.obtener(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<ComentarioResponse>> actualizar(@PathVariable Long id,
                                                                      @Valid @RequestBody ComentarioRequest req,
                                                                      @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(assembler.toModel(comentarioService.actualizar(id, req, UsuarioActual.desde(jwt))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeResponse> eliminar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        comentarioService.eliminar(id, UsuarioActual.desde(jwt));
        return ResponseEntity.ok(new MensajeResponse("Comentario " + id + " eliminado correctamente"));
    }
}
