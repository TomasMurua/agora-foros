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

    /** Los comentarios baneados solo los ven MODERADOR y ADMIN. */
    @Transactional(readOnly = true)
    public List<ComentarioResponse> listarPorTema(Long temaId, UsuarioActual actual) {
        temaService.buscarVisible(temaId, actual);
        boolean verBaneados = TemaService.puedeModerar(actual);
        return comentarioRepository.findByTemaIdOrderByFechaCreacionAsc(temaId).stream()
                .filter(c -> verBaneados || !c.estaBaneado())
                .map(ComentarioResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public ComentarioResponse obtener(Long id, UsuarioActual actual) {
        Comentario comentario = buscarEntidad(id);
        boolean verBaneados = TemaService.puedeModerar(actual);
        if (!verBaneados && (comentario.estaBaneado() || comentario.getTema().estaBaneado())) {
            throw ApiException.noEncontrado("No existe el comentario con id " + id);
        }
        return ComentarioResponse.desde(comentario);
    }

    @Transactional
    public ComentarioResponse comentar(Long temaId, ComentarioRequest req, UsuarioActual actual) {
        Tema tema = temaService.buscarVisible(temaId, actual);
        if (tema.getEstado() == EstadoTema.CERRADO) {
            throw ApiException.conflicto("El tema está cerrado y no admite nuevos comentarios");
        }
        if (tema.estaBaneado()) {
            throw ApiException.conflicto("El tema está baneado por moderación y no admite comentarios");
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
        if (comentario.estaBaneado()) {
            throw ApiException.conflicto("El comentario está baneado por moderación y no se puede editar");
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
        if (comentario.estaBaneado() && !TemaService.puedeModerar(actual)) {
            throw ApiException.noEncontrado("No existe el comentario con id " + id);
        }
        if (!actual.esElMismo(comentario.getUsuarioId()) && !actual.puedeModerar()) {
            throw ApiException.prohibido("Solo el autor, un moderador o un administrador pueden eliminar el comentario");
        }
        comentarioRepository.delete(comentario);
        log.info("Comentario {} eliminado por {} ({})", id, actual.nombreUsuario(), actual.rol());
    }

    /** Banea o restaura un comentario. Lo invoca ms-moderacion con el token del moderador. */
    @Transactional
    public ComentarioResponse cambiarBaneo(Long id, boolean baneado, UsuarioActual actual) {
        if (!TemaService.puedeModerar(actual)) {
            throw ApiException.prohibido("Solo un moderador o un administrador pueden banear comentarios");
        }
        Comentario comentario = buscarEntidad(id);
        if (baneado == comentario.estaBaneado()) {
            throw ApiException.conflicto(baneado ? "El comentario ya está baneado" : "El comentario no está baneado");
        }
        comentario.setBaneado(baneado);
        comentario.setFechaActualizacion(LocalDateTime.now());
        log.info("Comentario {} {} por {} ({})", id, baneado ? "baneado" : "restaurado",
                actual.nombreUsuario(), actual.rol());
        return ComentarioResponse.desde(comentario);
    }

    private Comentario buscarEntidad(Long id) {
        return comentarioRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe el comentario con id " + id));
    }
}
