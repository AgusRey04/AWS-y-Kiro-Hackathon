-- Migration 004: Add 'semana' column to actividad
-- Permite que una planificación abarque más de una semana (lunes-viernes de la
-- semana 1, luego lunes-viernes de la semana 2, etc.).
-- Las filas existentes quedan en la semana 1 por el DEFAULT.

ALTER TABLE actividad
  ADD COLUMN IF NOT EXISTS semana INTEGER NOT NULL DEFAULT 1;

-- CHECK de valor mínimo 1 (idempotente: se recrea en cada corrida de migraciones)
ALTER TABLE actividad DROP CONSTRAINT IF EXISTS actividad_semana_check;
ALTER TABLE actividad ADD CONSTRAINT actividad_semana_check
  CHECK (semana >= 1);

-- Índice para el listado agrupado por semana y día
CREATE INDEX IF NOT EXISTS idx_actividad_planificacion_semana
  ON actividad(planificacion_id, semana, orden);
