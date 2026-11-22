import { Injectable, signal } from '@angular/core';
import { Resultado } from '../models/resultado.model';

export type TipoAviso = 'exito' | 'error' | 'info';

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  mensaje: string;
}

/**
 * Avisos tipo "toast" que aparecen después de cada acción. La lista es un
 * signal: el contenedor de avisos del layout la observa y los dibuja.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private siguienteId = 1;
  private readonly lista = signal<Aviso[]>([]);
  readonly avisos = this.lista.asReadonly();

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  /** Muestra el mensaje de un Resultado como éxito o error, y devuelve si fue ok. */
  resultado(resultado: Resultado<unknown>): boolean {
    this.mostrar(resultado.ok ? 'exito' : 'error', resultado.mensaje);
    return resultado.ok;
  }

  cerrar(id: number): void {
    this.lista.update((avisos) => avisos.filter((a) => a.id !== id));
  }

  private mostrar(tipo: TipoAviso, mensaje: string): void {
    const id = this.siguienteId++;
    this.lista.update((avisos) => [...avisos.slice(-3), { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), tipo === 'error' ? 6500 : 4500);
  }
}
