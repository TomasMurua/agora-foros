package cl.agora.foro.model;

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

@Entity
@Table(name = "TEMAS")
@Getter
@Setter
@NoArgsConstructor
public class Tema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "CATEGORIA_ID", nullable = false)
    private Categoria categoria;

    /** Id del autor en ms-usuarios (viene en el token JWT). */
    @Column(name = "USUARIO_ID", nullable = false)
    private Long usuarioId;

    @Column(name = "AUTOR", nullable = false, length = 30)
    private String autor;

    @Column(name = "TITULO", nullable = false, length = 150)
    private String titulo;

    @Column(name = "CONTENIDO", nullable = false, length = 4000)
    private String contenido;

    @Enumerated(EnumType.STRING)
    @Column(name = "ESTADO", nullable = false, length = 10)
    private EstadoTema estado = EstadoTema.ABIERTO;

    @Column(name = "VISTAS", nullable = false)
    private Long vistas = 0L;

    @Column(name = "FECHA_CREACION", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "FECHA_ACTUALIZACION")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    void antesDeGuardar() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
        if (estado == null) {
            estado = EstadoTema.ABIERTO;
        }
        if (vistas == null) {
            vistas = 0L;
        }
    }
}
