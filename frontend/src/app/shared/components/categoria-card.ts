import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../core/models/foro.model';

/** Componente de presentación: tarjeta de una categoría con su cantidad de temas. */
@Component({
  selector: 'app-categoria-card',
  imports: [RouterLink],
  template: `
    <a class="categoria-card" [routerLink]="['/categorias', categoria().id]" [style.--tono]="tono()">
      <span class="categoria-icono"><i class="bi" [class]="'bi bi-' + categoria().icono" aria-hidden="true"></i></span>
      <span class="categoria-texto">
        <span class="categoria-nombre">{{ categoria().nombre }}</span>
        <span class="categoria-descripcion">{{ categoria().descripcion }}</span>
      </span>
      <span class="categoria-conteo">{{ temas() }} {{ temas() === 1 ? 'tema' : 'temas' }}</span>
    </a>
  `,
})
export class CategoriaCard {
  readonly categoria = input.required<Categoria>();
  readonly temas = input(0);
  readonly tono = input('var(--ag-terracota)');
}
