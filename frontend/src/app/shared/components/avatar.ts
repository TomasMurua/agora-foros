import { Component, computed, input } from '@angular/core';

/** Componente de presentación: círculo con las iniciales y el color de la persona. */
@Component({
  selector: 'app-avatar',
  template: `
    <span class="avatar" [class]="'avatar avatar-' + tamano()" [style.background-color]="color() || '#7a7f87'" [attr.title]="nombre()" aria-hidden="true">
      {{ iniciales() }}
    </span>
  `,
})
export class Avatar {
  readonly nombre = input<string>('');
  readonly color = input<string | null | undefined>(null);
  readonly tamano = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  protected readonly iniciales = computed(() => {
    const partes = (this.nombre() || '?').replace(/[._]/g, ' ').trim().split(/\s+/);
    const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : partes[0].slice(0, 2);
    return letras.toUpperCase();
  });
}
