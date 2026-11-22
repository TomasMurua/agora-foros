package cl.agora.moderacion.service;

import cl.agora.moderacion.client.ContenidoForo;
import cl.agora.moderacion.client.ForoClient;
import cl.agora.moderacion.dto.ReporteCrearRequest;
import cl.agora.moderacion.dto.ReporteResolverRequest;
import cl.agora.moderacion.dto.ReporteResponse;
import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.EstadoReporte;
import cl.agora.moderacion.model.Reporte;
import cl.agora.moderacion.model.TipoContenido;
import cl.agora.moderacion.repository.ReporteRepository;
import cl.agora.moderacion.repository.SancionRepository;
import cl.agora.moderacion.security.UsuarioActual;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteService {

    private final ReporteRepository reporteRepository;
    private final SancionRepository sancionRepository;
    private final NormaService normaService;
    private final ForoClient foroClient;

    /**
     * Cualquier usuario con sesión reporta un tema o comentario. Antes de guardar se confirma
     * en ms-foro que el contenido existe y que quien reporta lo puede ver.
     */
    @Transactional
    public ReporteResponse crear(ReporteCrearRequest req, UsuarioActual actual, String token) {
        Reporte reporte = new Reporte();
        reporte.setNorma(normaService.buscarActiva(req.normaId()));
        if (reporteRepository.existsByTipoContenidoAndContenidoIdAndUsuarioIdAndEstado(
                req.tipoContenido(), req.contenidoId(), actual.id(), EstadoReporte.PENDIENTE)) {
            throw ApiException.conflicto("Ya tiene un reporte pendiente sobre este contenido");
        }
        ContenidoForo contenido = foroClient.obtener(req.tipoContenido(), req.contenidoId(), token);
        if (contenido.autor().equalsIgnoreCase(actual.nombreUsuario())) {
            throw ApiException.solicitudInvalida("No puede reportar su propio contenido");
        }
        reporte.setTipoContenido(req.tipoContenido());
        reporte.setContenidoId(req.contenidoId());
        reporte.setMotivo(req.motivo().trim());
        reporte.setUsuarioId(actual.id());
        reporte.setReportadoPor(actual.nombreUsuario());
        reporte.setEstado(EstadoReporte.PENDIENTE);
        Reporte guardado = reporteRepository.save(reporte);
        log.info("Reporte {} de {} sobre {} {} (norma {})", guardado.getId(), actual.nombreUsuario(),
                req.tipoContenido(), req.contenidoId(), reporte.getNorma().getCodigo());
        return ReporteResponse.desde(guardado);
    }

    @Transactional(readOnly = true)
    public List<ReporteResponse> listar(EstadoReporte estado, TipoContenido tipo, Long contenidoId) {
        return reporteRepository.buscar(estado, tipo, contenidoId).stream().map(ReporteResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<ReporteResponse> mios(UsuarioActual actual) {
        return reporteRepository.findByUsuarioIdOrderByFechaCreacionDesc(actual.id()).stream()
                .map(ReporteResponse::desde).toList();
    }

    /** Un usuario ve sus propios reportes; MODERADOR y ADMIN ven todos. */
    @Transactional(readOnly = true)
    public ReporteResponse obtener(Long id, UsuarioActual actual) {
        Reporte reporte = buscarEntidad(id);
        if (!actual.puedeModerar() && !actual.esElMismo(reporte.getUsuarioId())) {
            throw ApiException.prohibido("Solo puede ver sus propios reportes");
        }
        return ReporteResponse.desde(reporte);
    }

    @Transactional
    public ReporteResponse resolver(Long id, ReporteResolverRequest req, UsuarioActual actual) {
        if (!actual.puedeModerar()) {
            throw ApiException.prohibido("Solo un moderador o un administrador pueden revisar reportes");
        }
        if (req.estado() == EstadoReporte.PENDIENTE) {
            throw ApiException.solicitudInvalida("El reporte se cierra como RESUELTO o DESCARTADO");
        }
        Reporte reporte = buscarEntidad(id);
        if (!reporte.estaPendiente()) {
            throw ApiException.conflicto("El reporte " + id + " ya fue revisado (" + reporte.getEstado() + ")");
        }
        reporte.cerrar(req.estado(), actual.nombreUsuario(), recortar(req.observacion()));
        log.info("Reporte {} marcado {} por {}", id, req.estado(), actual.nombreUsuario());
        return ReporteResponse.desde(reporte);
    }

    /** ADMIN elimina cualquier reporte; el autor puede retirar el suyo mientras está pendiente. */
    @Transactional
    public void eliminar(Long id, UsuarioActual actual) {
        Reporte reporte = buscarEntidad(id);
        boolean autorConPendiente = actual.esElMismo(reporte.getUsuarioId()) && reporte.estaPendiente();
        if (!actual.esAdmin() && !autorConPendiente) {
            throw ApiException.prohibido("Solo un administrador o el autor de un reporte pendiente pueden eliminarlo");
        }
        sancionRepository.desvincularReporte(id);
        reporteRepository.delete(reporte);
        log.info("Reporte {} eliminado por {}", id, actual.nombreUsuario());
    }

    Reporte buscarEntidad(Long id) {
        return reporteRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe el reporte con id " + id));
    }

    private static String recortar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
