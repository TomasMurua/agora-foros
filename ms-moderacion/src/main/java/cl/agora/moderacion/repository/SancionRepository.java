package cl.agora.moderacion.repository;

import cl.agora.moderacion.model.Sancion;
import cl.agora.moderacion.model.TipoAccion;
import cl.agora.moderacion.model.TipoContenido;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SancionRepository extends JpaRepository<Sancion, Long> {

    /** Historial de sanciones con filtros opcionales, las más recientes primero. */
    @Query("""
            select s from Sancion s
            where (:tipo is null or s.tipoContenido = :tipo)
              and (:contenidoId is null or s.contenidoId = :contenidoId)
              and (:accion is null or s.accion = :accion)
            order by s.fecha desc, s.id desc
            """)
    List<Sancion> buscar(@Param("tipo") TipoContenido tipo,
                         @Param("contenidoId") Long contenidoId,
                         @Param("accion") TipoAccion accion);

    boolean existsByNormaId(Long normaId);

    /** Al borrar un reporte, las sanciones que lo citaban quedan sin reporte asociado. */
    @Modifying
    @Query("update Sancion s set s.reporte = null where s.reporte.id = :reporteId")
    int desvincularReporte(@Param("reporteId") Long reporteId);
}
