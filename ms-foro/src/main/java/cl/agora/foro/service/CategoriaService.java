package cl.agora.foro.service;

import cl.agora.foro.dto.CategoriaRequest;
import cl.agora.foro.dto.CategoriaResponse;
import cl.agora.foro.exception.ApiException;
import cl.agora.foro.model.Categoria;
import cl.agora.foro.repository.CategoriaRepository;
import cl.agora.foro.repository.TemaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final TemaRepository temaRepository;

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar() {
        return categoriaRepository.findAll(Sort.by("id")).stream().map(this::aRespuesta).toList();
    }

    @Transactional(readOnly = true)
    public CategoriaResponse obtener(Long id) {
        return aRespuesta(buscarEntidad(id));
    }

    @Transactional
    public CategoriaResponse crear(CategoriaRequest req) {
        String nombre = req.nombre().trim();
        if (categoriaRepository.existsByNombreIgnoreCase(nombre)) {
            throw ApiException.conflicto("Ya existe una categoría con el nombre " + nombre);
        }
        Categoria categoria = new Categoria();
        categoria.setNombre(nombre);
        categoria.setDescripcion(req.descripcion());
        Categoria guardada = categoriaRepository.save(categoria);
        log.info("Categoría creada: {} (id {})", guardada.getNombre(), guardada.getId());
        return aRespuesta(guardada);
    }

    @Transactional
    public CategoriaResponse actualizar(Long id, CategoriaRequest req) {
        Categoria categoria = buscarEntidad(id);
        String nombre = req.nombre().trim();
        if (categoriaRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw ApiException.conflicto("Ya existe una categoría con el nombre " + nombre);
        }
        categoria.setNombre(nombre);
        categoria.setDescripcion(req.descripcion());
        log.info("Categoría {} actualizada", id);
        return aRespuesta(categoria);
    }

    @Transactional
    public void eliminar(Long id) {
        Categoria categoria = buscarEntidad(id);
        long temas = temaRepository.countByCategoriaId(id);
        if (temas > 0) {
            throw ApiException.conflicto("No se puede eliminar la categoría: tiene " + temas + " tema(s) publicado(s)");
        }
        categoriaRepository.delete(categoria);
        log.info("Categoría {} eliminada", id);
    }

    Categoria buscarEntidad(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> ApiException.noEncontrado("No existe la categoría con id " + id));
    }

    private CategoriaResponse aRespuesta(Categoria c) {
        return CategoriaResponse.desde(c, temaRepository.countByCategoriaId(c.getId()));
    }
}
