import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, numberAttribute, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { ForoFacade } from '../../../core/facades/foro.facade';
import { ModeracionFacade } from '../../../core/facades/moderacion.facade';
import { Comentario } from '../../../core/models/foro.model';
import { DatosSancion, TipoContenido } from '../../../core/models/moderacion.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { LIMITES, sinSoloEspacios } from '../../../core/validators/agora.validators';
import { Avatar } from '../../../shared/components/avatar';
import { CampoError } from '../../../shared/components/campo-error';
import { ComentarioItem, PermisosComentario } from '../../../shared/components/comentario-item';
import { ContadorCaracteres } from '../../../shared/components/contador-caracteres';
import { DialogoMotivo } from '../../../shared/components/dialogo-motivo';
import { EstadoBadge } from '../../../shared/components/estado-badge';
import { EstadoVacio } from '../../../shared/components/estado-vacio';
import { TiempoRelativoPipe } from '../../../shared/pipes/tiempo-relativo.pipe';

type AccionDialogo = 'reportar' | 'banear' | 'restaurar';

interface Dialogo {
  accion: AccionDialogo;
  tipo: TipoContenido;
  id: number;
  contexto: string;
}

/** Página contenedora: detalle de un tema con sus comentarios y acciones según el rol. */
@Component({
  selector: 'app-detalle-tema',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    TiempoRelativoPipe,
    Avatar,
    EstadoBadge,
    EstadoVacio,
    ComentarioItem,
    CampoError,
    ContadorCaracteres,
    DialogoMotivo,
  ],
  templateUrl: './detalle-tema.html',
})
export class DetalleTema {
  protected readonly foro = inject(ForoFacade);
  protected readonly auth = inject(AuthFacade);
  protected readonly moderacion = inject(ModeracionFacade);
  private readonly notificaciones = inject(NotificacionService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly router = inject(Router);

  readonly id = input.required({ transform: numberAttribute });

  protected readonly tema = computed(() => this.foro.temaPorId(this.id()));
  protected readonly visible = computed(() => {
    const tema = this.tema();
    return !!tema && this.foro.puedeVerTema(tema);
  });
  protected readonly categoria = computed(() => {
    const tema = this.tema();
    return tema ? this.foro.categoriaPorId(tema.categoriaId) : undefined;
  });
  protected readonly comentarios = computed(() => this.foro.comentariosDeTema(this.id()));
  protected readonly comentariosVisibles = computed(
    () => this.comentarios().filter((c) => !c.baneado).length,
  );
  protected readonly autor = computed(() => {
    const tema = this.tema();
    return tema ? this.auth.usuarioPorNombre(tema.autor) : undefined;
  });

  protected readonly dialogo = signal<Dialogo | null>(null);
  protected readonly enviado = signal(false);
  protected readonly limites = LIMITES.comentario;
  protected readonly nuevoComentario = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(LIMITES.comentario.min),
      Validators.maxLength(LIMITES.comentario.max),
      sinSoloEspacios,
    ],
  });
  protected readonly formComentario = new FormGroup({ contenido: this.nuevoComentario });

  constructor() {
    // Cada vez que se abre un tema (o cambia el id en la URL) suma una vista.
    effect(() => {
      const id = this.id();
      untracked(() => this.foro.registrarVista(id));
    });
  }

  protected permisosDe(comentario: Comentario): PermisosComentario {
    const autenticado = this.auth.estaAutenticado();
    return {
      editar: this.foro.puedeEditarComentario(comentario),
      eliminar: this.foro.puedeEliminarComentario(comentario),
      reportar: autenticado && !this.foro.esAutor(comentario) && !comentario.baneado,
      moderar: this.auth.esModerador(),
    };
  }

  protected colorDe(nombreUsuario: string): string | undefined {
    return this.auth.usuarioPorNombre(nombreUsuario)?.colorAvatar;
  }

  protected comentar(): void {
    this.enviado.set(true);
    this.nuevoComentario.markAsTouched();
    if (this.nuevoComentario.invalid) {
      return;
    }
    const resultado = this.foro.comentar(this.id(), this.nuevoComentario.value);
    if (this.notificaciones.resultado(resultado)) {
      this.nuevoComentario.reset();
      this.enviado.set(false);
    }
  }

  protected editarComentario(id: number, contenido: string): void {
    this.notificaciones.resultado(this.foro.editarComentario(id, contenido));
  }

  protected async eliminarComentario(comentario: Comentario): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar comentario',
      mensaje: `Vas a eliminar el comentario de ${comentario.autor}. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (ok) {
      this.notificaciones.resultado(this.foro.eliminarComentario(comentario.id));
    }
  }

  protected alternarEstado(): void {
    this.notificaciones.resultado(this.foro.alternarEstadoTema(this.id()));
  }

  protected async eliminarTema(): Promise<void> {
    const tema = this.tema();
    if (!tema) {
      return;
    }
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar tema',
      mensaje: `Vas a eliminar "${tema.titulo}" junto con sus ${this.comentarios().length} comentarios. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar tema',
      peligro: true,
    });
    if (ok && this.notificaciones.resultado(this.foro.eliminarTema(tema.id))) {
      this.router.navigate(['/explorar']);
    }
  }

  protected abrirDialogo(accion: AccionDialogo, tipo: TipoContenido, id: number, contexto: string): void {
    if (accion === 'reportar' && this.moderacion.yaReportado(tipo, id)) {
      this.notificaciones.info('Ya reportaste este contenido. El equipo de moderación lo está revisando.');
      return;
    }
    this.dialogo.set({ accion, tipo, id, contexto });
  }

  protected confirmarDialogo(datos: DatosSancion): void {
    const d = this.dialogo();
    if (!d) {
      return;
    }
    let resultado;
    if (d.accion === 'reportar') {
      resultado = this.moderacion.reportar({
        tipoContenido: d.tipo,
        contenidoId: d.id,
        normaId: datos.normaId ?? 0,
        motivo: datos.motivo,
      });
    } else if (d.accion === 'banear') {
      resultado = this.moderacion.banear(d.tipo, d.id, datos);
    } else {
      resultado = this.moderacion.restaurar(d.tipo, d.id, datos.motivo);
    }
    if (this.notificaciones.resultado(resultado)) {
      this.dialogo.set(null);
    }
  }

  protected tituloDialogo(d: Dialogo): string {
    const objeto = d.tipo === 'TEMA' ? 'tema' : 'comentario';
    switch (d.accion) {
      case 'reportar':
        return `Reportar ${objeto}`;
      case 'banear':
        return `Banear ${objeto}`;
      default:
        return `Restaurar ${objeto}`;
    }
  }
}
