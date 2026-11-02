package cl.agora.foro.repository;

import cl.agora.foro.model.EstadoTema;
import cl.agora.foro.model.Tema;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TemaRepository extends JpaRepository<Tema, Long> {

    /**
     * Busqueda de temas con filtros opcionales: texto en el titulo o el contenido,
     * categoria, autor y estado. Los mas recientes primero.
     */
    @Query("""
            select t from Tema t
            where (:categoriaId is null or t.categoria.id = :categoriaId)
              and (:autor is null or lower(t.autor) = lower(:autor))
              and (:estado is null or t.estado = :estado)
              and (:texto is null
                   or lower(t.titulo) like lower(concat('%', :texto, '%'))
                   or lower(t.contenido) like lower(concat('%', :texto, '%')))
            order by t.fechaCreacion desc
            """)
    List<Tema> buscar(@Param("texto") String texto,
                      @Param("categoriaId") Long categoriaId,
                      @Param("autor") String autor,
                      @Param("estado") EstadoTema estado);

    List<Tema> findByCategoriaIdOrderByFechaCreacionDesc(Long categoriaId);

    @Query("select t from Tema t order by t.vistas desc, t.fechaCreacion desc")
    List<Tema> masVistos(Pageable pageable);

    long countByCategoriaId(Long categoriaId);
}
