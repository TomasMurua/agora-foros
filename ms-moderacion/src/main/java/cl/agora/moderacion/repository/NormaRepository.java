package cl.agora.moderacion.repository;

import cl.agora.moderacion.model.Norma;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NormaRepository extends JpaRepository<Norma, Long> {

    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Long id);

    List<Norma> findAllByOrderByCodigoAsc();

    List<Norma> findByActivaOrderByCodigoAsc(Boolean activa);
}
