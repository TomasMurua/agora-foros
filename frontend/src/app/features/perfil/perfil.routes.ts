import { Routes } from '@angular/router';

export const PERFIL_RUTAS: Routes = [
  {
    path: '',
    title: 'Mi perfil',
    loadComponent: () => import('./perfil').then((m) => m.Perfil),
  },
  {
    path: 'editar',
    title: 'Modificar perfil',
    loadComponent: () => import('./editar-perfil').then((m) => m.EditarPerfil),
  },
];
