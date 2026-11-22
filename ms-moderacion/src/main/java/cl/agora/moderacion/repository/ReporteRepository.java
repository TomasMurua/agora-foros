package cl.agora.moderacion.repository;

import cl.agora.moderacion.model.EstadoReporte;
import cl.agora.moderacion.model.Reporte;
import cl.agora.moderacion.model.TipoContenido;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    /** Reportes con filtros opcionales, los más recientes primero. */
    @Query("""
            select r from Reporte r
            where (:estado is null or r.estado = :estado)
              and (:tipo is null or r.tipoContenido = :tipo)
              and (:contenidoId is null or r.contenidoId = :contenidoId)
            order by r.fechaCreacion desc
            """)
    List<Reporte> buscar(@Param("estado") EstadoReporte estado,
                         @Param("tipo") TipoContenido tipo,
                         @Param("contenidoId") Long contenidoId);

    List<Reporte> findByUsuarioIdOrderByFechaCreacionDesc(Long usuarioId);

    List<Reporte> findByTipoContenidoAndContenidoIdAndEstado(TipoContenido tipo, Long contenidoId,
                                                             EstadoReporte estado);

    boolean existsByTipoContenidoAndContenidoIdAndUsuarioIdAndEstado(TipoContenido tipo, Long contenidoId,
                                                                     Long usuarioId, EstadoReporte estado);

    boolean existsByNormaId(Long normaId);
}
