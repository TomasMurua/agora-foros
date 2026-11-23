import { Signal, signal } from '@angular/core';

/**
 * Patrón Repository + Observer.
 *
 * Clase base de los repositorios. Cada repositorio es dueño de un arreglo en
 * memoria guardado en un signal: ese signal es el "sujeto" observable. Cuando
 * el repositorio crea, actualiza o elimina un registro, reemplaza el arreglo
 * completo (nunca lo muta) y todas las vistas que lo leen, ya sea con
 * computed() en las fachadas o directamente en las plantillas, se recalculan
 * solas. Fuera del repositorio nadie puede escribir el arreglo: se expone en
 * modo solo lectura.
 */
export abstract class RepositorioMemoria<T extends { id: number }> {
  private readonly estado = signal<T[]>([]);

  /** Lista observable, de solo lectura. */
  readonly todos: Signal<T[]> = this.estado.asReadonly();

  protected constructor(datosIniciales: readonly T[]) {
    this.estado.set(structuredClone([...datosIniciales]));
  }

  buscarPorId(id: number): T | undefined {
    return this.estado().find((item) => item.id === id);
  }

  crear(datos: Omit<T, 'id'>): T {
    const nuevo = { ...datos, id: this.siguienteId() } as T;
    this.estado.update((items) => [...items, nuevo]);
    return nuevo;
  }

  actualizar(id: number, cambios: Partial<Omit<T, 'id'>>): T | undefined {
    let actualizado: T | undefined;
    this.estado.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }
        actualizado = { ...item, ...cambios };
        return actualizado;
      }),
    );
    return actualizado;
  }

  eliminar(id: number): boolean {
    const antes = this.estado().length;
    this.estado.update((items) => items.filter((item) => item.id !== id));
    return this.estado().length < antes;
  }

  eliminarDonde(condicion: (item: T) => boolean): number {
    const antes = this.estado().length;
    this.estado.update((items) => items.filter((item) => !condicion(item)));
    return antes - this.estado().length;
  }

  private siguienteId(): number {
    return this.estado().reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }
}
