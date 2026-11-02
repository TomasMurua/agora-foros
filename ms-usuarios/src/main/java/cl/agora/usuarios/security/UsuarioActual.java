package cl.agora.usuarios.security;

import org.springframework.security.oauth2.jwt.Jwt;

/** Datos del usuario que viene en el token JWT de la solicitud. */
public record UsuarioActual(Long id, String nombreUsuario, String rol) {

    /** Devuelve null si la solicitud no trae token (endpoints publicos). */
    public static UsuarioActual desde(Jwt jwt) {
        if (jwt == null) {
            return null;
        }
        Object uid = jwt.getClaim("uid");
        Long id = uid instanceof Number n ? n.longValue() : Long.valueOf(String.valueOf(uid));
        return new UsuarioActual(id, jwt.getSubject(), jwt.getClaimAsString("rol"));
    }

    public boolean esAdmin() {
        return "ADMIN".equals(rol);
    }

    public boolean esModerador() {
        return "MODERADOR".equals(rol);
    }

    public boolean esElMismo(Long otroId) {
        return id != null && id.equals(otroId);
    }
}
