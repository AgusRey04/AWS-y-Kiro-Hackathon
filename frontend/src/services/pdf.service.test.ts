import { describe, it, expect } from 'vitest';
import { generateFilename, generatePdf } from './pdf.service';
import type { Planificacion } from '../types';

const mockPlanificacion: Planificacion = {
  id: '1',
  titulo: 'Explorando el Otoño',
  consignaOriginal: 'Esta semana trabajamos el otoño con sala de 4',
  fechaInicio: '2024-03-18',
  fechaFin: '2024-03-22',
  objetivos: [
    'Explorar las características del otoño',
    'Desarrollar la creatividad artística',
  ],
  areaCurricular: 'Ciencias Naturales',
  ambitoExperiencia: 'Exploración del ambiente natural',
  fundamentacion:
    'Esta planificación se fundamenta en el enfoque de exploración activa del entorno natural.',
  categoria: 'recientes',
  actividades: [
    {
      id: 'a1',
      dia: 'lunes',
      titulo: 'Paseo recolector',
      descripcion: 'Recorrido por el patio para recolectar hojas secas.',
      orden: 1,
    },
    {
      id: 'a2',
      dia: 'martes',
      titulo: 'Collage de hojas',
      descripcion: 'Crear un collage con las hojas recolectadas.',
      orden: 1,
    },
    {
      id: 'a3',
      dia: 'miercoles',
      titulo: 'Colores del otoño',
      descripcion: 'Pintar con témperas los colores cálidos del otoño.',
      orden: 1,
    },
    {
      id: 'a4',
      dia: 'jueves',
      titulo: 'Cuento sobre el otoño',
      descripcion: 'Lectura de un cuento relacionado con la estación.',
      orden: 1,
    },
    {
      id: 'a5',
      dia: 'viernes',
      titulo: 'Cierre con música',
      descripcion: 'Canción y baile sobre el viento y las hojas.',
      orden: 1,
    },
  ],
  materiales: [
    { id: 'm1', nombre: 'Hojas secas', icono: '🍂', orden: 1 },
    { id: 'm2', nombre: 'Témperas', icono: '🎨', orden: 2 },
  ],
  adaptaciones: [
    {
      id: 'ad1',
      categoria: 'Visual',
      titulo: 'Material en relieve',
      descripcion: 'Proveer texturas para niños con baja visión.',
      orden: 1,
    },
  ],
  createdAt: '2024-03-18T10:00:00Z',
};

describe('generateFilename', () => {
  it('genera nombre con formato correcto', () => {
    const result = generateFilename('Explorando el Otoño', '2024-03-18');
    expect(result).toBe('Explorando el Otoño - 2024-03-18.pdf');
  });

  it('incluye la extensión .pdf', () => {
    const result = generateFilename('Test', '2024-01-01');
    expect(result.endsWith('.pdf')).toBe(true);
  });

  it('trunca el nombre a máximo 100 caracteres', () => {
    const longTitle = 'A'.repeat(120);
    const result = generateFilename(longTitle, '2024-03-18');
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith('.pdf')).toBe(true);
  });

  it('maneja título vacío', () => {
    const result = generateFilename('', '2024-03-18');
    expect(result).toBe(' - 2024-03-18.pdf');
  });

  it('exactamente 100 caracteres para nombre largo', () => {
    // título + " - " + fecha = max 96 chars before .pdf
    const titulo = 'X'.repeat(90);
    const fecha = '2024-03-18';
    const result = generateFilename(titulo, fecha);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith('.pdf')).toBe(true);
  });
});

describe('generatePdf', () => {
  it('genera un documento jsPDF válido', () => {
    const doc = generatePdf(mockPlanificacion);
    expect(doc).toBeDefined();
    // jsPDF returns an object with getNumberOfPages method
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('genera un documento con formato A4', () => {
    const doc = generatePdf(mockPlanificacion);
    const pageInfo = doc.internal.pageSize;
    // A4: 210 x 297 mm
    expect(Math.round(pageInfo.getWidth())).toBe(210);
    expect(Math.round(pageInfo.getHeight())).toBe(297);
  });

  it('genera PDF con planificación que tiene muchas actividades', () => {
    const manyActivities = [];
    for (let i = 0; i < 20; i++) {
      manyActivities.push({
        id: `act-${i}`,
        dia: (['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const)[i % 5],
        titulo: `Actividad número ${i + 1}`,
        descripcion: 'Descripción extensa de la actividad. '.repeat(10),
        orden: Math.floor(i / 5) + 1,
      });
    }

    const largePlan: Planificacion = {
      ...mockPlanificacion,
      actividades: manyActivities,
    };

    const doc = generatePdf(largePlan);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('maneja planificación con listas vacías', () => {
    const emptyPlan: Planificacion = {
      ...mockPlanificacion,
      actividades: [],
      materiales: [],
      adaptaciones: [],
      objetivos: [],
    };

    const doc = generatePdf(emptyPlan);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
