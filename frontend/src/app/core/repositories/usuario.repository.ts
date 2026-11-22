import { Injectable } from '@angular/core';
import { USUARIOS_INICIALES } from '../../data/usuarios.data';
import { Usuario } from '../models/usuario.model';
import { RepositorioMemoria } from './repositorio-memoria';

/**
 * Patrón Repository: guarda los usuarios en memoria y ofrece el CRUD y las
 * búsquedas por nombre de usuario o correo. No aplica reglas de negocio
 * (eso lo hacen AuthFacade y AdminFacade); solo lee y escribe datos.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioRepository extends RepositorioMemoria<Usuario> {
  constructor() {
    super(USUARIOS_INICIALES);
  }

  buscarPorNombreUsuario(nombreUsuario: string): Usuario | undefined {
    const buscado = nombreUsuario.trim().toLowerCase();
    return this.todos().find((u) => u.nombreUsuario.toLowerCase() === buscado);
  }

  buscarPorCorreo(correo: string): Usuario | undefined {
    const buscado = correo.trim().toLowerCase();
    return this.todos().find((u) => u.correo.toLowerCase() === buscado);
  }

  /** Busca por nombre de usuario o por correo, como el login del backend. */
  buscarPorIdentificador(identificador: string): Usuario | undefined {
    return identificador.includes('@')
      ? this.buscarPorCorreo(identificador)
      : this.buscarPorNombreUsuario(identificador);
  }
}
