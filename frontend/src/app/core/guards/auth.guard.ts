import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../facades/auth.facade';

/** Deja pasar solo con sesión iniciada. Si no, manda al login y recuerda a dónde iba. */
export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (auth.estaAutenticado()) {
    return true;
  }
  return router.createUrlTree(['/iniciar-sesion'], { queryParams: { volver: estado.url } });
};

/** Para el login, el registro y la recuperación: si ya hay sesión, va al inicio. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  return auth.estaAutenticado() ? router.createUrlTree(['/']) : true;
};
