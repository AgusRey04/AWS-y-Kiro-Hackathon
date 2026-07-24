/**
 * Servicio para buscar imágenes en Unsplash relacionadas al contenido de la planificación.
 * Usa la API de búsqueda con la Access Key configurada en .env
 */

const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

interface UnsplashPhoto {
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

/**
 * Extrae keywords de búsqueda a partir del título de la planificación.
 * Traduce conceptos comunes del jardín a términos que funcionan bien en Unsplash.
 */
function extraerKeywords(titulo: string): string {
  // Mapeo de palabras comunes en planificaciones a búsquedas que funcionan en Unsplash
  const mapeo: Record<string, string> = {
    'otoño': 'autumn leaves children',
    'invierno': 'winter children playing',
    'primavera': 'spring flowers children',
    'verano': 'summer children outdoor',
    'granja': 'farm animals children',
    'animales': 'animals children education',
    'cuerpo': 'children body movement',
    'emociones': 'children emotions happy',
    'bandera': 'argentina flag celebration',
    'patria': 'argentina flag kids',
    'huerta': 'garden plants children',
    'plantas': 'plants seeds children',
    'colores': 'colors painting children',
    'arte': 'art painting children',
    'música': 'music instruments children',
    'cuentos': 'children reading books',
    'familia': 'family children',
    'agua': 'water play children',
    'naturaleza': 'nature children outdoor',
    'juego': 'children playing kindergarten',
  };

  const tituloLower = titulo.toLowerCase();

  // Buscar la primera coincidencia en el mapeo
  for (const [keyword, searchTerm] of Object.entries(mapeo)) {
    if (tituloLower.includes(keyword)) {
      return searchTerm;
    }
  }

  // Fallback: usar "kindergarten children" + primera palabra significativa del título
  const palabras = tituloLower
    .split(/\s+/)
    .filter(p => p.length > 4 && !['para', 'sobre', 'desde', 'nivel', 'sala'].includes(p));

  if (palabras.length > 0) {
    return `children kindergarten ${palabras[0]}`;
  }

  return 'children kindergarten classroom';
}

/**
 * Busca una imagen en Unsplash relacionada al título de la planificación.
 * Devuelve la URL de la imagen en tamaño "small" (400px ancho) o null si falla.
 */
export async function buscarImagenUnsplash(titulo: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY no configurada, omitiendo imagen.');
    return null;
  }

  try {
    const query = extraerKeywords(titulo);
    const url = `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`Unsplash API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as UnsplashSearchResponse;

    if (data.results.length === 0) {
      return null;
    }

    // Usar tamaño "small" para las cards (eficiente en ancho de banda)
    return data.results[0].urls.small;
  } catch (error) {
    console.warn('Error buscando imagen en Unsplash:', error);
    return null;
  }
}
