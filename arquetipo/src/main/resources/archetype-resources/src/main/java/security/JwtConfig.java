#set( $symbol_pound = '#' )
#set( $symbol_dollar = '$' )
#set( $symbol_escape = '\' )
package ${package}.security;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/** Valida los tokens JWT emitidos por ms-usuarios (HMAC-SHA256 con clave compartida). */
@Slf4j
@Configuration
public class JwtConfig {

    @Bean
    SecretKey jwtSecretKey(@Value("${symbol_dollar}{app.jwt.secret}") String secreto, Environment entorno) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret debe tener al menos 32 caracteres");
        }
        if (secreto.contains("clave-local-de-desarrollo")) {
            if (entorno.acceptsProfiles(Profiles.of("cloud"))) {
                throw new IllegalStateException(
                        "En el perfil cloud la clave JWT de desarrollo no sirve: defina JWT_SECRET con una clave propia");
            }
            log.warn("Se está usando la clave JWT de desarrollo. Defina JWT_SECRET fuera del entorno local.");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey).macAlgorithm(MacAlgorithm.HS256).build();
    }
}
