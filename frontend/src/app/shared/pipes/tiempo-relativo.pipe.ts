import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' });

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** Convierte una fecha en texto relativo, por ejemplo "hace 3 días". */
@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  transform(fecha: string | null | undefined): string {
    if (!fecha) {
      return '';
    }
    const segundos = (new Date(fecha).getTime() - Date.now()) / 1000;
    for (const [unidad, tamano] of UNIDADES) {
      if (Math.abs(segundos) >= tamano) {
        return formato.format(Math.round(segundos / tamano), unidad);
      }
    }
    return 'hace un momento';
  }
}
