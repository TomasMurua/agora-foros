/**
 * Respuesta de las operaciones de las fachadas. Los componentes la usan
 * para mostrar el mensaje de éxito o de error sin conocer la regla de negocio.
 */
export interface Resultado<T = undefined> {
  ok: boolean;
  mensaje: string;
  dato?: T;
}

export function exito<T = undefined>(mensaje: string, dato?: T): Resultado<T> {
  return { ok: true, mensaje, dato };
}

export function fallo<T = undefined>(mensaje: string): Resultado<T> {
  return { ok: false, mensaje };
}
