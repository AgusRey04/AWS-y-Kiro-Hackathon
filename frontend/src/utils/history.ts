/**
 * Utilidades del Historial de planificaciones.
 * Requirements: 7.1 (descripción truncada a un máximo de 80 caracteres)
 */

/** Máximo de caracteres visibles de la descripción en una card del historial. */
export const MAX_DESCRIPCION_CARD = 80;

/**
 * Trunca el texto de la descripción para que nunca supere `max` caracteres,
 * incluyendo el indicador de continuidad ("...").
 *
 * El backend ya entrega descripciones acortadas, pero puede agregar el sufijo
 * "..." superando el límite del Req 7.1, por eso la card vuelve a normalizar.
 */
export function truncarDescripcion(
  texto: string | null | undefined,
  max: number = MAX_DESCRIPCION_CARD
): string {
  const limpio = (texto ?? '').trim();

  if (max <= 0) return '';
  if (limpio.length <= max) return limpio;
  if (max <= 3) return limpio.slice(0, max);

  return limpio.slice(0, max - 3).trimEnd() + '...';
}
