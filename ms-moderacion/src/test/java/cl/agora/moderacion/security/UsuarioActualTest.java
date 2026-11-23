package cl.agora.moderacion.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class UsuarioActualTest {

    private Jwt token(String rol) {
        return Jwt.withTokenValue("t").header("alg", "HS256").subject("camila.diaz")
                .claim("uid", 3).claim("rol", rol).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60))
                .build();
    }

    @Test
    void leeLosDatosDelToken() {
        UsuarioActual actual = UsuarioActual.desde(token("USUARIO"));
        assertThat(actual.id()).isEqualTo(3L);
        assertThat(actual.nombreUsuario()).isEqualTo("camila.diaz");
        assertThat(actual.puedeModerar()).isFalse();
        assertThat(actual.esElMismo(3L)).isTrue();
    }

    @Test
    void moderadorYAdminPuedenModerar() {
        assertThat(UsuarioActual.desde(token("MODERADOR")).puedeModerar()).isTrue();
        assertThat(UsuarioActual.desde(token("ADMIN")).esAdmin()).isTrue();
    }

    @Test
    void sinTokenNoHayUsuario() {
        assertThat(UsuarioActual.desde(null)).isNull();
    }
}
