/** "1 comentario", "3 comentarios". Los números grandes se escriben con separador de miles. */
export function plural(cantidad: number, singular: string, plural: string): string {
  return `${cantidad.toLocaleString('es-CL')} ${cantidad === 1 ? singular : plural}`;
}
