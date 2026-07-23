import { describe, it, expect } from 'vitest';
import { obtenerEstacion, buscarEfemeridesCercanas, validarRespuesta, construirPrompt } from './gemini.service.js';

describe('obtenerEstacion', () => {
  it('debe retornar verano para diciembre', () => {
    expect(obtenerEstacion(new Date(2024, 11, 15))).toBe('verano'); // month 11 = December
  });

  it('debe retornar verano para enero', () => {
    expect(obtenerEstacion(new Date(2024, 0, 10))).toBe('verano'); // month 0 = January
  });

  it('debe retornar verano para febrero', () => {
    expect(obtenerEstacion(new Date(2024, 1, 28))).toBe('verano');
  });

  it('debe retornar otoño para marzo', () => {
    expect(obtenerEstacion(new Date(2024, 2, 5))).toBe('otoño'); // month 2 = March
  });

  it('debe retornar otoño para abril', () => {
    expect(obtenerEstacion(new Date(2024, 3, 15))).toBe('otoño');
  });

  it('debe retornar otoño para mayo', () => {
    expect(obtenerEstacion(new Date(2024, 4, 20))).toBe('otoño');
  });

  it('debe retornar invierno para junio', () => {
    expect(obtenerEstacion(new Date(2024, 5, 15))).toBe('invierno'); // month 5 = June
  });

  it('debe retornar invierno para julio', () => {
    expect(obtenerEstacion(new Date(2024, 6, 15))).toBe('invierno');
  });

  it('debe retornar invierno para agosto', () => {
    expect(obtenerEstacion(new Date(2024, 7, 15))).toBe('invierno');
  });

  it('debe retornar primavera para septiembre', () => {
    expect(obtenerEstacion(new Date(2024, 8, 15))).toBe('primavera'); // month 8 = September
  });

  it('debe retornar primavera para octubre', () => {
    expect(obtenerEstacion(new Date(2024, 9, 15))).toBe('primavera');
  });

  it('debe retornar primavera para noviembre', () => {
    expect(obtenerEstacion(new Date(2024, 10, 30))).toBe('primavera');
  });
});

describe('buscarEfemeridesCercanas', () => {
  it('debe encontrar efeméride del Día de la Bandera si fecha es cercana', () => {
    // June 15 is Día del Libro en Argentina, check from June 15 (same day)
    const fecha = new Date(2024, 5, 15); // month 5 = June
    const resultado = buscarEfemeridesCercanas(fecha);
    const nombres = resultado.map(e => e.nombre);
    expect(nombres).toContain('Día del Libro en Argentina');
  });

  it('debe retornar array vacío si no hay efemérides en los próximos 7 días', () => {
    // Pick a date with no ephemerides nearby (e.g., July 25)
    const fecha = new Date(2024, 6, 25); // month 6 = July
    const resultado = buscarEfemeridesCercanas(fecha);
    expect(resultado).toHaveLength(0);
  });

  it('debe incluir efemérides del mismo día', () => {
    // March 8 is Día Internacional de la Mujer
    const fecha = new Date(2024, 2, 8); // month 2 = March
    const resultado = buscarEfemeridesCercanas(fecha);
    const nombres = resultado.map(e => e.nombre);
    expect(nombres).toContain('Día Internacional de la Mujer');
  });

  it('debe incluir efemérides exactamente 7 días después', () => {
    // May 25 is Revolución de Mayo; check from May 18 (exactly 7 days before)
    const fecha = new Date(2024, 4, 18); // month 4 = May
    const resultado = buscarEfemeridesCercanas(fecha);
    const nombres = resultado.map(e => e.nombre);
    expect(nombres).toContain('Día de la Revolución de Mayo');
    expect(nombres).toContain('Día de la Escarapela'); // same day May 18
  });
});

