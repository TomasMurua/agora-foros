import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Agrega el nombre del sitio al título de cada página. */
@Injectable({ providedIn: 'root' })
export class TituloAgora extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(estado: RouterStateSnapshot): void {
    const titulo = this.buildTitle(estado);
    this.title.setTitle(titulo ? `${titulo} | Ágora Foros` : 'Ágora Foros');
  }
}
