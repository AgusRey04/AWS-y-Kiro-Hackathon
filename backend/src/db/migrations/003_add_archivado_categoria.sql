-- Migration 003: Add 'archivado' to the categoria CHECK constraint
-- This allows planificaciones to be archived by the user

-- Drop the existing constraint
ALTER TABLE planificacion DROP CONSTRAINT IF EXISTS planificacion_categoria_check;

-- Add updated constraint including 'archivado'
ALTER TABLE planificacion ADD CONSTRAINT planificacion_categoria_check
  CHECK (categoria IN ('recientes', 'efemerides', 'proyectos', 'archivado'));
