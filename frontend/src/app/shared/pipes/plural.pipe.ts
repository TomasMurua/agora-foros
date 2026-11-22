import { Pipe, PipeTransform } from '@angular/core';
import { plural } from '../../core/utils/plural';

/** Uso: {{ cantidad | plural: 'comentario' : 'comentarios' }} */
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(cantidad: number | null | undefined, singular: string, formaPlural: string): string {
    return plural(cantidad ?? 0, singular, formaPlural);
  }
}
