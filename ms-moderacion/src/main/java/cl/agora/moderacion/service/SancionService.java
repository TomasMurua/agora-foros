package cl.agora.moderacion.service;

import cl.agora.moderacion.client.ContenidoForo;
import cl.agora.moderacion.dto.SancionActualizarRequest;
import cl.agora.moderacion.dto.SancionRequest;
import cl.agora.moderacion.dto.SancionResponse;
import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.EstadoReporte;
import cl.agora.moderacion.model.Reporte;
import cl.agora.moderacion.model.Sancion;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import cl.agora.moderacion.repository.ReporteRepository;
import cl.agora.moderacion.repository.SancionRepository;
import cl.agora.moderacion.security.UsuarioActual;
import cl.agora.moderacion.strategy.AccionModeracionFactory;
import cl.agora.moderacion.strategy.AccionModeracionStrategy;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SancionService {

    private final SancionRepository sancionRepository;
    private final ReporteRepository reporteRepository;
    private final NormaService normaService;
    private final ReporteService reporteService;
    private final AccionModeracionFactory factory;

    /**
     * Registra la sanción y ejecuta la acción en ms-foro con la estrategia que entrega la fábrica.
     * La sanción se guarda primero y la llamada a ms-foro va al final de la transacción: si ms-foro
     * rechaza la acción, la excepción deshace también la sanción y los reportes cerrados.
     */
    @Transactional
    public SancionResponse registrar(SancionRequest req, UsuarioActual actual, String token) {
        if (!actual.puedeModerar()) {
            throw ApiException.prohibido("Solo un moderador o un administrador pueden sancionar contenido");
        }
        AccionModeracionStrategy estrategia = factory.obtener(req.tipoContenido(), req.accion());

        Sancion sancion = new Sancion();
        sancion.setTipoContenido(req.tipoContenido());
        sancion.setContenidoId(req.contenidoId());
        sancion.setAccion(req.accion());
        if (req.normaId() != null) {
            sancion.setNorma(normaService.buscarActiva(req.normaId()));
        } else if (estrategia.requiereNorma()) {
            throw ApiException.solicitudInvalida("Para banear hay que indicar la norma que no se cumplió (normaId)");
        }
        sancion.setMotivo(req.motivo().trim());
        sancion.setModeradorId(actual.id());
        sancion.setModerador(actual.nombreUsuario());
        if (req.reporteId() != null) {
            sancion.setReporte(reporteValido(req));
        }
        Sancion guardada = sancionRepository.saveAndFlush(sancion);
        cerrarReportes(guardada, actual);

        ContenidoForo contenido = estrategia.ejecutar(req.contenidoId(), token);
        log.info("Sanción {}: {} {} {} por {}", guardada.getId(), req.accion(), req.tipoContenido(),
                req.contenidoId(), actual.nombreUsuario());
        return SancionResponse.desde(guardada, contenido.descripcion());
    }

    @Transactional(readOnly = true)
    public List<SancionResponse> listar(TipoContenido tipo, Long contenidoId, TipoAccion accion) {
        return sancionRepository.buscar(tipo, contenidoId, accion).stream().map(SancionResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public SancionResponse obtener(Long id) {
        return SancionResponse.desde(buscarEntidad(id));
    }

    /** Solo ADMIN corrige el motivo o la norma. La acción ya ejecutada en ms-foro no cambia. */
    @Transactional
    public SancionResponse actualizar(Long id, SancionActualizarRequest req, UsuarioActual actual) {
        if (!actual.esAdmin()) {
            throw ApiException.prohibido("Solo un administrador puede corregir una sanción");
        }
        Sancion sancion = buscarEntidad(id);
        sancion.setMotivo(req.motivo().trim());
        if (req.normaId() != null) {
            sancion.setNorma(normaService.buscarEntidad(req.normaId()));
        } else if (sancion.getAccion() == TipoAccion.BANEAR) {
            throw ApiException.solicitudInvalida("Un baneo debe mantener la norma que no se cumplió");
        } else {
            sancion.setNorma(null);
        }
        log.info("Sanción {} corregida por {}", id, actual.nombreUsuario());
        return SancionResponse.desde(sancion);
    }

    /** Borra el registro del historial. No deshace la acción en ms-foro (para eso se registra RESTAURAR). */
    @Transactional
    public void eliminar(Long id, UsuarioActual actual) {
        if (!actual.esAdmin()) {
            throw ApiException.prohibido("Solo un administrador puede eliminar sanciones del historial");
        }
        Sancion sancion = buscarEntidad(id);
        sancionRepository.delete(sancion);
        log.info("Sanción {} eliminada del historial por {}", id, actual.nombreUsuario());
    }

    private Reporte reporteValido(SancionRequest req) {
        Reporte reporte = reporteService.buscarEntidad(req.reporteId());
        if (reporte.getTipoContenido() != req.tipoContenido() || !reporte.getContenidoId().equals(req.contenidoId())) {
            throw ApiException.solicitudInvalida("El reporte " + reporte.getId() + " es sobre otro contenido");
        }
        if (!reporte.estaPendiente()) {
            throw ApiException.conflicto("El reporte " + reporte.getId() + " ya fue revisado");
        }
        return reporte;
    }

    /**
     * Un baneo resuelve todos los reportes pendientes del mismo contenido. Una restauración solo
     * cierra el reporte que se indicó.
     */
    private void cerrarReportes(Sancion sancion, UsuarioActual actual) {
        String observacion = "Sanción " + sancion.getId() + ": " + sancion.getAccion();
        if (sancion.getAccion() == TipoAccion.BANEAR) {
            List<Reporte> pendientes = reporteRepository.findByTipoContenidoAndContenidoIdAndEstado(
                    sancion.getTipoContenido(), sancion.getContenidoId(), EstadoReporte.PENDIENTE);
            pendientes.forEach(r -> r.cerrar(EstadoReporte.RESUELTO, actual.nombreUsuario(), observacion));
            if (!pendientes.isEmpty()) {
                log.info("{} reporte(s) pendiente(s) resuelto(s) con la sanción {}", pendientes.size(), sancion.getId());
            }
        } else if (sancion.getReporte() != null) {
            sancion.getReporte().cerrar(EstadoReporte.RESUELTO, actual.nombreUsuario(), observacion);
        }
    }

    private Sancion buscarEntidad(Long id) {
        return sancionRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe la sanción con id " + id));
    }
}
