import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/*
 * Validadores propios de Ágora Foros. Se usan junto a los de Angular
 * (Validators.required, minLength, maxLength) y repiten las mismas reglas que
 * se declaran como atributos HTML en las plantillas.
 */

/** Patrones compartidos entre los atributos "pattern" del HTML y los validadores. */
export const PATRONES = {
  nombreUsuario: '^[a-z0-9._]{3,30}$',
  nombrePersona: "^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{2,60}$",
  correo: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$',
  codigo: '^[0-9]{6}$',
} as const;

export const LIMITES = {
  password: { min: 8, max: 20 },
  nombreUsuario: { min: 3, max: 30 },
  nombrePersona: { min: 2, max: 60 },
  correo: { max: 120 },
  bio: { max: 300 },
  tituloTema: { min: 5, max: 150 },
  contenidoTema: { min: 20, max: 4000 },
  comentario: { min: 2, max: 2000 },
  motivo: { min: 10, max: 300 },
  nombreCategoria: { min: 3, max: 60 },
  descripcion: { max: 300 },
  tituloNorma: { min: 5, max: 80 },
  descripcionNorma: { min: 10, max: 300 },
} as const;

/** Una regla de la contraseña, con su mensaje para la lista de verificación. */
export interface ReglaPassword {
  clave: string;
  mensaje: string;
  cumple: (valor: string, nombreUsuario: string) => boolean;
}

export const REGLAS_PASSWORD: readonly ReglaPassword[] = [
  {
    clave: 'pwLongitud',
    mensaje: 'Entre 8 y 20 caracteres',
    cumple: (v) => v.length >= LIMITES.password.min && v.length <= LIMITES.password.max,
  },
  { clave: 'pwMayuscula', mensaje: 'Al menos una letra mayúscula', cumple: (v) => /[A-ZÁÉÍÓÚÑ]/.test(v) },
  { clave: 'pwMinuscula', mensaje: 'Al menos una letra minúscula', cumple: (v) => /[a-záéíóúñ]/.test(v) },
  { clave: 'pwNumero', mensaje: 'Al menos un número', cumple: (v) => /\d/.test(v) },
  {
    clave: 'pwEspecial',
    mensaje: 'Al menos un carácter especial (por ejemplo ! @ # $ %)',
    cumple: (v) => /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s]/.test(v),
  },
  { clave: 'pwSinEspacios', mensaje: 'Sin espacios', cumple: (v) => !/\s/.test(v) },
  {
    clave: 'pwContieneUsuario',
    mensaje: 'No debe contener tu nombre de usuario',
    cumple: (v, usuario) => !usuario || !v.toLowerCase().includes(usuario.toLowerCase()),
  },
];

/**
 * Valida todas las reglas de la contraseña. Devuelve un error por cada regla
 * que no se cumple, así cada una tiene su propio mensaje.
 * @param obtenerUsuario entrega el nombre de usuario contra el que se compara.
 */
export function passwordSegura(obtenerUsuario: () => string | null | undefined = () => ''): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = (control.value ?? '') as string;
    if (valor === '') {
      return null;
    }
    const usuario = (obtenerUsuario() ?? '').trim();
    const errores: ValidationErrors = {};
    for (const regla of REGLAS_PASSWORD) {
      if (!regla.cumple(valor, usuario)) {
        errores[regla.clave] = true;
      }
    }
    return Object.keys(errores).length ? errores : null;
  };
}

/**
 * Validador de grupo: el campo "confirmacion" debe ser igual a "original".
 * El error queda en el grupo y también en el control de confirmación.
 */
export function camposIguales(original: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const a = grupo.get(original);
    const b = grupo.get(confirmacion);
    if (!a || !b) {
      return null;
    }
    const otrosErrores = { ...(b.errors ?? {}) };
    delete otrosErrores['noCoincide'];
    if (b.value && a.value !== b.value) {
      b.setErrors({ ...otrosErrores, noCoincide: true });
      return { noCoincide: true };
    }
    b.setErrors(Object.keys(otrosErrores).length ? otrosErrores : null);
    return null;
  };
}

/** Correo con formato nombre@dominio.ext. Más estricto que Validators.email. */
export function correoValido(control: AbstractControl): ValidationErrors | null {
  const valor = ((control.value ?? '') as string).trim();
  if (valor === '') {
    return null;
  }
  return new RegExp(PATRONES.correo).test(valor) ? null : { correo: true };
}

/** Nombre de usuario: 3 a 30 caracteres, minúsculas, números, punto y guion bajo. */
export function nombreUsuarioValido(control: AbstractControl): ValidationErrors | null {
  const valor = (control.value ?? '') as string;
  if (valor === '') {
    return null;
  }
  return new RegExp(PATRONES.nombreUsuario).test(valor) ? null : { nombreUsuario: true };
}

/** Nombre de persona: 2 a 60 letras y espacios, con tildes y ñ. */
export function nombrePersonaValido(control: AbstractControl): ValidationErrors | null {
  const valor = (control.value ?? '') as string;
  if (valor === '') {
    return null;
  }
  return new RegExp(PATRONES.nombrePersona).test(valor.trim()) ? null : { nombrePersona: true };
}

/** Rechaza textos formados solo por espacios (required no los detecta). */
export function sinSoloEspacios(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (typeof valor !== 'string' || valor === '') {
    return null;
  }
  return valor.trim() === '' ? { soloEspacios: true } : null;
}

/**
 * El valor no debe existir ya en los datos (nombre de usuario, correo,
 * nombre de categoría...). La función "existe" la entrega la fachada.
 */
export function valorUnico(existe: (valor: string) => boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = ((control.value ?? '') as string).trim();
    if (valor === '') {
      return null;
    }
    return existe(valor) ? { yaExiste: true } : null;
  };
}

/** Código de verificación de 6 dígitos. */
export function codigoVerificacion(control: AbstractControl): ValidationErrors | null {
  const valor = ((control.value ?? '') as string).trim();
  if (valor === '') {
    return null;
  }
  return new RegExp(PATRONES.codigo).test(valor) ? null : { codigo: true };
}

/** Mensajes por defecto para cada clave de error. */
export function mensajeDeError(clave: string, detalle: unknown): string {
  const info = (detalle ?? {}) as { requiredLength?: number };
  switch (clave) {
    case 'required':
      return 'Este campo es obligatorio.';
    case 'requiredTrue':
      return 'Debes aceptar para continuar.';
    case 'minlength':
      return `Debe tener al menos ${info.requiredLength} caracteres.`;
    case 'maxlength':
      return `No puede superar los ${info.requiredLength} caracteres.`;
    case 'email':
    case 'correo':
      return 'Ingresa un correo válido, por ejemplo nombre@dominio.cl.';
    case 'nombreUsuario':
      return 'Usa de 3 a 30 caracteres: minúsculas, números, punto o guion bajo.';
    case 'nombrePersona':
      return 'Usa solo letras y espacios (de 2 a 60 caracteres).';
    case 'soloEspacios':
      return 'El texto no puede tener solo espacios.';
    case 'yaExiste':
      return 'Este valor ya está registrado.';
    case 'noCoincide':
      return 'Las contraseñas no coinciden.';
    case 'codigo':
      return 'El código tiene 6 dígitos.';
    case 'pattern':
      return 'El formato no es válido.';
    default: {
      const regla = REGLAS_PASSWORD.find((r) => r.clave === clave);
      return regla ? `La contraseña debe cumplir: ${regla.mensaje.toLowerCase()}.` : 'El valor no es válido.';
    }
  }
}
