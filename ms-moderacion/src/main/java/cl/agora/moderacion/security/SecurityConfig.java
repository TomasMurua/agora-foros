package cl.agora.moderacion.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Seguridad comun del arquetipo: API sin estado, token JWT emitido por ms-usuarios y respuestas
 * 401/403 en JSON. Cada microservicio agrega aqui las reglas de sus propias rutas.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JsonSecurityHandlers handlers) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health/**", "/actuator/info", "/error").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Normas del foro: leerlas es publico, administrarlas es solo de ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/normas", "/api/normas/**").permitAll()
                        .requestMatchers("/api/normas", "/api/normas/**").hasRole("ADMIN")
                        // Reportes: cualquier usuario con sesion reporta, ve los suyos y retira uno pendiente
                        .requestMatchers(HttpMethod.POST, "/api/reportes").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reportes/mios", "/api/reportes/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/reportes/*").authenticated()
                        // Bandeja de reportes y su revision: MODERADOR y ADMIN
                        .requestMatchers("/api/reportes", "/api/reportes/**").hasAnyRole("MODERADOR", "ADMIN")
                        // Sanciones: MODERADOR y ADMIN banean y restauran; solo ADMIN corrige o borra el historial
                        .requestMatchers(HttpMethod.PUT, "/api/sanciones/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/sanciones/*").hasRole("ADMIN")
                        .requestMatchers("/api/sanciones", "/api/sanciones/**").hasAnyRole("MODERADOR", "ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(handlers)
                        .accessDeniedHandler(handlers))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(handlers)
                        .accessDeniedHandler(handlers));
        return http.build();
    }

    /** El rol viaja en el claim "rol" del token y se transforma en ROLE_ADMIN, ROLE_MODERADOR o ROLE_USUARIO. */
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter autoridades = new JwtGrantedAuthoritiesConverter();
        autoridades.setAuthoritiesClaimName("rol");
        autoridades.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(autoridades);
        return converter;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.origenes}") List<String> origenes) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origenes);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setExposedHeaders(List.of("Location"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
