package cl.agora.moderacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Norma del foro. Los reportes y las sanciones indican cuál norma no se cumplió. */
@Entity
@Table(name = "NORMAS")
@Getter
@Setter
@NoArgsConstructor
public class Norma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CODIGO", nullable = false, unique = true, length = 10)
    private String codigo;

    @Column(name = "TITULO", nullable = false, length = 80)
    private String titulo;

    @Column(name = "DESCRIPCION", nullable = false, length = 500)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "GRAVEDAD", nullable = false, length = 10)
    private Gravedad gravedad;

    @Convert(converter = BooleanNumeroConverter.class)
    @Column(name = "ACTIVA", nullable = false)
    private Boolean activa = Boolean.TRUE;

    @Column(name = "FECHA_CREACION", nullable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    void antesDeGuardar() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
        if (activa == null) {
            activa = Boolean.TRUE;
        }
    }

    public boolean estaActiva() {
        return Boolean.TRUE.equals(activa);
    }
}
