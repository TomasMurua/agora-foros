import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DatosPerfil, DatosRegistro, Rol, Usuario } from '../models/usuario.model';
import { Resultado, exito, fallo } from '../models/resultado.model';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { ComentarioRepository, TemaRepository } from '../repositories/foro.repository';
import { REGLAS_PASSWORD } from '../validators/agora.validators';

const CLAVE_SESION = 'agora.sesion';
const MINUTOS_CODIGO = 10;
const INTENTOS_CODIGO = 3;

interface SolicitudRecuperacion {
  usuarioId: number;
  codigo: string;
  expira: number;
  intentos: number;
  verificado: boolean;
}

/**
 * Patrón Facade: punto único para todo lo que tiene que ver con la cuenta
 * (iniciar sesión, registrarse, recuperar la contraseña, modificar el perfil).
 * Los componentes no ven el repositorio de usuarios: llaman a esta fachada y
 * observan sus signals (usuarioActual, rol, esModerador...).
 *
 * Patrón Observer: usuarioActual es un computed que observa el id de la sesión
 * y la lista del repositorio, así que si un administrador cambia el rol o
 * bloquea la cuenta, la barra de navegación y los guards lo ven al instante.
 * Un effect observa el id de la sesión y lo guarda en sessionStorage para que
 * un refresco de la página no cierre la sesión.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly usuarios = inject(UsuarioRepository);
  private readonly temas = inject(TemaRepository);
  private readonly comentarios = inject(ComentarioRepository);

  private readonly idSesion = signal<number | null>(this.leerSesionGuardada());
  private recuperacion: SolicitudRecuperacion | null = null;

  /** Usuario con sesión iniciada, o null. Una cuenta bloqueada o eliminada cierra la sesión. */
  readonly usuarioActual = computed<Usuario | null>(() => {
    const id = this.idSesion();
    if (id === null) {
      return null;
    }
    const usuario = this.usuarios.todos().find((u) => u.id === id);
    return usuario && usuario.activo ? usuario : null;
  });

  readonly estaAutenticado = computed(() => this.usuarioActual() !== null);
  readonly rol = computed<Rol | null>(() => this.usuarioActual()?.rol ?? null);
  readonly esAdmin = computed(() => this.rol() === 'ADMIN');
  /** MODERADOR y ADMIN pueden moderar. */
  readonly esModerador = computed(() => this.rol() === 'MODERADOR' || this.rol() === 'ADMIN');

  constructor() {
    effect(() => {
      const usuario = this.usuarioActual();
      try {
        if (usuario) {
          sessionStorage.setItem(CLAVE_SESION, String(usuario.id));
        } else {
          sessionStorage.removeItem(CLAVE_SESION);
        }
      } catch {
        // Sin sessionStorage la sesión dura hasta el próximo refresco.
      }
    });
  }

  tieneRol(...roles: Rol[]): boolean {
    const rol = this.rol();
    return rol !== null && roles.includes(rol);
  }

  usuarioPorNombre(nombreUsuario: string): Usuario | undefined {
    return this.usuarios.buscarPorNombreUsuario(nombreUsuario);
  }

  existeNombreUsuario(nombreUsuario: string): boolean {
    return this.usuarios.buscarPorNombreUsuario(nombreUsuario) !== undefined;
  }

  /** true si el correo ya lo usa otra cuenta distinta a la actual. */
  existeCorreo(correo: string): boolean {
    const encontrado = this.usuarios.buscarPorCorreo(correo);
    return encontrado !== undefined && encontrado.id !== this.idSesion();
  }

  iniciarSesion(identificador: string, password: string): Resultado<Usuario> {
    const usuario = this.usuarios.buscarPorIdentificador(identificador);
    if (!usuario || usuario.password !== password) {
      return fallo('Usuario o contraseña incorrectos.');
    }
    if (!usuario.activo) {
      return fallo('Tu cuenta está bloqueada. Escribe a un administrador para revisarla.');
    }
    this.idSesion.set(usuario.id);
    return exito(`Hola de nuevo, ${usuario.nombreCompleto.split(' ')[0]}.`, usuario);
  }

  cerrarSesion(): void {
    this.idSesion.set(null);
  }

  registrar(datos: DatosRegistro): Resultado<Usuario> {
    const nombreUsuario = datos.nombreUsuario.trim().toLowerCase();
    const correo = datos.correo.trim().toLowerCase();
    if (this.usuarios.buscarPorNombreUsuario(nombreUsuario)) {
      return fallo('Ese nombre de usuario ya está registrado.');
    }
    if (this.usuarios.buscarPorCorreo(correo)) {
      return fallo('Ese correo ya está registrado.');
    }
    const error = this.revisarPassword(datos.password, nombreUsuario);
    if (error) {
      return fallo(error);
    }
    const nuevo = this.usuarios.crear({
      nombreUsuario,
      correo,
      password: datos.password,
      nombreCompleto: datos.nombreCompleto.trim(),
      rol: 'USUARIO',
      activo: true,
      fechaRegistro: new Date().toISOString(),
      bio: '',
      colorAvatar: '#2f5f5a',
    });
    this.idSesion.set(nuevo.id);
    return exito('Tu cuenta quedó creada. Ya puedes publicar y comentar.', nuevo);
  }

  /** Paso 1: genera un código de 6 dígitos. Como no hay servidor de correo, se devuelve para mostrarlo en pantalla. */
  solicitarRecuperacion(correo: string): Resultado<string> {
    const usuario = this.usuarios.buscarPorCorreo(correo);
    if (!usuario) {
      return fallo('No encontramos una cuenta con ese correo.');
    }
    if (!usuario.activo) {
      return fallo('La cuenta asociada a ese correo está bloqueada.');
    }
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    this.recuperacion = {
      usuarioId: usuario.id,
      codigo,
      expira: Date.now() + MINUTOS_CODIGO * 60_000,
      intentos: 0,
      verificado: false,
    };
    return exito(`Enviamos un código a ${usuario.correo}. Vence en ${MINUTOS_CODIGO} minutos.`, codigo);
  }

  /** Paso 2: revisa el código. Tras 3 intentos fallidos hay que pedir uno nuevo. */
  verificarCodigo(codigo: string): Resultado {
    const solicitud = this.recuperacion;
    if (!solicitud) {
      return fallo('Primero solicita un código.');
    }
    if (Date.now() > solicitud.expira) {
      this.recuperacion = null;
      return fallo('El código venció. Solicita uno nuevo.');
    }
    if (solicitud.codigo !== codigo.trim()) {
      solicitud.intentos++;
      if (solicitud.intentos >= INTENTOS_CODIGO) {
        this.recuperacion = null;
        return fallo('Superaste los 3 intentos. Solicita un código nuevo.');
      }
      const quedan = INTENTOS_CODIGO - solicitud.intentos;
      return fallo(`El código no es correcto. ${quedan === 1 ? 'Te queda 1 intento' : `Te quedan ${quedan} intentos`}.`);
    }
    solicitud.verificado = true;
    return exito('Código verificado. Ahora elige tu nueva contraseña.');
  }

  /** Nombre de usuario de la cuenta en recuperación, para validar que la clave no lo contenga. */
  nombreUsuarioEnRecuperacion(): string {
    const id = this.recuperacion?.usuarioId;
    return id ? (this.usuarios.buscarPorId(id)?.nombreUsuario ?? '') : '';
  }

  /** Paso 3: guarda la nueva contraseña. */
  restablecerPassword(nueva: string): Resultado {
    const solicitud = this.recuperacion;
    if (!solicitud?.verificado) {
      return fallo('Primero verifica el código que te enviamos.');
    }
    const usuario = this.usuarios.buscarPorId(solicitud.usuarioId);
    if (!usuario) {
      return fallo('La cuenta ya no existe.');
    }
    const error = this.revisarPassword(nueva, usuario.nombreUsuario);
    if (error) {
      return fallo(error);
    }
    this.usuarios.actualizar(usuario.id, { password: nueva });
    this.recuperacion = null;
    return exito('Tu contraseña cambió. Ya puedes iniciar sesión.');
  }

  actualizarPerfil(datos: DatosPerfil): Resultado<Usuario> {
    const actual = this.usuarioActual();
    if (!actual) {
      return fallo('Debes iniciar sesión.');
    }
    const correo = datos.correo.trim().toLowerCase();
    if (this.existeCorreo(correo)) {
      return fallo('Ese correo ya lo usa otra cuenta.');
    }
    const actualizado = this.usuarios.actualizar(actual.id, {
      nombreCompleto: datos.nombreCompleto.trim(),
      correo,
      bio: datos.bio.trim(),
      colorAvatar: datos.colorAvatar,
    });
    return exito('Tus datos quedaron guardados.', actualizado);
  }

  cambiarPassword(actualPassword: string, nueva: string): Resultado {
    const actual = this.usuarioActual();
    if (!actual) {
      return fallo('Debes iniciar sesión.');
    }
    if (actual.password !== actualPassword) {
      return fallo('La contraseña actual no es correcta.');
    }
    if (actualPassword === nueva) {
      return fallo('La nueva contraseña debe ser distinta de la actual.');
    }
    const error = this.revisarPassword(nueva, actual.nombreUsuario);
    if (error) {
      return fallo(error);
    }
    this.usuarios.actualizar(actual.id, { password: nueva });
    return exito('Tu contraseña cambió.');
  }

  /** Elimina la cuenta propia. Los temas y comentarios quedan publicados con su autor. */
  eliminarCuenta(password: string): Resultado {
    const actual = this.usuarioActual();
    if (!actual) {
      return fallo('Debes iniciar sesión.');
    }
    if (actual.password !== password) {
      return fallo('La contraseña no es correcta.');
    }
    if (actual.rol === 'ADMIN') {
      const otrosAdmins = this.usuarios
        .todos()
        .filter((u) => u.rol === 'ADMIN' && u.activo && u.id !== actual.id);
      if (otrosAdmins.length === 0) {
        return fallo('Eres el único administrador activo. Asigna otro antes de eliminar tu cuenta.');
      }
    }
    this.usuarios.eliminar(actual.id);
    this.idSesion.set(null);
    return exito('Tu cuenta fue eliminada.');
  }

  /** Cantidad de temas y comentarios de un usuario, para su perfil. */
  actividadDe(usuarioId: number): { temas: number; comentarios: number } {
    return {
      temas: this.temas.porUsuario(usuarioId).length,
      comentarios: this.comentarios.todos().filter((c) => c.usuarioId === usuarioId).length,
    };
  }

  private revisarPassword(password: string, nombreUsuario: string): string | null {
    const incumplida = REGLAS_PASSWORD.find((r) => !r.cumple(password, nombreUsuario));
    return incumplida ? `La contraseña no cumple: ${incumplida.mensaje.toLowerCase()}.` : null;
  }

  private leerSesionGuardada(): number | null {
    try {
      const valor = sessionStorage.getItem(CLAVE_SESION);
      return valor ? Number(valor) : null;
    } catch {
      return null;
    }
  }
}
