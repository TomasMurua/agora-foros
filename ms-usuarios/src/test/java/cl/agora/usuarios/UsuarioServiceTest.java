package cl.agora.usuarios;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.agora.usuarios.dto.UsuarioActualizarRequest;
import cl.agora.usuarios.dto.UsuarioCrearRequest;
import cl.agora.usuarios.dto.UsuarioResponse;
import cl.agora.usuarios.exception.ApiException;
import cl.agora.usuarios.model.Rol;
import cl.agora.usuarios.model.Usuario;
import cl.agora.usuarios.repository.RolRepository;
import cl.agora.usuarios.repository.UsuarioRepository;
import cl.agora.usuarios.security.UsuarioActual;
import cl.agora.usuarios.service.RolService;
import cl.agora.usuarios.service.UsuarioService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private RolRepository rolRepository;
    @Mock
    private RolService rolService;

    private UsuarioService service;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private final UsuarioActual admin = new UsuarioActual(1L, "admin", Rol.ADMIN);
    private final UsuarioActual camila = new UsuarioActual(3L, "camila.diaz", Rol.USUARIO);

    @BeforeEach
    void setUp() {
        service = new UsuarioService(usuarioRepository, rolRepository, rolService, encoder);
    }

    @Test
    void registroPublicoQuedaConRolUsuarioYClaveCifrada() {
        when(rolRepository.findByNombreIgnoreCase(Rol.USUARIO)).thenReturn(Optional.of(rol(3L, Rol.USUARIO)));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse r = service.crear(
                new UsuarioCrearRequest("nuevo.user", "Nuevo@Correo.cl", "Clave2026x", "Nuevo Usuario", null), null);

        assertThat(r.rol()).isEqualTo(Rol.USUARIO);
        assertThat(r.correo()).isEqualTo("nuevo@correo.cl");
        verify(usuarioRepository).save(org.mockito.ArgumentMatchers.argThat(u ->
                !u.getPasswordHash().equals("Clave2026x") && encoder.matches("Clave2026x", u.getPasswordHash())));
    }

    @Test
    void soloUnAdminPuedeElegirElRolAlRegistrar() {
        UsuarioCrearRequest req = new UsuarioCrearRequest("otro", "otro@correo.cl", "Clave2026x", "Otro", 1L);

        assertThatThrownBy(() -> service.crear(req, camila))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void noPermiteNombreDeUsuarioRepetido() {
        when(usuarioRepository.existsByNombreUsuarioIgnoreCase("camila.diaz")).thenReturn(true);
        UsuarioCrearRequest req = new UsuarioCrearRequest("camila.diaz", "c2@correo.cl", "Clave2026x", "Camila", null);

        assertThatThrownBy(() -> service.crear(req, null))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void unUsuarioNoPuedeCambiarseElRol() {
        UsuarioActualizarRequest req = new UsuarioActualizarRequest(null, null, null, 1L, null);

        assertThatThrownBy(() -> service.actualizar(3L, req, camila))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void adminPuedeBloquearOtraCuenta() {
        Usuario u = usuario(3L, "camila.diaz", rol(3L, Rol.USUARIO));
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(u));

        UsuarioResponse r = service.actualizar(3L, new UsuarioActualizarRequest(null, null, null, null, false), admin);

        assertThat(r.activo()).isFalse();
    }

    @Test
    void unUsuarioNoPuedeEliminarOtraCuenta() {
        assertThatThrownBy(() -> service.eliminar(4L, camila))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        verify(usuarioRepository, never()).delete(any());
    }

    private static Rol rol(Long id, String nombre) {
        Rol r = new Rol();
        r.setId(id);
        r.setNombre(nombre);
        return r;
    }

    private static Usuario usuario(Long id, String nombre, Rol rol) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNombreUsuario(nombre);
        u.setCorreo(nombre + "@correo.cl");
        u.setNombreCompleto(nombre);
        u.setPasswordHash("hash");
        u.setRol(rol);
        u.setActivo(true);
        return u;
    }
}
