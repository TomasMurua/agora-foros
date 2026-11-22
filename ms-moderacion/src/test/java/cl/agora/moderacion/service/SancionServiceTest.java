package cl.agora.moderacion.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.agora.moderacion.client.ContenidoForo;
import cl.agora.moderacion.client.ForoClient;
import cl.agora.moderacion.dto.SancionRequest;
import cl.agora.moderacion.dto.SancionResponse;
import cl.agora.moderacion.exception.ApiException;
import cl.agora.moderacion.model.EstadoReporte;
import cl.agora.moderacion.model.Gravedad;
import cl.agora.moderacion.model.Norma;
import cl.agora.moderacion.model.Reporte;
import cl.agora.moderacion.model.Sancion;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import cl.agora.moderacion.repository.NormaRepository;
import cl.agora.moderacion.repository.ReporteRepository;
import cl.agora.moderacion.repository.SancionRepository;
import cl.agora.moderacion.security.UsuarioActual;
import cl.agora.moderacion.strategy.AccionModeracionFactory;
import cl.agora.moderacion.strategy.BanearComentarioStrategy;
import cl.agora.moderacion.strategy.BanearTemaStrategy;
import cl.agora.moderacion.strategy.RestaurarComentarioStrategy;
import cl.agora.moderacion.strategy.RestaurarTemaStrategy;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class SancionServiceTest {

    @Mock
    private SancionRepository sancionRepository;
    @Mock
    private ReporteRepository reporteRepository;
    @Mock
    private NormaRepository normaRepository;
    @Mock
    private ForoClient foroClient;

    private SancionService sancionService;

    private final UsuarioActual moderador = new UsuarioActual(2L, "moderador", "MODERADOR");
    private final UsuarioActual camila = new UsuarioActual(3L, "camila.diaz", "USUARIO");
    private static final String TOKEN = "Bearer token-del-moderador";

    @BeforeEach
    void setUp() {
        NormaService normaService = new NormaService(normaRepository, reporteRepository, sancionRepository);
        ReporteService reporteService = new ReporteService(reporteRepository, sancionRepository, normaService, foroClient);
        AccionModeracionFactory factory = new AccionModeracionFactory(List.of(
                new BanearTemaStrategy(foroClient), new RestaurarTemaStrategy(foroClient),
                new BanearComentarioStrategy(foroClient), new RestaurarComentarioStrategy(foroClient)));
        sancionService = new SancionService(sancionRepository, reporteRepository, normaService, reporteService, factory);
    }

    @Test
    void banearUnTemaLlamaAMsForoConElTokenYResuelveLosReportesPendientes() {
        when(normaRepository.findById(2L)).thenReturn(Optional.of(norma(2L, "N2", true)));
        when(sancionRepository.saveAndFlush(any(Sancion.class))).thenAnswer(inv -> {
            Sancion s = inv.getArgument(0);
            s.setId(10L);
            return s;
        });
        Reporte pendiente = reporte(1L, TipoContenido.TEMA, 2L);
        when(reporteRepository.findByTipoContenidoAndContenidoIdAndEstado(TipoContenido.TEMA, 2L, EstadoReporte.PENDIENTE))
                .thenReturn(List.of(pendiente));
        when(foroClient.cambiarBaneo(TipoContenido.TEMA, 2L, true, TOKEN))
                .thenReturn(new ContenidoForo(TipoContenido.TEMA, 2L, "matias.soto", "Busco grupo", true));

        SancionResponse r = sancionService.registrar(
                new SancionRequest(TipoContenido.TEMA, 2L, TipoAccion.BANEAR, 2L, "Publicidad de un servidor", null),
                moderador, TOKEN);

        assertThat(r.id()).isEqualTo(10L);
        assertThat(r.moderador()).isEqualTo("moderador");
        assertThat(r.resultado()).contains("baneado");
        assertThat(pendiente.getEstado()).isEqualTo(EstadoReporte.RESUELTO);
        assertThat(pendiente.getResueltoPor()).isEqualTo("moderador");
        verify(foroClient).cambiarBaneo(TipoContenido.TEMA, 2L, true, TOKEN);
    }

    @Test
    void banearSinNormaDevuelve400YNoLlamaAMsForo() {
        assertThatThrownBy(() -> sancionService.registrar(
                new SancionRequest(TipoContenido.COMENTARIO, 3L, TipoAccion.BANEAR, null, "Comentario ofensivo", null),
                moderador, TOKEN))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
        verify(foroClient, never()).cambiarBaneo(any(), anyLong(), anyBoolean(), any());
        verify(sancionRepository, never()).saveAndFlush(any());
    }

    @Test
    void restaurarNoExigeNorma() {
        when(sancionRepository.saveAndFlush(any(Sancion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(foroClient.cambiarBaneo(TipoContenido.COMENTARIO, 4L, false, TOKEN))
                .thenReturn(new ContenidoForo(TipoContenido.COMENTARIO, 4L, "matias.soto", "Series", false));

        SancionResponse r = sancionService.registrar(
                new SancionRequest(TipoContenido.COMENTARIO, 4L, TipoAccion.RESTAURAR, null, "Apelación aceptada", null),
                moderador, TOKEN);

        assertThat(r.accion()).isEqualTo(TipoAccion.RESTAURAR);
        assertThat(r.normaId()).isNull();
    }

    @Test
    void unUsuarioNoPuedeSancionar() {
        assertThatThrownBy(() -> sancionService.registrar(
                new SancionRequest(TipoContenido.TEMA, 2L, TipoAccion.BANEAR, 2L, "No me gusta este tema", null),
                camila, TOKEN))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void unaNormaDesactivadaNoSirveParaBanear() {
        when(normaRepository.findById(9L)).thenReturn(Optional.of(norma(9L, "N9", false)));

        assertThatThrownBy(() -> sancionService.registrar(
                new SancionRequest(TipoContenido.TEMA, 2L, TipoAccion.BANEAR, 9L, "Norma antigua del foro", null),
                moderador, TOKEN))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void elReporteIndicadoDebeSerDelMismoContenido() {
        when(normaRepository.findById(1L)).thenReturn(Optional.of(norma(1L, "N1", true)));
        when(reporteRepository.findById(5L)).thenReturn(Optional.of(reporte(5L, TipoContenido.COMENTARIO, 3L)));

        assertThatThrownBy(() -> sancionService.registrar(
                new SancionRequest(TipoContenido.TEMA, 2L, TipoAccion.BANEAR, 1L, "Contenido ofensivo", 5L),
                moderador, TOKEN))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void siMsForoRechazaLaAccionLaExcepcionLlegaAlControlador() {
        when(normaRepository.findById(2L)).thenReturn(Optional.of(norma(2L, "N2", true)));
        when(sancionRepository.saveAndFlush(any(Sancion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(foroClient.cambiarBaneo(TipoContenido.TEMA, 99L, true, TOKEN))
                .thenThrow(ApiException.noEncontrado("No existe el tema con id 99 en el foro"));

        assertThatThrownBy(() -> sancionService.registrar(
                new SancionRequest(TipoContenido.TEMA, 99L, TipoAccion.BANEAR, 2L, "Tema que no existe", null),
                moderador, TOKEN))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
    }

    private static Norma norma(Long id, String codigo, boolean activa) {
        Norma n = new Norma();
        n.setId(id);
        n.setCodigo(codigo);
        n.setTitulo("Norma " + codigo);
        n.setDescripcion("Descripción de la norma " + codigo);
        n.setGravedad(Gravedad.MEDIA);
        n.setActiva(activa);
        return n;
    }

    private static Reporte reporte(Long id, TipoContenido tipo, Long contenidoId) {
        Reporte r = new Reporte();
        r.setId(id);
        r.setTipoContenido(tipo);
        r.setContenidoId(contenidoId);
        r.setNorma(norma(1L, "N1", true));
        r.setMotivo("Motivo del reporte");
        r.setUsuarioId(3L);
        r.setReportadoPor("camila.diaz");
        r.setEstado(EstadoReporte.PENDIENTE);
        return r;
    }
}
