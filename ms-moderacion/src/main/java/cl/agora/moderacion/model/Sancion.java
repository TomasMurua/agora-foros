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

/** Registro de una acción de moderación (banear o restaurar) sobre un tema o comentario. */
@Entity
@Table(name = "SANCIONES")
@Getter
@Setter
@NoArgsConstructor
public class Sancion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "TIPO_CONTENIDO", nullable = false, length = 12)
    private TipoContenido tipoContenido;

    @Column(name = "CONTENIDO_ID", nullable = false)
    private Long contenidoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ACCION", nullable = false, length = 10)
    private TipoAccion accion;

    /** Norma que no se cumplió. Es obligatoria al banear y opcional al restaurar. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "NORMA_ID")
    private Norma norma;

    @Column(name = "MOTIVO", nullable = false, length = 300)
    private String motivo;

    @Column(name = "MODERADOR_ID", nullable = false)
    private Long moderadorId;

    @Column(name = "MODERADOR", nullable = false, length = 30)
    private String moderador;

    /** Reporte que originó la sanción, si lo hubo. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "REPORTE_ID")
    private Reporte reporte;

    @Column(name = "FECHA", nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    void antesDeGuardar() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
    }
}
