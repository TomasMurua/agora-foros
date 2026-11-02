package cl.agora.usuarios.service;

import cl.agora.usuarios.dto.UsuarioActualizarRequest;
import cl.agora.usuarios.dto.UsuarioCrearRequest;
import cl.agora.usuarios.dto.UsuarioResponse;
import cl.agora.usuarios.exception.ApiException;
import cl.agora.usuarios.model.Rol;
import cl.agora.usuarios.model.Usuario;
import cl.agora.usuarios.repository.RolRepository;
import cl.agora.usuarios.repository.UsuarioRepository;
import cl.agora.usuarios.security.UsuarioActual;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final RolService rolService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar(String rol) {
        String filtro = rol == null || rol.isBlank() ? null : rol.trim().toUpperCase(Locale.ROOT);
        return usuarioRepository.buscarPorRol(filtro).stream().map(UsuarioResponse::desde).toList();
    }

    /** Un usuario puede ver su propia cuenta; ADMIN y MODERADOR pueden ver cualquiera. */
    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id, UsuarioActual actual) {
        if (!actual.esElMismo(id) && !actual.esAdmin() && !actual.esModerador()) {
            throw ApiException.prohibido("Solo puede consultar su propia cuenta");
        }
        return UsuarioResponse.desde(buscarEntidad(id));
    }

    /**
     * Registro de usuarios. Sin token (registro publico) siempre queda con rol USUARIO.
     * Un ADMIN puede indicar otro rol con rolId.
     */
    @Transactional
    public UsuarioResponse crear(UsuarioCrearRequest req, UsuarioActual actual) {
        String nombreUsuario = req.nombreUsuario().trim();
        String correo = req.correo().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByNombreUsuarioIgnoreCase(nombreUsuario)) {
            throw ApiException.conflicto("El nombre de usuario " + nombreUsuario + " ya está registrado");
        }
        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw ApiException.conflicto("El correo " + correo + " ya está registrado");
        }

        Rol rol;
        if (req.rolId() != null) {
            if (actual == null || !actual.esAdmin()) {
                throw ApiException.prohibido("Solo un administrador puede asignar el rol al crear un usuario");
            }
            rol = rolService.buscarEntidad(req.rolId());
        } else {
            rol = rolRepository.findByNombreIgnoreCase(Rol.USUARIO)
                    .orElseThrow(() -> new IllegalStateException("No existe el rol USUARIO en la base de datos"));
        }

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario(nombreUsuario);
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode(req.password()));
        usuario.setNombreCompleto(req.nombreCompleto().trim());
        usuario.setRol(rol);
        usuario.setActivo(Boolean.TRUE);
        Usuario guardado = usuarioRepository.save(usuario);
        log.info("Usuario registrado: {} (id {}, rol {})", guardado.getNombreUsuario(), guardado.getId(), rol.getNombre());
        return UsuarioResponse.desde(guardado);
    }

    /** El propio usuario modifica sus datos; el rol y el estado activo solo los cambia un ADMIN. */
    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioActualizarRequest req, UsuarioActual actual) {
        if (!actual.esElMismo(id) && !actual.esAdmin()) {
            throw ApiException.prohibido("Solo puede modificar su propia cuenta");
        }
        if ((req.rolId() != null || req.activo() != null) && !actual.esAdmin()) {
            throw ApiException.prohibido("Solo un administrador puede cambiar el rol o bloquear una cuenta");
        }
        Usuario usuario = buscarEntidad(id);

        if (req.correo() != null) {
            String correo = req.correo().trim().toLowerCase(Locale.ROOT);
            if (usuarioRepository.existsByCorreoIgnoreCaseAndIdNot(correo, id)) {
                throw ApiException.conflicto("El correo " + correo + " ya está registrado");
            }
            usuario.setCorreo(correo);
        }
        if (req.nombreCompleto() != null) {
            usuario.setNombreCompleto(req.nombreCompleto().trim());
        }
        if (req.password() != null) {
            usuario.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        if (req.rolId() != null) {
            usuario.setRol(rolService.buscarEntidad(req.rolId()));
        }
        if (req.activo() != null) {
            if (actual.esElMismo(id) && !req.activo()) {
                throw ApiException.conflicto("Un administrador no puede bloquear su propia cuenta");
            }
            usuario.setActivo(req.activo());
        }
        log.info("Usuario {} actualizado por {}", id, actual.nombreUsuario());
        return UsuarioResponse.desde(usuario);
    }

    /** Un usuario puede eliminar su propia cuenta; ADMIN puede eliminar cualquiera excepto la suya. */
    @Transactional
    public void eliminar(Long id, UsuarioActual actual) {
        if (!actual.esElMismo(id) && !actual.esAdmin()) {
            throw ApiException.prohibido("Solo puede eliminar su propia cuenta");
        }
        Usuario usuario = buscarEntidad(id);
        if (actual.esAdmin() && actual.esElMismo(id)) {
            throw ApiException.conflicto("Un administrador no puede eliminar su propia cuenta");
        }
        usuarioRepository.delete(usuario);
        log.info("Usuario {} ({}) eliminado por {}", id, usuario.getNombreUsuario(), actual.nombreUsuario());
    }

    private Usuario buscarEntidad(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe el usuario con id " + id));
    }
}
