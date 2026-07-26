-- Migration 002: Auto-update updated_at timestamp on row modification

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for usuario table (idempotente: el runner corre todas las migraciones)
DROP TRIGGER IF EXISTS trigger_usuario_updated_at ON usuario;
CREATE TRIGGER trigger_usuario_updated_at
  BEFORE UPDATE ON usuario
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for planificacion table (idempotente)
DROP TRIGGER IF EXISTS trigger_planificacion_updated_at ON planificacion;
CREATE TRIGGER trigger_planificacion_updated_at
  BEFORE UPDATE ON planificacion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
