package cl.agora.foro.repository;

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
     * Es SQL nativo porque CONTENIDO es un CLOB: Oracle lo busca con DBMS_LOB.INSTR. Se usa INSTR
     * y no LIKE para que un % o un _ en el texto se busquen tal cual.
     * El estado llega como texto (ABIERTO, CERRADO o BANEADO).
     */
    @Query(value = """
            SELECT t.* FROM TEMAS t
            WHERE (:categoriaId IS NULL OR t.CATEGORIA_ID = :categoriaId)
              AND (:autor IS NULL OR LOWER(t.AUTOR) = LOWER(:autor))
              AND (:estado IS NULL OR t.ESTADO = :estado)
              AND (:texto IS NULL
                   OR INSTR(LOWER(t.TITULO), LOWER(:texto)) > 0
                   OR DBMS_LOB.INSTR(LOWER(t.CONTENIDO), LOWER(:texto)) > 0)
            ORDER BY t.FECHA_CREACION DESC
            """, nativeQuery = true)
    List<Tema> buscar(@Param("texto") String texto,
                      @Param("categoriaId") Long categoriaId,
                      @Param("autor") String autor,
                      @Param("estado") String estado);

    List<Tema> findByCategoriaIdOrderByFechaCreacionDesc(Long categoriaId);

    /** Los temas baneados no aparecen entre los populares. */
    @Query("select t from Tema t where t.estado <> cl.agora.foro.model.EstadoTema.BANEADO "
            + "order by t.vistas desc, t.fechaCreacion desc")
    List<Tema> masVistos(Pageable pageable);

    long countByCategoriaId(Long categoriaId);
}
