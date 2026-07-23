-- Migration 001: Create core tables for EduPlanner
-- Tables: usuario, planificacion, actividad, material, adaptacion

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USUARIO table
-- ============================================
CREATE TABLE IF NOT EXISTS usuario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  escuela VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique index on email for login lookups and duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);

-- ============================================
-- PLANIFICACION table
-- ============================================
CREATE TABLE IF NOT EXISTS planificacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  consigna_original VARCHAR(500) NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  objetivos TEXT[] DEFAULT '{}',
  area_curricular VARCHAR(255),
  ambito_experiencia VARCHAR(255),
  fundamentacion TEXT,
  categoria VARCHAR(20) NOT NULL DEFAULT 'recientes'
    CHECK (categoria IN ('recientes', 'efemerides', 'proyectos')),
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Composite index for history queries (filter by user, sort by creation date)
CREATE INDEX IF NOT EXISTS idx_planificacion_usuario_created
  ON planificacion(usuario_id, created_at DESC);

-- ============================================
-- ACTIVIDAD table
-- ============================================
CREATE TABLE IF NOT EXISTS actividad (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planificacion_id UUID NOT NULL REFERENCES planificacion(id) ON DELETE CASCADE,
  dia VARCHAR(10) NOT NULL
    CHECK (dia IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes')),
  titulo VARCHAR(500) NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- MATERIAL table
-- ============================================
CREATE TABLE IF NOT EXISTS material (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planificacion_id UUID NOT NULL REFERENCES planificacion(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  icono VARCHAR(10),
  orden INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- ADAPTACION table
-- ============================================
CREATE TABLE IF NOT EXISTS adaptacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planificacion_id UUID NOT NULL REFERENCES planificacion(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL,
  titulo VARCHAR(500) NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0
);
