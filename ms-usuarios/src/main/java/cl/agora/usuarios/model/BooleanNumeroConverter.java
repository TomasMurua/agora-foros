package cl.agora.usuarios.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Guarda los boolean como NUMBER(1) (1 = verdadero, 0 = falso) en Oracle. */
@Converter
public class BooleanNumeroConverter implements AttributeConverter<Boolean, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Boolean valor) {
        return Boolean.TRUE.equals(valor) ? 1 : 0;
    }

    @Override
    public Boolean convertToEntityAttribute(Integer valor) {
        return valor != null && valor == 1;
    }
}
