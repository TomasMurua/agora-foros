import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/facades/auth.facade';
import { ForoFacade } from '../../core/facades/foro.facade';
import { CategoriaCard } from '../../shared/components/categoria-card';
import { TemaCard } from '../../shared/components/tema-card';

/** Página contenedora del inicio: hero, categorías y temas populares. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, CategoriaCard, TemaCard],
  templateUrl: './inicio.html',
})
export class Inicio {
  protected readonly foro = inject(ForoFacade);
  protected readonly auth = inject(AuthFacade);

  /** Un color por categoría, en el orden de la paleta. */
  protected readonly tonos = [
    'var(--ag-terracota)',
    'var(--ag-egeo)',
    'var(--ag-ocre)',
    'var(--ag-olivo)',
    'var(--ag-uva)',
  ];

  protected tono(indice: number): string {
    return this.tonos[indice % this.tonos.length];
  }
}
