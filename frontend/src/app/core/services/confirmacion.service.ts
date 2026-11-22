import { Injectable, signal } from '@angular/core';

export interface PeticionConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  peligro?: boolean;
}

interface ConfirmacionActiva extends PeticionConfirmacion {
  responder: (valor: boolean) => void;
}

/**
 * Pide confirmación antes de una acción destructiva. confirmar() devuelve una
 * promesa; el diálogo del layout observa el signal "activa" y la resuelve
 * cuando la persona elige.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private readonly estado = signal<ConfirmacionActiva | null>(null);
  readonly activa = this.estado.asReadonly();

  confirmar(peticion: PeticionConfirmacion): Promise<boolean> {
    this.estado()?.responder(false);
    return new Promise<boolean>((resolver) => {
      this.estado.set({
        ...peticion,
        responder: (valor) => {
          this.estado.set(null);
          resolver(valor);
        },
      });
    });
  }

  responder(valor: boolean): void {
    this.estado()?.responder(valor);
  }
}
