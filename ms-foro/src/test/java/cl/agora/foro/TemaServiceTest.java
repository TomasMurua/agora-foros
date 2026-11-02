package cl.agora.foro;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.agora.foro.dto.ComentarioRequest;
import cl.agora.foro.dto.TemaActualizarRequest;
import cl.agora.foro.dto.TemaCrearRequest;
import cl.agora.foro.dto.TemaResponse;
import cl.agora.foro.exception.ApiException;
import cl.agora.foro.model.Categoria;
import cl.agora.foro.model.EstadoTema;
import cl.agora.foro.model.Tema;
import cl.agora.foro.repository.CategoriaRepository;
import cl.agora.foro.repository.ComentarioRepository;
import cl.agora.foro.repository.TemaRepository;
import cl.agora.foro.security.UsuarioActual;
import cl.agora.foro.service.CategoriaService;
import cl.agora.foro.service.ComentarioService;
import cl.agora.foro.service.TemaService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class TemaServiceTest {

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
    }

    @Test
    void publicarTomaElAutorDelToken() {
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(categoria(2L)));
        when(temaRepository.save(any(Tema.class))).thenAnswer(inv -> {
            Tema t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        TemaResponse r = temaService.publicar(new TemaCrearRequest(2L, "Torneo de diciembre", "Contenido del tema"), camila);

        assertThat(r.usuarioId()).isEqualTo(3L);
        assertThat(r.autor()).isEqualTo("camila.diaz");
        assertThat(r.estado()).isEqualTo(EstadoTema.ABIERTO);
    }

    @Test
    void publicarEnCategoriaInexistenteDevuelve404() {
        when(categoriaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> temaService.publicar(new TemaCrearRequest(99L, "Titulo valido", "Contenido valido"), camila))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void otroUsuarioNoPuedeEditarElContenido() {
        when(temaRepository.findById(1L)).thenReturn(Optional.of(tema(1L, camila)));

        assertThatThrownBy(() -> temaService.actualizar(1L, new TemaActualizarRequest(null, "Nuevo titulo", null, null), matias))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void moderadorPuedeCerrarUnTema() {
        when(temaRepository.findById(1L)).thenReturn(Optional.of(tema(1L, camila)));

        TemaResponse r = temaService.actualizar(1L, new TemaActualizarRequest(null, null, null, EstadoTema.CERRADO), moderador);

        assertThat(r.estado()).isEqualTo(EstadoTema.CERRADO);
    }

    @Test
    void moderadorPuedeEliminarTemaDeOtroYSeBorranSusComentarios() {
        Tema tema = tema(1L, camila);
        when(temaRepository.findById(1L)).thenReturn(Optional.of(tema));

        temaService.eliminar(1L, moderador);

        verify(comentarioRepository).eliminarPorTema(1L);
        verify(temaRepository).delete(tema);
    }

    @Test
    void usuarioNoPuedeEliminarTemaAjeno() {
        when(temaRepository.findById(1L)).thenReturn(Optional.of(tema(1L, camila)));

        assertThatThrownBy(() -> temaService.eliminar(1L, matias))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        verify(temaRepository, never()).delete(any());
    }

    @Test
    void temaCerradoNoAceptaComentarios() {
        Tema tema = tema(1L, camila);
        tema.setEstado(EstadoTema.CERRADO);
        when(temaRepository.findById(1L)).thenReturn(Optional.of(tema));

        assertThatThrownBy(() -> comentarioService.comentar(1L, new ComentarioRequest("Hola"), matias))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
        verify(comentarioRepository, never()).save(any());
    }

    private static Categoria categoria(Long id) {
        Categoria c = new Categoria();
        c.setId(id);
        c.setNombre("Categoria " + id);
        return c;
    }

    private static Tema tema(Long id, UsuarioActual autor) {
        Tema t = new Tema();
        t.setId(id);
        t.setCategoria(categoria(1L));
        t.setUsuarioId(autor.id());
        t.setAutor(autor.nombreUsuario());
        t.setTitulo("Tema de prueba");
        t.setContenido("Contenido de prueba");
        t.setEstado(EstadoTema.ABIERTO);
        t.setVistas(0L);
        return t;
    }
}
