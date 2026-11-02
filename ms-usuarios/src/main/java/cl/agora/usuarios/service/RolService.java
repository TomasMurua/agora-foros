package cl.agora.usuarios.service;

import cl.agora.usuarios.dto.RolRequest;
import cl.agora.usuarios.dto.RolResponse;
import cl.agora.usuarios.exception.ApiException;
import cl.agora.usuarios.model.Rol;
import cl.agora.usuarios.repository.RolRepository;
import cl.agora.usuarios.repository.UsuarioRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RolService {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<RolResponse> listar() {
        return rolRepository.findAll(Sort.by("id")).stream().map(RolResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public RolResponse obtener(Long id) {
        return RolResponse.desde(buscarEntidad(id));
    }

    @Transactional
    public RolResponse crear(RolRequest req) {
        String nombre = normalizar(req.nombre());
        if (rolRepository.existsByNombreIgnoreCase(nombre)) {
            throw ApiException.conflicto("Ya existe un rol con el nombre " + nombre);
        }
        Rol rol = new Rol();
        rol.setNombre(nombre);
        rol.setDescripcion(req.descripcion());
        Rol guardado = rolRepository.save(rol);
        log.info("Rol creado: {} (id {})", guardado.getNombre(), guardado.getId());
        return RolResponse.desde(guardado);
    }

    @Transactional
    public RolResponse actualizar(Long id, RolRequest req) {
        Rol rol = buscarEntidad(id);
        String nombre = normalizar(req.nombre());
        if (!rol.getNombre().equalsIgnoreCase(nombre)) {
            if (esRolBase(rol.getNombre())) {
                throw ApiException.conflicto("El rol " + rol.getNombre() + " es parte del sistema y no se puede renombrar");
            }
            if (rolRepository.existsByNombreIgnoreCase(nombre)) {
                throw ApiException.conflicto("Ya existe un rol con el nombre " + nombre);
            }
        }
        rol.setNombre(nombre);
        rol.setDescripcion(req.descripcion());
        log.info("Rol {} actualizado", id);
        return RolResponse.desde(rol);
    }

    @Transactional
    public void eliminar(Long id) {
        Rol rol = buscarEntidad(id);
        if (esRolBase(rol.getNombre())) {
            throw ApiException.conflicto("El rol " + rol.getNombre() + " es parte del sistema y no se puede eliminar");
        }
        long usuarios = usuarioRepository.countByRolId(id);
        if (usuarios > 0) {
            throw ApiException.conflicto("No se puede eliminar el rol: tiene " + usuarios + " usuario(s) asignado(s)");
        }
        rolRepository.delete(rol);
        log.info("Rol {} eliminado", id);
    }

    Rol buscarEntidad(Long id) {
        return rolRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe el rol con id " + id));
    }

    private static String normalizar(String nombre) {
        return nombre.trim().toUpperCase(Locale.ROOT);
    }

    private static boolean esRolBase(String nombre) {
        return Rol.ADMIN.equals(nombre) || Rol.MODERADOR.equals(nombre) || Rol.USUARIO.equals(nombre);
    }
}
