package cl.agora.moderacion.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.agora.moderacion.client.ContenidoForo;
import cl.agora.moderacion.client.ForoClient;
import cl.agora.moderacion.dto.ReporteCrearRequest;
import cl.agora.moderacion.dto.ReporteResolverRequest;
import cl.agora.moderacion.dto.ReporteResponse;
import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.EstadoReporte;
import cl.agora.moderacion.model.Gravedad;
import cl.agora.moderacion.model.Norma;
import cl.agora.moderacion.model.Reporte;
import cl.agora.moderacion.model.TipoContenido;
import cl.agora.moderacion.repository.NormaRepository;
import cl.agora.moderacion.repository.ReporteRepository;
import cl.agora.moderacion.repository.SancionRepository;
import cl.agora.moderacion.security.UsuarioActual;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock
    private ReporteRepository reporteRepository;
    @Mock
    private SancionRepository sancionRepository;
    @Mock
    private NormaRepository normaRepository;
    @Mock
    private ForoClient foroClient;

    private ReporteService reporteService;

    private final UsuarioActual camila = new UsuarioActual(3L, "camila.diaz", "USUARIO");
    private final UsuarioActual matias = new UsuarioActual(4L, "matias.soto", "USUARIO");
    private final UsuarioActual moderador = new UsuarioActual(2L, "moderador", "MODERADOR");

    @BeforeEach
    void setUp() {
        NormaService normaService = new NormaService(normaRepository, reporteRepository, sancionRepository);
        reporteService = new ReporteService(reporteRepository, sancionRepository, normaService, foroClient);
    }

    @Test
    void crearConfirmaQueElContenidoExisteYGuardaAlAutorDelToken() {
        when(normaRepository.findById(1L)).thenReturn(Optional.of(norma()));
        when(foroClient.obtener(TipoContenido.COMENTARIO, 3L, "Bearer t"))
                .thenReturn(new ContenidoForo(TipoContenido.COMENTARIO, 3L, "camila.diaz", "Me sumo", false));
        when(reporteRepository.save(any(Reporte.class))).thenAnswer(inv -> {
            Reporte r = inv.getArgument(0);
            r.setId(8L);
            return r;
        });

        ReporteResponse r = reporteService.crear(
                new ReporteCrearRequest(TipoContenido.COMENTARIO, 3L, 1L, "Lenguaje ofensivo en el comentario"),
                matias, "Bearer t");

        assertThat(r.reportadoPor()).isEqualTo("matias.soto");
        assertThat(r.estado()).isEqualTo(EstadoReporte.PENDIENTE);
    }

    @Test
    void noSePuedeReportarDosVecesLoMismoMientrasEstaPendiente() {
        when(normaRepository.findById(1L)).thenReturn(Optional.of(norma()));
        when(reporteRepository.existsByTipoContenidoAndContenidoIdAndUsuarioIdAndEstado(
                TipoContenido.TEMA, 2L, 3L, EstadoReporte.PENDIENTE)).thenReturn(true);

        assertThatThrownBy(() -> reporteService.crear(
                new ReporteCrearRequest(TipoContenido.TEMA, 2L, 1L, "Sigue siendo publicidad"), camila, "Bearer t"))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
        verify(reporteRepository, never()).save(any());
    }

    @Test
    void moderadorDescartaUnReportePendiente() {
        when(reporteRepository.findById(2L)).thenReturn(Optional.of(reporte(EstadoReporte.PENDIENTE)));

        ReporteResponse r = reporteService.resolver(2L,
                new ReporteResolverRequest(EstadoReporte.DESCARTADO, "El comentario cumple las normas"), moderador);

        assertThat(r.estado()).isEqualTo(EstadoReporte.DESCARTADO);
        assertThat(r.resueltoPor()).isEqualTo("moderador");
        assertThat(r.fechaResolucion()).isNotNull();
    }

    @Test
    void unReporteRevisadoNoSeVuelveAResolver() {
        when(reporteRepository.findById(3L)).thenReturn(Optional.of(reporte(EstadoReporte.RESUELTO)));

        assertThatThrownBy(() -> reporteService.resolver(3L,
                new ReporteResolverRequest(EstadoReporte.DESCARTADO, null), moderador))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void unUsuarioNoVeReportesAjenos() {
        when(reporteRepository.findById(2L)).thenReturn(Optional.of(reporte(EstadoReporte.PENDIENTE)));

        assertThatThrownBy(() -> reporteService.obtener(2L, camila))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(reporteService.obtener(2L, matias).id()).isEqualTo(2L);
    }

    @Test
    void elAutorRetiraSuReportePendiente() {
        Reporte reporte = reporte(EstadoReporte.PENDIENTE);
        when(reporteRepository.findById(2L)).thenReturn(Optional.of(reporte));

        reporteService.eliminar(2L, matias);

        verify(sancionRepository).desvincularReporte(2L);
        verify(reporteRepository).delete(reporte);
    }

    private static Norma norma() {
        Norma n = new Norma();
        n.setId(1L);
        n.setCodigo("N1");
        n.setTitulo("Respeto entre usuarios");
        n.setDescripcion("Sin insultos ni acoso");
        n.setGravedad(Gravedad.ALTA);
        n.setActiva(true);
        return n;
    }

    private static Reporte reporte(EstadoReporte estado) {
        Reporte r = new Reporte();
        r.setId(2L);
        r.setTipoContenido(TipoContenido.COMENTARIO);
        r.setContenidoId(3L);
        r.setNorma(norma());
        r.setMotivo("Comentario ofensivo");
        r.setUsuarioId(4L);
        r.setReportadoPor("matias.soto");
        r.setEstado(estado);
        return r;
    }
}
