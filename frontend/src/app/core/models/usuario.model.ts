/** Roles del foro, iguales a los de la tabla ROLES de ms-usuarios. */
export type Rol = 'ADMIN' | 'MODERADOR' | 'USUARIO';

export const ROLES: readonly Rol[] = ['ADMIN', 'MODERADOR', 'USUARIO'];

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  MODERADOR: 'Moderador',
  USUARIO: 'Usuario',
};

export interface Usuario {
  id: number;
  nombreUsuario: string;
  correo: string;
  /** Solo para la demo en memoria. El backend guarda un hash BCrypt. */
  password: string;
  nombreCompleto: string;
  rol: Rol;
  activo: boolean;
  fechaRegistro: string;
  bio: string;
  colorAvatar: string;
}

/** Datos que pide el formulario de registro. */
export interface DatosRegistro {
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  password: string;
}

/** Datos que se pueden cambiar desde "Modificar perfil". */
export interface DatosPerfil {
  nombreCompleto: string;
  correo: string;
  bio: string;
  colorAvatar: string;
}

/** Colores disponibles para el avatar con iniciales. */
export const COLORES_AVATAR: readonly { valor: string; nombre: string }[] = [
  { valor: '#b4472a', nombre: 'Terracota' },
  { valor: '#4f6b3c', nombre: 'Olivo' },
  { valor: '#265077', nombre: 'Egeo' },
  { valor: '#8a5a12', nombre: 'Ocre' },
  { valor: '#6b3f73', nombre: 'Uva' },
  { valor: '#2f5f5a', nombre: 'Ciprés' },
  { valor: '#434a54', nombre: 'Pizarra' },
];
