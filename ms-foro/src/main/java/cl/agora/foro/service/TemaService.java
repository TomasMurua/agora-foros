package cl.agora.foro.service;

import cl.agora.foro.dto.TemaActualizarRequest;
import cl.agora.foro.dto.TemaCrearRequest;
import cl.agora.foro.dto.TemaResponse;
import cl.agora.foro.exception.ApiException;
import cl.agora.foro.model.EstadoTema;
import cl.agora.foro.model.Tema;
import cl.agora.foro.repository.ComentarioRepository;
import cl.agora.foro.repository.TemaRepository;
import cl.agora.foro.security.UsuarioActual;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TemaService {

    private final TemaRepository temaRepository;
    private final ComentarioRepository comentarioRepository;
    private final CategoriaService categoriaService;

    @Transactional(readOnly = true)
    public List<TemaResponse> buscar(String texto, Long categoriaId, String autor, EstadoTema estado) {
        if (categoriaId != null) {
            categoriaService.buscarEntidad(categoriaId);
        }
        List<Tema> temas = temaRepository.buscar(vacioANull(texto), categoriaId, vacioANull(autor), estado);
        log.debug("Búsqueda de temas texto='{}' categoria={} autor='{}' estado={} -> {} resultado(s)",
                texto, categoriaId, autor, estado, temas.size());
        return temas.stream().map(this::aRespuesta).toList();
    }

    @Transactional(readOnly = true)
    public List<TemaResponse> listarPorCategoria(Long categoriaId) {
        categoriaService.buscarEntidad(categoriaId);
        return temaRepository.findByCategoriaIdOrderByFechaCreacionDesc(categoriaId).stream()
                .map(this::aRespuesta).toList();
    }

    @Transactional(readOnly = true)
    public List<TemaResponse> masVistos(int limite) {
        int tamanio = Math.max(1, Math.min(limite, 20));
        return temaRepository.masVistos(PageRequest.of(0, tamanio)).stream().map(this::aRespuesta).toList();
    }

    /** Visualizar un tema suma una visita. */
    @Transactional
    public TemaResponse visualizar(Long id) {
        Tema tema = buscarEntidad(id);
        tema.setVistas(tema.getVistas() + 1);
        return aRespuesta(tema);
    }

    @Transactional(readOnly = true)
    public TemaResponse obtener(Long id) {
        return aRespuesta(buscarEntidad(id));
    }

    @Transactional
    public TemaResponse publicar(TemaCrearRequest req, UsuarioActual actual) {
        Tema tema = new Tema();
        tema.setCategoria(categoriaService.buscarEntidad(req.categoriaId()));
        tema.setUsuarioId(actual.id());
        tema.setAutor(actual.nombreUsuario());
        tema.setTitulo(req.titulo().trim());
        tema.setContenido(req.contenido().trim());
        tema.setEstado(EstadoTema.ABIERTO);
        tema.setVistas(0L);
        Tema guardado = temaRepository.save(tema);
        log.info("Tema publicado: '{}' (id {}) por {}", guardado.getTitulo(), guardado.getId(), actual.nombreUsuario());
        return aRespuesta(guardado);
    }

    @Transactional
    public TemaResponse actualizar(Long id, TemaActualizarRequest req, UsuarioActual actual) {
        Tema tema = buscarEntidad(id);
        boolean esAutor = actual.esElMismo(tema.getUsuarioId());
        boolean cambiaContenido = req.titulo() != null || req.contenido() != null || req.categoriaId() != null;

        if (cambiaContenido && !esAutor) {
            throw ApiException.prohibido("Solo el autor puede modificar el título, el contenido o la categoría del tema");
        }
        if (req.estado() != null && !esAutor && !actual.puedeModerar()) {
            throw ApiException.prohibido("Solo el autor, un moderador o un administrador pueden abrir o cerrar el tema");
        }
        if (req.categoriaId() != null) {
            tema.setCategoria(categoriaService.buscarEntidad(req.categoriaId()));
        }
        if (req.titulo() != null) {
            tema.setTitulo(req.titulo().trim());
        }
        if (req.contenido() != null) {
            tema.setContenido(req.contenido().trim());
        }
        if (req.estado() != null) {
            tema.setEstado(req.estado());
        }
        tema.setFechaActualizacion(LocalDateTime.now());
        log.info("Tema {} actualizado por {}", id, actual.nombreUsuario());
        return aRespuesta(tema);
    }

    /** El autor elimina su tema; MODERADOR y ADMIN pueden eliminar cualquiera. Se borran tambien sus comentarios. */
    @Transactional
    public void eliminar(Long id, UsuarioActual actual) {
        Tema tema = buscarEntidad(id);
        if (!actual.esElMismo(tema.getUsuarioId()) && !actual.puedeModerar()) {
            throw ApiException.prohibido("Solo el autor, un moderador o un administrador pueden eliminar el tema");
        }
        int comentarios = comentarioRepository.eliminarPorTema(id);
        temaRepository.delete(tema);
        log.info("Tema {} eliminado por {} ({}), junto con {} comentario(s)",
                id, actual.nombreUsuario(), actual.rol(), comentarios);
    }

    Tema buscarEntidad(Long id) {
        return temaRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe el tema con id " + id));
    }

    private TemaResponse aRespuesta(Tema t) {
        return TemaResponse.desde(t, comentarioRepository.countByTemaId(t.getId()));
    }

    private static String vacioANull(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
