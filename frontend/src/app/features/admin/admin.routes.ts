import { Routes } from '@angular/router';
import { AdminLayout } from './admin-layout';

/** Rutas de administración. La ruta padre ya exige el rol ADMIN con rolGuard. */
export const ADMIN_RUTAS: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      {
        path: 'usuarios',
        title: 'Administración de usuarios',
        loadComponent: () => import('./usuarios/admin-usuarios').then((m) => m.AdminUsuarios),
      },
      {
        path: 'categorias',
        title: 'Categorías',
        loadComponent: () => import('./categorias/admin-categorias').then((m) => m.AdminCategorias),
      },
      {
        path: 'normas',
        title: 'Normas del foro',
        loadComponent: () => import('./normas/admin-normas').then((m) => m.AdminNormas),
      },
      {
        path: 'sanciones',
        title: 'Historial de sanciones',
        loadComponent: () => import('./sanciones/historial-sanciones').then((m) => m.HistorialSanciones),
      },
    ],
  },
];
