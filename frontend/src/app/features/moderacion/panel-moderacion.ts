import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/facades/auth.facade';
import { ForoFacade } from '../../core/facades/foro.facade';
import { ModeracionFacade, ReporteDetallado } from '../../core/facades/moderacion.facade';
import { Tema } from '../../core/models/foro.model';
import { DatosSancion, TipoContenido } from '../../core/models/moderacion.model';
import { ETIQUETA_ROL } from '../../core/models/usuario.model';
import { ConfirmacionService } from '../../core/services/confirmacion.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Avatar } from '../../shared/components/avatar';
import { DialogoMotivo } from '../../shared/components/dialogo-motivo';
import { EstadoBadge } from '../../shared/components/estado-badge';
import { EstadoVacio } from '../../shared/components/estado-vacio';
import { TiempoRelativoPipe } from '../../shared/pipes/tiempo-relativo.pipe';

type Pestana = 'reportes' | 'contenido' | 'usuarios';

interface DialogoModeracion {
  accion: 'sancionar' | 'banear' | 'restaurar';
  tipo: TipoContenido;
  contenidoId: number;
  reporteId?: number;
  normaId?: number;
  contexto: string;
}

/** Página contenedora: panel del equipo de moderación (MODERADOR y ADMIN). */
@Component({
  selector: 'app-panel-moderacion',
  imports: [RouterLink, DatePipe, TiempoRelativoPipe, Avatar, EstadoBadge, EstadoVacio, DialogoMotivo],
  templateUrl: './panel-moderacion.html',
})
export class PanelModeracion {
  protected readonly moderacion = inject(ModeracionFacade);
  protected readonly foro = inject(ForoFacade);
  protected readonly auth = inject(AuthFacade);
  private readonly notificaciones = inject(NotificacionService);
  private readonly confirmacion = inject(ConfirmacionService);

  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly pestana = signal<Pestana>('reportes');
  protected readonly dialogo = signal<DialogoModeracion | null>(null);

  protected readonly pestanas = computed(() => [
    { id: 'reportes' as const, nombre: 'Reportes', icono: 'flag', conteo: this.moderacion.cantidadPendientes() },
    { id: 'contenido' as const, nombre: 'Contenido', icono: 'collection', conteo: this.moderacion.temasBaneados().length + this.moderacion.comentariosBaneados().length },
    { id: 'usuarios' as const, nombre: 'Usuarios', icono: 'people', conteo: this.moderacion.usuarios().length },
  ]);

  protected tituloTema(temaId: number): string {
    return this.foro.temaPorId(temaId)?.titulo ?? 'Tema eliminado';
  }

  protected sancionar(r: ReporteDetallado): void {
    this.dialogo.set({
      accion: 'sancionar',
      tipo: r.reporte.tipoContenido,
      contenidoId: r.reporte.contenidoId,
      reporteId: r.reporte.id,
      normaId: r.reporte.normaId,
      contexto: r.extracto,
    });
  }

  protected async descartar(r: ReporteDetallado): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Descartar reporte',
      mensaje: `El contenido "${r.extracto}" seguirá publicado y el reporte quedará cerrado como descartado.`,
      textoConfirmar: 'Descartar reporte',
    });
    if (ok) {
      this.notificaciones.resultado(
        this.moderacion.descartarReporte(r.reporte.id, 'Revisado: el contenido no infringe las normas.'),
      );
    }
  }

  protected banearTema(tema: Tema): void {
    this.dialogo.set({ accion: 'banear', tipo: 'TEMA', contenidoId: tema.id, contexto: tema.titulo });
  }

  protected restaurar(tipo: TipoContenido, contenidoId: number, contexto: string): void {
    this.dialogo.set({ accion: 'restaurar', tipo, contenidoId, contexto });
  }

  protected alternarEstado(tema: Tema): void {
    this.notificaciones.resultado(this.foro.alternarEstadoTema(tema.id));
  }

  protected async eliminarTema(tema: Tema): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar tema',
      mensaje: `Vas a eliminar "${tema.titulo}" y todos sus comentarios. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar tema',
      peligro: true,
    });
    if (ok) {
      this.notificaciones.resultado(this.foro.eliminarTema(tema.id));
    }
  }

  protected async eliminarComentario(id: number): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar comentario',
      mensaje: 'El comentario se borrará de forma definitiva.',
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (ok) {
      this.notificaciones.resultado(this.foro.eliminarComentario(id));
    }
  }

  protected confirmarDialogo(datos: DatosSancion): void {
    const d = this.dialogo();
    if (!d) {
      return;
    }
    const resultado =
      d.accion === 'sancionar'
        ? this.moderacion.sancionarReporte(d.reporteId!, datos)
        : d.accion === 'banear'
          ? this.moderacion.banear(d.tipo, d.contenidoId, datos)
          : this.moderacion.restaurar(d.tipo, d.contenidoId, datos.motivo);
    if (this.notificaciones.resultado(resultado)) {
      this.dialogo.set(null);
    }
  }
}
