package cl.agora.moderacion.service;

import cl.agora.moderacion.dto.NormaRequest;
import cl.agora.moderacion.dto.NormaResponse;
import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.Norma;
import cl.agora.moderacion.repository.NormaRepository;
import cl.agora.moderacion.repository.ReporteRepository;
import cl.agora.moderacion.repository.SancionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NormaService {

    private final NormaRepository normaRepository;
    private final ReporteRepository reporteRepository;
    private final SancionRepository sancionRepository;

    @Transactional(readOnly = true)
    public List<NormaResponse> listar(boolean soloActivas) {
        List<Norma> normas = soloActivas
                ? normaRepository.findByActivaOrderByCodigoAsc(Boolean.TRUE)
                : normaRepository.findAllByOrderByCodigoAsc();
        return normas.stream().map(NormaResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public NormaResponse obtener(Long id) {
        return NormaResponse.desde(buscarEntidad(id));
    }

    @Transactional
    public NormaResponse crear(NormaRequest req) {
        String codigo = req.codigo().trim().toUpperCase();
        if (normaRepository.existsByCodigoIgnoreCase(codigo)) {
            throw ApiException.conflicto("Ya existe una norma con el código " + codigo);
        }
        Norma norma = new Norma();
        aplicar(norma, req, codigo);
        Norma guardada = normaRepository.save(norma);
        log.info("Norma {} creada: {}", guardada.getCodigo(), guardada.getTitulo());
        return NormaResponse.desde(guardada);
    }

    @Transactional
    public NormaResponse actualizar(Long id, NormaRequest req) {
        Norma norma = buscarEntidad(id);
        String codigo = req.codigo().trim().toUpperCase();
        if (normaRepository.existsByCodigoIgnoreCaseAndIdNot(codigo, id)) {
            throw ApiException.conflicto("Ya existe otra norma con el código " + codigo);
        }
        aplicar(norma, req, codigo);
        log.info("Norma {} actualizada", norma.getCodigo());
        return NormaResponse.desde(norma);
    }

    /** Una norma citada en reportes o sanciones no se borra: se desactiva con PUT activa=false. */
    @Transactional
    public void eliminar(Long id) {
        Norma norma = buscarEntidad(id);
        if (reporteRepository.existsByNormaId(id) || sancionRepository.existsByNormaId(id)) {
            throw ApiException.conflicto("La norma " + norma.getCodigo()
                    + " tiene reportes o sanciones asociadas. Desactívela en lugar de eliminarla");
        }
        normaRepository.delete(norma);
        log.info("Norma {} eliminada", norma.getCodigo());
    }

    Norma buscarEntidad(Long id) {
        return normaRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe la norma con id " + id));
    }

    /** Para reportar o banear solo sirven las normas activas. */
    Norma buscarActiva(Long id) {
        Norma norma = buscarEntidad(id);
        if (!norma.estaActiva()) {
            throw ApiException.conflicto("La norma " + norma.getCodigo() + " está desactivada");
        }
        return norma;
    }

    private static void aplicar(Norma norma, NormaRequest req, String codigo) {
        norma.setCodigo(codigo);
        norma.setTitulo(req.titulo().trim());
        norma.setDescripcion(req.descripcion().trim());
        norma.setGravedad(req.gravedad());
        if (req.activa() != null) {
            norma.setActiva(req.activa());
        }
    }
}
