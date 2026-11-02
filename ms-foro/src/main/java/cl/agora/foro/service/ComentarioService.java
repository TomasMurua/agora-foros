package cl.agora.foro.service;

import cl.agora.foro.dto.ComentarioRequest;
import cl.agora.foro.dto.ComentarioResponse;
import cl.agora.foro.exception.ApiException;
import cl.agora.foro.model.Comentario;
import cl.agora.foro.model.EstadoTema;
import cl.agora.foro.model.Tema;
import cl.agora.foro.repository.ComentarioRepository;
import cl.agora.foro.security.UsuarioActual;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final TemaService temaService;

    @Transactional(readOnly = true)
    public List<ComentarioResponse> listarPorTema(Long temaId) {
        temaService.buscarEntidad(temaId);
        return comentarioRepository.findByTemaIdOrderByFechaCreacionAsc(temaId).stream()
                .map(ComentarioResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public ComentarioResponse obtener(Long id) {
        return ComentarioResponse.desde(buscarEntidad(id));
    }

    @Transactional
    public ComentarioResponse comentar(Long temaId, ComentarioRequest req, UsuarioActual actual) {
        Tema tema = temaService.buscarEntidad(temaId);
        if (tema.getEstado() == EstadoTema.CERRADO) {
            throw ApiException.conflicto("El tema está cerrado y no admite nuevos comentarios");
        }
        Comentario comentario = new Comentario();
        comentario.setTema(tema);
        comentario.setUsuarioId(actual.id());
        comentario.setAutor(actual.nombreUsuario());
        comentario.setContenido(req.contenido().trim());
        Comentario guardado = comentarioRepository.save(comentario);
        log.info("Comentario {} agregado al tema {} por {}", guardado.getId(), temaId, actual.nombreUsuario());
        return ComentarioResponse.desde(guardado);
    }

    /** Solo el autor puede editar su comentario. */
    @Transactional
    public ComentarioResponse actualizar(Long id, ComentarioRequest req, UsuarioActual actual) {
        Comentario comentario = buscarEntidad(id);
        if (!actual.esElMismo(comentario.getUsuarioId())) {
            throw ApiException.prohibido("Solo el autor puede editar el comentario");
        }
        comentario.setContenido(req.contenido().trim());
        comentario.setFechaActualizacion(LocalDateTime.now());
        log.info("Comentario {} editado por {}", id, actual.nombreUsuario());
        return ComentarioResponse.desde(comentario);
    }

    /** El autor elimina su comentario; MODERADOR y ADMIN pueden eliminar cualquiera. */
    @Transactional
    public void eliminar(Long id, UsuarioActual actual) {
        Comentario comentario = buscarEntidad(id);
        if (!actual.esElMismo(comentario.getUsuarioId()) && !actual.puedeModerar()) {
            throw ApiException.prohibido("Solo el autor, un moderador o un administrador pueden eliminar el comentario");
        }
        comentarioRepository.delete(comentario);
        log.info("Comentario {} eliminado por {} ({})", id, actual.nombreUsuario(), actual.rol());
    }

    private Comentario buscarEntidad(Long id) {
        return comentarioRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe el comentario con id " + id));
    }
}
