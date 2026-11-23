import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';
import { Inicio } from './features/inicio/inicio';

/**
 * Rutas de la aplicación. Las páginas internas se cargan de forma diferida
 * (loadComponent / loadChildren) y quedan protegidas por authGuard o rolGuard.
 */
export const routes: Routes = [
  { path: '', component: Inicio, title: 'Inicio' },
  {
    path: 'explorar',
    title: 'Explorar temas',
    loadComponent: () => import('./features/temas/explorar/explorar').then((m) => m.Explorar),
  },
  {
    path: 'normas',
    title: 'Normas del foro',
    loadComponent: () => import('./features/paginas/normas').then((m) => m.NormasPublicas),
  },
  {
    path: 'categorias/:id',
    title: 'Categoría',
    loadComponent: () => import('./features/temas/categoria/categoria').then((m) => m.CategoriaPagina),
  },
  {
    path: 'temas/nuevo',
    title: 'Publicar tema',
    canActivate: [authGuard],
    loadComponent: () => import('./features/temas/tema-form/tema-form').then((m) => m.TemaForm),
  },
  {
    path: 'temas/:id/editar',
    title: 'Editar tema',
    canActivate: [authGuard],
    loadComponent: () => import('./features/temas/tema-form/tema-form').then((m) => m.TemaForm),
  },
  {
    path: 'temas/:id',
    title: 'Tema',
    loadComponent: () => import('./features/temas/detalle/detalle-tema').then((m) => m.DetalleTema),
  },
  {
    path: 'iniciar-sesion',
    title: 'Iniciar sesión',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Crear cuenta',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar contraseña',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/recuperar/recuperar').then((m) => m.Recuperar),
  },
  {
    path: 'mis-temas',
    title: 'Mis temas',
    canActivate: [authGuard],
    loadComponent: () => import('./features/temas/mis-temas/mis-temas').then((m) => m.MisTemas),
  },
  {
    path: 'mis-reportes',
    title: 'Mis reportes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/mis-reportes').then((m) => m.MisReportes),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadChildren: () => import('./features/perfil/perfil.routes').then((m) => m.PERFIL_RUTAS),
  },
  {
    path: 'moderacion',
    title: 'Panel de moderación',
    canActivate: [rolGuard],
    data: { roles: ['MODERADOR', 'ADMIN'] },
    loadComponent: () => import('./features/moderacion/panel-moderacion').then((m) => m.PanelModeracion),
  },
  {
    path: 'admin',
    canActivate: [rolGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_RUTAS),
  },
  {
    path: 'acceso-denegado',
    title: 'Acceso denegado',
    loadComponent: () => import('./features/paginas/acceso-denegado').then((m) => m.AccesoDenegado),
  },
  {
    path: '**',
    title: 'Página no encontrada',
    loadComponent: () => import('./features/paginas/no-encontrado').then((m) => m.NoEncontrado),
  },
];
