import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { GeminiPlanificacionResponse, Efemeride } from '../models/index.js';
import { ApiErrorCode } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load static data
const dataPath = join(__dirname, '..', 'data', 'efemerides.json');
const datosEstaticos = JSON.parse(readFileSync(dataPath, 'utf-8'));

const TIMEOUT_MS = 60_000;

/**
 * Determine the current season based on Southern Hemisphere calendar.
 */
export function obtenerEstacion(fecha: Date): string {
  const mes = fecha.getMonth() + 1; // 1-12
  if ([12, 1, 2].includes(mes)) return 'verano';
  if ([3, 4, 5].includes(mes)) return 'otoño';
  if ([6, 7, 8].includes(mes)) return 'invierno';
  return 'primavera';
}

/**
 * Find ephemerides within the next 7 days from a given date.
 */
export function buscarEfemeridesCercanas(fecha: Date): Efemeride[] {
  const efemerides: Efemeride[] = datosEstaticos.efemerides;
  const cercanas: Efemeride[] = [];

  for (let i = 0; i <= 7; i++) {
    const dia = new Date(fecha);
    dia.setDate(dia.getDate() + i);
    const mmdd = `${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
    
    const encontradas = efemerides.filter(e => e.fecha === mmdd);
    cercanas.push(...encontradas);
  }

  return cercanas;
}

/**
 * Build the prompt for Gemini API including curricular context,
 * season, and nearby ephemerides.
 */
export function construirPrompt(consigna: string, fecha: Date): string {
  const estacion = obtenerEstacion(fecha);
  const efemeridesCercanas = buscarEfemeridesCercanas(fecha);

  const estacionData = datosEstaticos.estaciones.find(
    (e: { nombre: string }) => e.nombre === estacion
  );

  let prompt = `Sos una experta en educación de nivel inicial en la provincia de Santa Fe, Argentina.
Tu tarea es generar una planificación semanal completa para una docente de jardín de infantes.

## Contexto Curricular
- Nivel: Inicial (jardín de infantes)
- Provincia: Santa Fe, Argentina
- Marco curricular: Diseño Curricular de Santa Fe para Nivel Inicial
- Ámbitos de experiencia del diseño curricular: Formación Personal y Social, Exploración del Ambiente, Comunicación y Expresión, Juego

## Consigna de la docente
"${consigna}"

## Estación del año actual
Estamos en ${estacion} (hemisferio sur).
La fecha de hoy es ${fecha.toISOString().split('T')[0]}.`;

  if (estacionData) {
    prompt += `\nSugerencias estacionales: ${estacionData.sugerencias[0]}`;
  }

  if (efemeridesCercanas.length > 0) {
    prompt += `\n\n## Efemérides próximas (dentro de los próximos 7 días)`;
    for (const ef of efemeridesCercanas) {
      prompt += `\n- ${ef.nombre} (${ef.fecha}): ${ef.descripcion}`;
    }
    prompt += `\nIntegrá referencia a estas efemérides en la planificación cuando sea pertinente.`;
  }

  prompt += `

## Instrucciones de generación
1. Generá un título creativo y descriptivo para la planificación.
2. Las fechas deben corresponder a la semana próxima (lunes a viernes).
3. Incluí entre 2 y 4 objetivos pedagógicos claros y medibles.
4. Especificá el área curricular principal.
5. Indicá el ámbito de experiencia del Diseño Curricular de Santa Fe que se vincula.
6. Generá al menos una actividad para cada día de la semana (lunes a viernes).
7. Incluí una lista de materiales necesarios con un ícono emoji representativo.
8. Incluí adaptaciones de inclusión para necesidades educativas específicas.
9. Escribí una fundamentación pedagógica que sustente la planificación.
10. Todo el contenido debe ser apropiado para niños de 3 a 5 años.
11. Las actividades deben ser variadas, lúdicas y considerar la estación actual (${estacion}).`;

  return prompt;
}

/**
 * JSON Schema for structured output from Gemini.
 */
const responseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    titulo: { type: SchemaType.STRING, description: 'Título creativo de la planificación' },
    fechaInicio: { type: SchemaType.STRING, description: 'Fecha de inicio en formato ISO (YYYY-MM-DD)' },
    fechaFin: { type: SchemaType.STRING, description: 'Fecha de fin en formato ISO (YYYY-MM-DD)' },
    objetivos: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Entre 2 y 4 objetivos pedagógicos',
    },
    areaCurricular: { type: SchemaType.STRING, description: 'Área curricular principal' },
    ambitoExperiencia: { type: SchemaType.STRING, description: 'Ámbito de experiencia del Diseño Curricular de Santa Fe' },
    actividades: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          semana: { type: SchemaType.INTEGER, description: 'Número de semana de la planificación, empezando en 1' },
          dia: { type: SchemaType.STRING, description: 'Día de la semana: lunes, martes, miercoles, jueves o viernes' },
          titulo: { type: SchemaType.STRING, description: 'Título de la actividad' },
          descripcion: { type: SchemaType.STRING, description: 'Descripción detallada de la actividad' },
        },
        required: ['dia', 'titulo', 'descripcion'],
      },
      description: 'Al menos una actividad por cada día de lunes a viernes',
    },
    materiales: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          nombre: { type: SchemaType.STRING, description: 'Nombre del material' },
          icono: { type: SchemaType.STRING, description: 'Emoji representativo del material' },
        },
        required: ['nombre', 'icono'],
      },
      description: 'Lista de materiales necesarios',
    },
    adaptaciones: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          categoria: { type: SchemaType.STRING, description: 'Categoría de la adaptación (ej: motriz, cognitiva, sensorial)' },
          titulo: { type: SchemaType.STRING, description: 'Título de la adaptación' },
          descripcion: { type: SchemaType.STRING, description: 'Descripción de la estrategia de adaptación' },
        },
        required: ['categoria', 'titulo', 'descripcion'],
      },
      description: 'Adaptaciones de inclusión',
    },
    fundamentacion: { type: SchemaType.STRING, description: 'Fundamentación pedagógica que sustenta la planificación' },
  },
  required: [
    'titulo', 'fechaInicio', 'fechaFin', 'objetivos',
    'areaCurricular', 'ambitoExperiencia', 'actividades',
    'materiales', 'adaptaciones', 'fundamentacion',
  ],
};

