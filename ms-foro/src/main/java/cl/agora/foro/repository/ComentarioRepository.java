package cl.agora.foro.repository;

import cl.agora.foro.model.Comentario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ComentarioRepository extends JpaRepository<Comentario, Long> {

    List<Comentario> findByTemaIdOrderByFechaCreacionAsc(Long temaId);

    long countByTemaId(Long temaId);

    @Modifying
    @Query("delete from Comentario c where c.tema.id = :temaId")
    int eliminarPorTema(@Param("temaId") Long temaId);
}
