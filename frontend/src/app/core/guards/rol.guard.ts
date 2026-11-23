import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../facades/auth.facade';
import { Rol } from '../models/usuario.model';

/**
 * Revisa que el usuario tenga alguno de los roles de la ruta, declarados en
 * data: { roles: [...] }. Sin sesión manda al login; con un rol sin permiso
 * manda a la página de acceso denegado.
 */
export const rolGuard: CanActivateFn = (ruta, estado) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  const roles = (ruta.data['roles'] ?? []) as Rol[];
  if (!auth.estaAutenticado()) {
    return router.createUrlTree(['/iniciar-sesion'], { queryParams: { volver: estado.url } });
  }
  if (roles.length === 0 || auth.tieneRol(...roles)) {
    return true;
  }
  return router.createUrlTree(['/acceso-denegado']);
};
