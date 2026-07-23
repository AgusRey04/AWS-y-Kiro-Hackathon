import { getClient } from '../db/index.js';
import type { Planificacion, Actividad, Material, Adaptacion } from '../models/index.js';
import { ApiErrorCode } from '../models/index.js';
import {
  generarPlanificacion,
  buscarEfemeridesCercanas,
  GeminiServiceError,
} from './gemini.service.js';

/**
 * Custom error for planificacion service operations.
 */
export class PlanificacionServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'PlanificacionServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Determine the category for the planificación based on nearby ephemerides.
 */
function determinarCategoria(fecha: Date): 'recientes' | 'efemerides' | 'proyectos' {
  const efemeridesCercanas = buscarEfemeridesCercanas(fecha);
  return efemeridesCercanas.length > 0 ? 'efemerides' : 'recientes';
}

/**
 * Create a new planificación by generating content with Gemini AI
 * and persisting all data to the database in a transaction.
 */
export async function crear(
  usuarioId: string,
  consigna: string
): Promise<Planificacion> {
  // Validate consigna
  if (!consigna || consigna.trim().length === 0 || consigna.length > 500) {
    throw new PlanificacionServiceError(
      ApiErrorCode.VALIDATION_ERROR,
      'La consigna debe tener entre 1 y 500 caracteres.',
      400
    );
  }

  // Generate planificación with Gemini
  const respuesta = await generarPlanificacion(consigna.trim());

  // Determine category
  const fecha = new Date();
  const categoria = determinarCategoria(fecha);

  // Persist to database in a transaction
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Insert planificacion
    const planResult = await client.query<{
      id: string;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO planificacion (
        usuario_id, titulo, consigna_original, fecha_inicio, fecha_fin,
        objetivos, area_curricular, ambito_experiencia, fundamentacion, categoria
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at, updated_at`,
      [
        usuarioId,
        respuesta.titulo,
        consigna.trim(),
        respuesta.fechaInicio,
        respuesta.fechaFin,
        respuesta.objetivos,
        respuesta.areaCurricular,
        respuesta.ambitoExperiencia,
        respuesta.fundamentacion,
        categoria,
      ]
    );

    const planificacionId = planResult.rows[0].id;
    const createdAt = planResult.rows[0].created_at;

    // Insert actividades
    const actividades: Actividad[] = [];
    for (let i = 0; i < respuesta.actividades.length; i++) {
      const act = respuesta.actividades[i];
      const actResult = await client.query<{ id: string }>(
        `INSERT INTO actividad (planificacion_id, dia, titulo, descripcion, orden)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [planificacionId, act.dia, act.titulo, act.descripcion, i + 1]
      );
      actividades.push({
        id: actResult.rows[0].id,
        dia: act.dia,
        titulo: act.titulo,
        descripcion: act.descripcion,
        orden: i + 1,
      });
    }

    // Insert materiales
    const materiales: Material[] = [];
    for (let i = 0; i < respuesta.materiales.length; i++) {
      const mat = respuesta.materiales[i];
      const matResult = await client.query<{ id: string }>(
        `INSERT INTO material (planificacion_id, nombre, icono, orden)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [planificacionId, mat.nombre, mat.icono, i + 1]
      );
      materiales.push({
        id: matResult.rows[0].id,
        nombre: mat.nombre,
        icono: mat.icono,
        orden: i + 1,
      });
    }

    // Insert adaptaciones
    const adaptaciones: Adaptacion[] = [];
    for (let i = 0; i < respuesta.adaptaciones.length; i++) {
      const adap = respuesta.adaptaciones[i];
      const adapResult = await client.query<{ id: string }>(
        `INSERT INTO adaptacion (planificacion_id, categoria, titulo, descripcion, orden)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [planificacionId, adap.categoria, adap.titulo, adap.descripcion, i + 1]
      );
      adaptaciones.push({
        id: adapResult.rows[0].id,
        categoria: adap.categoria,
        titulo: adap.titulo,
        descripcion: adap.descripcion,
        orden: i + 1,
      });
    }

    await client.query('COMMIT');

    // Build and return full Planificacion object
    const planificacion: Planificacion = {
      id: planificacionId,
      titulo: respuesta.titulo,
      consignaOriginal: consigna.trim(),
      fechaInicio: respuesta.fechaInicio,
      fechaFin: respuesta.fechaFin,
      objetivos: respuesta.objetivos,
      areaCurricular: respuesta.areaCurricular,
      ambitoExperiencia: respuesta.ambitoExperiencia,
      fundamentacion: respuesta.fundamentacion,
      categoria,
      actividades,
      materiales,
      adaptaciones,
      createdAt,
    };

    return planificacion;
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof GeminiServiceError || error instanceof PlanificacionServiceError) {
      throw error;
    }

    console.error('Error persisting planificación:', error);
    throw new PlanificacionServiceError(
      ApiErrorCode.INTERNAL_ERROR,
      'Error al guardar la planificación. Por favor, intentá de nuevo.',
      500
    );
  } finally {
    client.release();
  }
}
