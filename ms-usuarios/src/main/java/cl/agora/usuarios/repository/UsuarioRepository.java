package cl.agora.usuarios.repository;

import cl.agora.usuarios.model.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /** Permite iniciar sesion con el nombre de usuario o con el correo. */
    @Query("select u from Usuario u where lower(u.nombreUsuario) = lower(:login) or lower(u.correo) = lower(:login)")
    Optional<Usuario> buscarPorLogin(@Param("login") String login);

    @Query("select u from Usuario u where (:rol is null or u.rol.nombre = :rol) order by u.id")
    List<Usuario> buscarPorRol(@Param("rol") String rol);

    boolean existsByNombreUsuarioIgnoreCase(String nombreUsuario);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCaseAndIdNot(String correo, Long id);

    long countByRolId(Long rolId);
}