/**
 * Custom error class for Gemini service errors.
 */
export class GeminiServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Validate the response structure from Gemini.
 */
export function validarRespuesta(data: unknown): data is GeminiPlanificacionResponse {
  if (!data || typeof data !== 'object') return false;

  const resp = data as Record<string, unknown>;

  // Non-empty title
  if (typeof resp.titulo !== 'string' || resp.titulo.trim().length === 0) return false;

  // Valid dates
  if (typeof resp.fechaInicio !== 'string' || resp.fechaInicio.trim().length === 0) return false;
  if (typeof resp.fechaFin !== 'string' || resp.fechaFin.trim().length === 0) return false;

  // 2-4 objectives
  if (!Array.isArray(resp.objetivos) || resp.objetivos.length < 2 || resp.objetivos.length > 4) return false;
  if (resp.objetivos.some((o: unknown) => typeof o !== 'string' || (o as string).trim().length === 0)) return false;

  // Non-empty area curricular
  if (typeof resp.areaCurricular !== 'string' || resp.areaCurricular.trim().length === 0) return false;

  // Non-empty ámbito experiencia
  if (typeof resp.ambitoExperiencia !== 'string' || resp.ambitoExperiencia.trim().length === 0) return false;

  // Activities: at least one per weekday
  if (!Array.isArray(resp.actividades)) return false;
  const diasRequeridos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const diasPresentes = new Set(
    (resp.actividades as Array<{ dia: string }>).map(a => a.dia)
  );
  for (const dia of diasRequeridos) {
    if (!diasPresentes.has(dia)) return false;
  }
  for (const act of resp.actividades as Array<Record<string, unknown>>) {
    if (typeof act.titulo !== 'string' || (act.titulo as string).trim().length === 0) return false;
    if (typeof act.descripcion !== 'string' || (act.descripcion as string).trim().length === 0) return false;
  }

  // Materials list (can be empty but must be array)
  if (!Array.isArray(resp.materiales)) return false;

  // Adaptaciones list (can be empty but must be array)
  if (!Array.isArray(resp.adaptaciones)) return false;

  // Non-empty fundamentacion
  if (typeof resp.fundamentacion !== 'string' || resp.fundamentacion.trim().length === 0) return false;

  return true;
}

/**
 * Lista de modelos en orden de preferencia. Si uno falla por rate limit (429),
 * se intenta con el siguiente.
 */
const MODELS = ['gemini-3-flash-preview',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/**
 * Call Gemini API to generate a planificación.
 * Intenta con cada modelo en orden; si recibe 429 (rate limit), pasa al siguiente.
 */
export async function generarPlanificacion(consigna: string): Promise<GeminiPlanificacionResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiServiceError(
      ApiErrorCode.AI_GENERATION_FAILED,
      'La clave de API de Gemini no está configurada',
      502
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const fecha = new Date();
  const prompt = construirPrompt(consigna, fecha);

  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    // Race between generation and timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new GeminiServiceError(
          ApiErrorCode.AI_TIMEOUT,
          'La generación de la planificación tardó demasiado. Por favor, intentá de nuevo.',
          504
        ));
      }, TIMEOUT_MS);
    });

    let result;
    try {
      console.log(`Intentando generar con modelo: ${modelName}`);
      result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise,
      ]);
    } catch (error) {
      if (error instanceof GeminiServiceError) throw error;

      // Si es rate limit (429) o resource exhausted, intentar con el siguiente modelo
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        console.warn(`Modelo ${modelName} agotado, intentando siguiente...`);
        lastError = error instanceof Error ? error : new Error(errMsg);
        continue;
      }

      throw new GeminiServiceError(
        ApiErrorCode.AI_GENERATION_FAILED,
        'No pudimos generar tu planificación. Por favor, intentá de nuevo.',
        502
      );
    }

    // Parse JSON response
    let parsed: unknown;
    try {
      const responseText = result.response.text();
      parsed = JSON.parse(responseText);
    } catch {
      throw new GeminiServiceError(
        ApiErrorCode.AI_PARSE_ERROR,
        'Hubo un problema procesando la respuesta de la IA. ¿Reintentamos?',
        422
      );
    }

    // Validate structure
    if (!validarRespuesta(parsed)) {
      throw new GeminiServiceError(
        ApiErrorCode.AI_PARSE_ERROR,
        'La respuesta de la IA no tiene el formato esperado. Por favor, intentá de nuevo.',
        422
      );
    }

    console.log(`Planificación generada exitosamente con modelo: ${modelName}`);
    return parsed;
  }

  // Si todos los modelos fallaron
  throw new GeminiServiceError(
    ApiErrorCode.AI_GENERATION_FAILED,
    'Todos los modelos de IA están agotados. Por favor, intentá más tarde.',
    502
  );
}
