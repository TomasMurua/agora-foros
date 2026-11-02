package cl.agora.usuarios.service;

import cl.agora.usuarios.dto.LoginRequest;
import cl.agora.usuarios.dto.LoginResponse;
import cl.agora.usuarios.dto.UsuarioResponse;
import cl.agora.usuarios.exception.ApiException;
import cl.agora.usuarios.model.Usuario;
import cl.agora.usuarios.repository.UsuarioRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final long expiracionMinutos;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                       @Value("${app.jwt.expiracion-minutos}") long expiracionMinutos) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.expiracionMinutos = expiracionMinutos;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        Usuario usuario = usuarioRepository.buscarPorLogin(req.usuario().trim())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> {
                    log.warn("Intento de inicio de sesión fallido para '{}'", req.usuario());
                    return ApiException.noAutorizado("Usuario o contraseña incorrectos");
                });
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw ApiException.prohibido("La cuenta está bloqueada. Contacte a un administrador");
        }

        Instant ahora = Instant.now();
        Instant expira = ahora.plus(expiracionMinutos, ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ms-usuarios")
                .issuedAt(ahora)
                .expiresAt(expira)
                .subject(usuario.getNombreUsuario())
                .claim("uid", usuario.getId())
                .claim("rol", usuario.getRol().getNombre())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        log.info("Inicio de sesión correcto: {} ({})", usuario.getNombreUsuario(), usuario.getRol().getNombre());
        return new LoginResponse(token, "Bearer", expira, UsuarioResponse.desde(usuario));
    }
}