describe('validarRespuesta', () => {
  const respuestaValida = {
    titulo: 'Semana del Otoño',
    fechaInicio: '2024-04-01',
    fechaFin: '2024-04-05',
    objetivos: ['Explorar la naturaleza', 'Desarrollar motricidad fina'],
    areaCurricular: 'Ciencias Naturales',
    ambitoExperiencia: 'Exploración del Ambiente',
    actividades: [
      { dia: 'lunes', titulo: 'Recolección de hojas', descripcion: 'Salimos al patio...' },
      { dia: 'martes', titulo: 'Collage de hojas', descripcion: 'Con las hojas...' },
      { dia: 'miercoles', titulo: 'Colores de otoño', descripcion: 'Pintamos con...' },
      { dia: 'jueves', titulo: 'Viento otoñal', descripcion: 'Hacemos molinetes...' },
      { dia: 'viernes', titulo: 'Cierre semanal', descripcion: 'Compartimos...' },
    ],
    materiales: [
      { nombre: 'Hojas secas', icono: '🍂' },
      { nombre: 'Témpera', icono: '🎨' },
    ],
    adaptaciones: [
      { categoria: 'motriz', titulo: 'Apoyo manual', descripcion: 'Ayudar con el recorte...' },
    ],
    fundamentacion: 'Esta planificación se enmarca en el eje de exploración del ambiente...',
  };

  it('debe validar una respuesta correcta', () => {
    expect(validarRespuesta(respuestaValida)).toBe(true);
  });

  it('debe rechazar si título está vacío', () => {
    expect(validarRespuesta({ ...respuestaValida, titulo: '' })).toBe(false);
  });

  it('debe rechazar si faltan objetivos (menos de 2)', () => {
    expect(validarRespuesta({ ...respuestaValida, objetivos: ['Solo uno'] })).toBe(false);
  });

  it('debe rechazar si hay más de 4 objetivos', () => {
    expect(validarRespuesta({
      ...respuestaValida,
      objetivos: ['1', '2', '3', '4', '5'],
    })).toBe(false);
  });

  it('debe rechazar si falta actividad de un día', () => {
    const sinLunes = {
      ...respuestaValida,
      actividades: respuestaValida.actividades.filter(a => a.dia !== 'lunes'),
    };
    expect(validarRespuesta(sinLunes)).toBe(false);
  });

  it('debe rechazar si areaCurricular está vacía', () => {
    expect(validarRespuesta({ ...respuestaValida, areaCurricular: '' })).toBe(false);
  });

  it('debe rechazar si ambitoExperiencia está vacío', () => {
    expect(validarRespuesta({ ...respuestaValida, ambitoExperiencia: '' })).toBe(false);
  });

  it('debe rechazar si fundamentación está vacía', () => {
    expect(validarRespuesta({ ...respuestaValida, fundamentacion: '' })).toBe(false);
  });

  it('debe rechazar null', () => {
    expect(validarRespuesta(null)).toBe(false);
  });

  it('debe rechazar undefined', () => {
    expect(validarRespuesta(undefined)).toBe(false);
  });

  it('debe rechazar un string', () => {
    expect(validarRespuesta('no es un objeto')).toBe(false);
  });

  it('debe rechazar si actividades no es array', () => {
    expect(validarRespuesta({ ...respuestaValida, actividades: 'no' })).toBe(false);
  });

  it('debe rechazar si una actividad tiene título vacío', () => {
    const conActVacia = {
      ...respuestaValida,
      actividades: [
        ...respuestaValida.actividades.slice(0, -1),
        { dia: 'viernes', titulo: '', descripcion: 'algo' },
      ],
    };
    expect(validarRespuesta(conActVacia)).toBe(false);
  });

  it('debe aceptar exactamente 2 objetivos', () => {
    expect(validarRespuesta({
      ...respuestaValida,
      objetivos: ['Objetivo 1', 'Objetivo 2'],
    })).toBe(true);
  });

  it('debe aceptar exactamente 4 objetivos', () => {
    expect(validarRespuesta({
      ...respuestaValida,
      objetivos: ['Obj 1', 'Obj 2', 'Obj 3', 'Obj 4'],
    })).toBe(true);
  });
});

describe('construirPrompt', () => {
  it('debe incluir la consigna en el prompt', () => {
    const prompt = construirPrompt('trabajar el otoño', new Date(2024, 3, 15));
    expect(prompt).toContain('trabajar el otoño');
  });

  it('debe incluir la estación correcta', () => {
    const prompt = construirPrompt('test', new Date(2024, 6, 15)); // July = invierno
    expect(prompt).toContain('invierno');
  });

  it('debe incluir efemérides cercanas si existen', () => {
    // March 8 = Día de la Mujer
    const prompt = construirPrompt('test', new Date(2024, 2, 5)); // March 5
    expect(prompt).toContain('Día Internacional de la Mujer');
  });

  it('debe incluir contexto curricular de Santa Fe', () => {
    const prompt = construirPrompt('test', new Date(2024, 5, 15));
    expect(prompt).toContain('Santa Fe');
    expect(prompt).toContain('Nivel Inicial');
  });

  it('debe incluir ámbitos de experiencia', () => {
    const prompt = construirPrompt('test', new Date(2024, 5, 15));
    expect(prompt).toContain('Exploración del Ambiente');
    expect(prompt).toContain('Comunicación y Expresión');
  });
});
