/**
 * Utility to provide default suggestion chips based on the current season.
 * This is a simple client-side helper; the full API integration comes in task 11.1.
 */

interface SeasonData {
  nombre: string;
  meses: number[];
  sugerencias: string[];
}

const estaciones: SeasonData[] = [
  {
    nombre: 'verano',
    meses: [12, 1, 2],
    sugerencias: [
      'Juegos con agua y aire libre',
      'Protección solar e hidratación',
      'Exploración sensorial con arena y agua',
      'Vacaciones y tiempo libre',
    ],
  },
  {
    nombre: 'otoño',
    meses: [3, 4, 5],
    sugerencias: [
      'Recolección de hojas y colores cálidos',
      'Cambios estacionales y el viento',
      'Cosecha otoñal y frutas de estación',
      'Collage con hojas secas',
    ],
  },
  {
    nombre: 'invierno',
    meses: [6, 7, 8],
    sugerencias: [
      'Sopas calentitas y abrigos',
      'Experimentos con hielo',
      'La familia y el hogar',
      'Arte con colores fríos',
    ],
  },
  {
    nombre: 'primavera',
    meses: [9, 10, 11],
    sugerencias: [
      'Germinación y observación de flores',
      'Plantar semillas y medir plantas',
      'Insectos de primavera',
      'Arte con elementos naturales',
    ],
  },
];

/**
 * Returns the current season based on a given month (1-12).
 */
export function getSeasonByMonth(month: number): SeasonData | undefined {
  return estaciones.find((e) => e.meses.includes(month));
}

/**
 * Returns between 2 and 5 suggestion chip texts based on the current season.
 */
export function getDefaultSuggestions(date: Date = new Date()): string[] {
  const month = date.getMonth() + 1; // JS months are 0-indexed
  const season = getSeasonByMonth(month);

  if (!season) {
    return ['Juegos cooperativos', 'Expresión artística'];
  }

  // Return between 2 and 5 suggestions (slice the first 4 from the season)
  const suggestions = season.sugerencias.slice(0, 4);
  return suggestions.length >= 2 ? suggestions : suggestions.concat(['Juegos cooperativos']).slice(0, 3);
}
