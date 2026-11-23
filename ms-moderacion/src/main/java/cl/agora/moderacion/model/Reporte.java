package cl.agora.moderacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Denuncia de un usuario sobre un tema o comentario que no cumple una norma. */
@Entity
@Table(name = "REPORTES")
@Getter
@Setter
@NoArgsConstructor
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "TIPO_CONTENIDO", nullable = false, length = 12)
    private TipoContenido tipoContenido;

    /** Id del tema o comentario en ms-foro. */
    @Column(name = "CONTENIDO_ID", nullable = false)
    private Long contenidoId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "NORMA_ID", nullable = false)
    private Norma norma;

    @Column(name = "MOTIVO", nullable = false, length = 300)
    private String motivo;

    /** Id en ms-usuarios de quien reporta (viene en el token). */
    @Column(name = "USUARIO_ID", nullable = false)
    private Long usuarioId;

    @Column(name = "REPORTADO_POR", nullable = false, length = 30)
    private String reportadoPor;

    @Enumerated(EnumType.STRING)
    @Column(name = "ESTADO", nullable = false, length = 12)
    private EstadoReporte estado = EstadoReporte.PENDIENTE;

    @Column(name = "RESUELTO_POR", length = 30)
    private String resueltoPor;

    @Column(name = "OBSERVACION", length = 300)
    private String observacion;

    @Column(name = "FECHA_CREACION", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "FECHA_RESOLUCION")
    private LocalDateTime fechaResolucion;

    @PrePersist
    void antesDeGuardar() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
        if (estado == null) {
            estado = EstadoReporte.PENDIENTE;
        }
    }

    public boolean estaPendiente() {
        return estado == EstadoReporte.PENDIENTE;
    }

    /** Cierra el reporte con el resultado de la revisión. */
    public void cerrar(EstadoReporte resultado, String moderador, String observacion) {
        this.estado = resultado;
        this.resueltoPor = moderador;
        this.observacion = observacion;
        this.fechaResolucion = LocalDateTime.now();
    }
}
