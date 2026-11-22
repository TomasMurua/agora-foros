package cl.agora.foro;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.agora.foro.dto.ComentarioRequest;
import cl.agora.foro.dto.ComentarioResponse;
import cl.agora.foro.dto.TemaActualizarRequest;
import cl.agora.foro.dto.TemaResponse;
import cl.agora.foro.exception.ApiException;
import cl.agora.foro.model.Categoria;
import cl.agora.foro.model.Comentario;
import cl.agora.foro.model.EstadoTema;
import cl.agora.foro.model.Tema;
import cl.agora.foro.repository.CategoriaRepository;
import cl.agora.foro.repository.ComentarioRepository;
import cl.agora.foro.repository.TemaRepository;
import cl.agora.foro.security.UsuarioActual;
import cl.agora.foro.service.CategoriaService;
import cl.agora.foro.service.ComentarioService;
import cl.agora.foro.service.TemaService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

/** Reglas de ms-foro para el contenido que banea ms-moderacion. */
@ExtendWith(MockitoExtension.class)
class BaneoServiceTest {

    @Mock
    private TemaRepository temaRepository;
    @Mock
    private ComentarioRepository comentarioRepository;
    @Mock
    private CategoriaRepository categoriaRepository;

    private TemaService temaService;
    private ComentarioService comentarioService;

    private final UsuarioActual camila = new UsuarioActual(3L, "camila.diaz", "USUARIO");
    private final UsuarioActual matias = new UsuarioActual(4L, "matias.soto", "USUARIO");
    private final UsuarioActual moderador = new UsuarioActual(2L, "moderador", "MODERADOR");

    @BeforeEach
    void setUp() {
        CategoriaService categoriaService = new CategoriaService(categoriaRepository, temaRepository);
        temaService = new TemaService(temaRepository, comentarioRepository, categoriaService);
        comentarioService = new ComentarioService(comentarioRepository, temaService);
        lenient().when(comentarioRepository.countByTemaId(anyLong())).thenReturn(0L);
        lenient().when(comentarioRepository.contarPorTemaYBaneo(anyLong(), any())).thenReturn(0L);
    }

    @Test
    void laBusquedaOcultaLosTemasBaneadosAlUsuarioPeroNoAlModerador() {
        Tema abierto = tema(1L, camila, EstadoTema.ABIERTO);
        Tema baneado = tema(7L, matias, EstadoTema.BANEADO);
        when(temaRepository.buscar(null, null, null, null)).thenReturn(List.of(abierto, baneado));

        assertThat(temaService.buscar(null, null, null, null, camila)).extracting(TemaResponse::id).containsExactly(1L);
        assertThat(temaService.buscar(null, null, null, null, null)).extracting(TemaResponse::id).containsExactly(1L);
        assertThat(temaService.buscar(null, null, null, null, moderador)).extracting(TemaResponse::id)
                .containsExactly(1L, 7L);
    }

    @Test
    void temaBaneadoResponde404AQuienNoModera() {
        when(temaRepository.findById(7L)).thenReturn(Optional.of(tema(7L, matias, EstadoTema.BANEADO)));

        assertThatThrownBy(() -> temaService.visualizar(7L, camila))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(temaService.visualizar(7L, moderador).estado()).isEqualTo(EstadoTema.BANEADO);
    }

    @Test
    void moderadorBaneaYRestauraUnTema() {
        Tema tema = tema(2L, matias, EstadoTema.ABIERTO);
        when(temaRepository.findById(2L)).thenReturn(Optional.of(tema));

        assertThat(temaService.cambiarBaneo(2L, true, moderador).estado()).isEqualTo(EstadoTema.BANEADO);
        assertThat(temaService.cambiarBaneo(2L, false, moderador).estado()).isEqualTo(EstadoTema.ABIERTO);
    }

    @Test
    void banearDosVecesElMismoTemaDevuelve409() {
        when(temaRepository.findById(7L)).thenReturn(Optional.of(tema(7L, matias, EstadoTema.BANEADO)));

        assertThatThrownBy(() -> temaService.cambiarBaneo(7L, true, moderador))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void unUsuarioNoPuedeBanear() {
        assertThatThrownBy(() -> temaService.cambiarBaneo(2L, true, camila))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        verify(temaRepository, never()).findById(any());
    }

    @Test
    void elEstadoBaneadoNoSePuedePonerConElPutNormal() {
        when(temaRepository.findById(1L)).thenReturn(Optional.of(tema(1L, camila, EstadoTema.ABIERTO)));

        assertThatThrownBy(() -> temaService.actualizar(1L,
                new TemaActualizarRequest(null, null, null, EstadoTema.BANEADO), moderador))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void elAutorNoPuedeReabrirSuTemaBaneado() {
        when(temaRepository.findById(7L)).thenReturn(Optional.of(tema(7L, matias, EstadoTema.BANEADO)));

        assertThatThrownBy(() -> temaService.actualizar(7L,
                new TemaActualizarRequest(null, null, null, EstadoTema.ABIERTO), matias))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void unModeradorNoPuedeComentarUnTemaBaneado() {
        when(temaRepository.findById(7L)).thenReturn(Optional.of(tema(7L, matias, EstadoTema.BANEADO)));

        assertThatThrownBy(() -> comentarioService.comentar(7L, new ComentarioRequest("Hola"), moderador))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
        verify(comentarioRepository, never()).save(any());
    }

    @Test
    void losComentariosBaneadosSoloLosVeElModerador() {
        Tema tema = tema(1L, camila, EstadoTema.ABIERTO);
        Comentario visible = comentario(1L, tema, false);
        Comentario baneado = comentario(2L, tema, true);
        when(temaRepository.findById(1L)).thenReturn(Optional.of(tema));
        when(comentarioRepository.findByTemaIdOrderByFechaCreacionAsc(1L)).thenReturn(List.of(visible, baneado));

        assertThat(comentarioService.listarPorTema(1L, camila)).extracting(ComentarioResponse::id).containsExactly(1L);
        assertThat(comentarioService.listarPorTema(1L, moderador)).extracting(ComentarioResponse::id)
                .containsExactly(1L, 2L);
    }

    @Test
    void moderadorBaneaUnComentario() {
        Tema tema = tema(1L, camila, EstadoTema.ABIERTO);
        when(comentarioRepository.findById(3L)).thenReturn(Optional.of(comentario(3L, tema, false)));

        assertThat(comentarioService.cambiarBaneo(3L, true, moderador).baneado()).isTrue();
    }

    private static Tema tema(Long id, UsuarioActual autor, EstadoTema estado) {
        Categoria c = new Categoria();
        c.setId(1L);
        c.setNombre("Videojuegos");
        Tema t = new Tema();
        t.setId(id);
        t.setCategoria(c);
        t.setUsuarioId(autor.id());
        t.setAutor(autor.nombreUsuario());
        t.setTitulo("Tema " + id);
        t.setContenido("Contenido del tema " + id);
        t.setEstado(estado);
        t.setVistas(0L);
        return t;
    }

    private static Comentario comentario(Long id, Tema tema, boolean baneado) {
        Comentario c = new Comentario();
        c.setId(id);
        c.setTema(tema);
        c.setUsuarioId(4L);
        c.setAutor("matias.soto");
        c.setContenido("Comentario " + id);
        c.setBaneado(baneado);
        return c;
    }
}
