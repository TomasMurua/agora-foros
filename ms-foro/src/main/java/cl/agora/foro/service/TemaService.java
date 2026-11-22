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

    /** Los temas baneados solo aparecen si quien consulta es MODERADOR o ADMIN. */
    @Transactional(readOnly = true)
    public List<TemaResponse> buscar(String texto, Long categoriaId, String autor, EstadoTema estado,
                                     UsuarioActual actual) {
        if (categoriaId != null) {
            categoriaService.buscarEntidad(categoriaId);
        }
        boolean verBaneados = puedeModerar(actual);
        List<Tema> temas = temaRepository.buscar(vacioANull(texto), categoriaId, vacioANull(autor),
                        estado == null ? null : estado.name()).stream()
                .filter(t -> verBaneados || !t.estaBaneado())
                .toList();
        log.debug("Búsqueda de temas texto='{}' categoria={} autor='{}' estado={} -> {} resultado(s)",
                texto, categoriaId, autor, estado, temas.size());
        return temas.stream().map(t -> aRespuesta(t, verBaneados)).toList();
    }

    @Transactional(readOnly = true)
    public List<TemaResponse> listarPorCategoria(Long categoriaId, UsuarioActual actual) {
        categoriaService.buscarEntidad(categoriaId);
        boolean verBaneados = puedeModerar(actual);
        return temaRepository.findByCategoriaIdOrderByFechaCreacionDesc(categoriaId).stream()
                .filter(t -> verBaneados || !t.estaBaneado())
                .map(t -> aRespuesta(t, verBaneados)).toList();
    }

    @Transactional(readOnly = true)
    public List<TemaResponse> masVistos(int limite) {
        int tamanio = Math.max(1, Math.min(limite, 20));
        return temaRepository.masVistos(PageRequest.of(0, tamanio)).stream().map(t -> aRespuesta(t, false)).toList();
    }

    /** Visualizar un tema suma una visita. Un tema baneado no existe para quien no modera. */
    @Transactional
    public TemaResponse visualizar(Long id, UsuarioActual actual) {
        Tema tema = buscarVisible(id, actual);
        tema.setVistas(tema.getVistas() + 1);
        return aRespuesta(tema, puedeModerar(actual));
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
        return aRespuesta(guardado, false);
    }

    @Transactional
    public TemaResponse actualizar(Long id, TemaActualizarRequest req, UsuarioActual actual) {
        Tema tema = buscarEntidad(id);
        boolean esAutor = actual.esElMismo(tema.getUsuarioId());
        boolean cambiaContenido = req.titulo() != null || req.contenido() != null || req.categoriaId() != null;

        if (req.estado() == EstadoTema.BANEADO) {
            throw ApiException.solicitudInvalida("El baneo de temas se gestiona desde el servicio de moderación");
        }
        if (tema.estaBaneado()) {
            throw ApiException.conflicto("El tema está baneado por moderación y no se puede modificar");
        }
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
        return aRespuesta(tema, puedeModerar(actual));
    }

    /**
     * Banea o restaura un tema. Lo invoca ms-moderacion con el token del MODERADOR o ADMIN que
     * registra la sanción. Al restaurarlo vuelve a quedar ABIERTO.
     */
    @Transactional
    public TemaResponse cambiarBaneo(Long id, boolean baneado, UsuarioActual actual) {
        if (!puedeModerar(actual)) {
            throw ApiException.prohibido("Solo un moderador o un administrador pueden banear temas");
        }
        Tema tema = buscarEntidad(id);
        if (baneado == tema.estaBaneado()) {
            throw ApiException.conflicto(baneado ? "El tema ya está baneado" : "El tema no está baneado");
        }
        tema.setEstado(baneado ? EstadoTema.BANEADO : EstadoTema.ABIERTO);
        tema.setFechaActualizacion(LocalDateTime.now());
        log.info("Tema {} {} por {} ({})", id, baneado ? "baneado" : "restaurado", actual.nombreUsuario(), actual.rol());
        return aRespuesta(tema, true);
    }

    /**
     * El autor elimina su tema; MODERADOR y ADMIN pueden eliminar cualquiera. Se borran tambien sus comentarios.
     * Si el tema está baneado, el autor recibe 404 igual que al consultarlo.
     */
    @Transactional
    public void eliminar(Long id, UsuarioActual actual) {
        // Un tema baneado no existe para su autor: solo MODERADOR o ADMIN lo pueden eliminar
        Tema tema = buscarVisible(id, actual);
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

    /** Igual que buscarEntidad, pero un tema baneado responde 404 a quien no puede moderar. */
    Tema buscarVisible(Long id, UsuarioActual actual) {
        Tema tema = buscarEntidad(id);
        if (tema.estaBaneado() && !puedeModerar(actual)) {
            throw ApiException.noEncontrado("No existe el tema con id " + id);
        }
        return tema;
    }

    static boolean puedeModerar(UsuarioActual actual) {
        return actual != null && actual.puedeModerar();
    }

    /** Para quien no modera, la cantidad de comentarios no cuenta los baneados. */
    private TemaResponse aRespuesta(Tema t, boolean contarBaneados) {
        long cantidad = contarBaneados
                ? comentarioRepository.countByTemaId(t.getId())
                : comentarioRepository.contarPorTemaYBaneo(t.getId(), Boolean.FALSE);
        return TemaResponse.desde(t, cantidad);
    }

    private static String vacioANull(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
