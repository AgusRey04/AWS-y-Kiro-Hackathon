import { jsPDF } from 'jspdf';
import type { Planificacion } from '../types';

const MARGIN = 15; // mm
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_FONT_SIZE = 11;
const TITLE_FONT_SIZE = 14;
const SECTION_SPACING = 8; // pt converted to mm ~2.8mm
const LINE_HEIGHT = 1.4;

const DAY_ORDER: Array<{ key: string; label: string; color: string }> = [
  { key: 'lunes', label: 'Lunes', color: '#4A7856' },
  { key: 'martes', label: 'Martes', color: '#E9B44C' },
  { key: 'miercoles', label: 'Miércoles', color: '#D97706' },
  { key: 'jueves', label: 'Jueves', color: '#92400E' },
  { key: 'viernes', label: 'Viernes', color: '#9B89B3' },
];

/**
 * Genera el nombre del archivo PDF truncado a 100 caracteres max (incluyendo .pdf).
 */
export function generateFilename(titulo: string, fechaInicio: string): string {
  const base = `${titulo} - ${fechaInicio}`;
  const extension = '.pdf';
  const maxBaseLength = 100 - extension.length; // 96 chars for base

  const truncated = base.length > maxBaseLength ? base.slice(0, maxBaseLength) : base;
  return `${truncated}${extension}`;
}

/**
 * Genera un documento PDF con toda la planificación.
 */
export function generatePdf(planificacion: Planificacion): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = MARGIN;

  // Helper: check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Helper: write section title (bold)
  const writeSectionTitle = (title: string) => {
    const sectionSpacingMm = SECTION_SPACING * 0.353; // pt to mm
    checkPageBreak(10);
    y += sectionSpacingMm;
    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setFont('helvetica', 'bold');
    doc.text(title, MARGIN, y);
    y += TITLE_FONT_SIZE * 0.353 * LINE_HEIGHT;
    y += sectionSpacingMm;
  };

  // Helper: write body text with word wrapping
  const writeBodyText = (text: string) => {
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    const lineHeightMm = BODY_FONT_SIZE * 0.353 * LINE_HEIGHT;

    for (const line of lines) {
      checkPageBreak(lineHeightMm + 2);
      doc.text(line, MARGIN, y);
      y += lineHeightMm;
    }
  };

  // Helper: write a bullet point
  const writeBullet = (text: string) => {
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setFont('helvetica', 'normal');
    const bulletText = `• ${text}`;
    const lines = doc.splitTextToSize(bulletText, CONTENT_WIDTH - 4);
    const lineHeightMm = BODY_FONT_SIZE * 0.353 * LINE_HEIGHT;

    for (const line of lines) {
      checkPageBreak(lineHeightMm + 2);
      doc.text(line, MARGIN + 2, y);
      y += lineHeightMm;
    }
  };

  // === TÍTULO ===
  writeSectionTitle(planificacion.titulo);

  // === FECHAS ===
  writeSectionTitle('Fechas');
  writeBodyText(`${planificacion.fechaInicio} al ${planificacion.fechaFin}`);

  // === OBJETIVOS ===
  writeSectionTitle('Objetivos');
  for (const objetivo of planificacion.objetivos) {
    writeBullet(objetivo);
  }

  // === ÁREA CURRICULAR ===
  writeSectionTitle('Área Curricular');
  writeBodyText(`${planificacion.areaCurricular} - ${planificacion.ambitoExperiencia}`);

  // === ACTIVIDADES POR DÍA ===
  writeSectionTitle('Actividades');

  for (const day of DAY_ORDER) {
    const actividadesDelDia = planificacion.actividades
      .filter((a) => a.dia === day.key)
      .sort((a, b) => a.orden - b.orden);

    if (actividadesDelDia.length === 0) continue;

    // Day subtitle
    checkPageBreak(8);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(day.color);
    doc.text(day.label, MARGIN, y);
    y += 12 * 0.353 * LINE_HEIGHT;
    doc.setTextColor('#000000');

    for (const actividad of actividadesDelDia) {
      // Activity title
      doc.setFontSize(BODY_FONT_SIZE);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(actividad.titulo, CONTENT_WIDTH - 4);
      const lineHeightMm = BODY_FONT_SIZE * 0.353 * LINE_HEIGHT;

      for (const line of titleLines) {
        checkPageBreak(lineHeightMm + 2);
        doc.text(line, MARGIN + 2, y);
        y += lineHeightMm;
      }

      // Activity description
      if (actividad.descripcion) {
        writeBodyText(actividad.descripcion);
      }
      y += 2; // small spacing between activities
    }
  }

  // === MATERIALES ===
  writeSectionTitle('Materiales');
  for (const material of planificacion.materiales) {
    writeBullet(material.nombre);
  }

  // === ADAPTACIONES ===
  writeSectionTitle('Adaptaciones');
  for (const adaptacion of planificacion.adaptaciones) {
    // Category + Title
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setFont('helvetica', 'bold');
    const headerText = `${adaptacion.categoria}: ${adaptacion.titulo}`;
    const headerLines = doc.splitTextToSize(headerText, CONTENT_WIDTH);
    const lineHeightMm = BODY_FONT_SIZE * 0.353 * LINE_HEIGHT;

    for (const line of headerLines) {
      checkPageBreak(lineHeightMm + 2);
      doc.text(line, MARGIN, y);
      y += lineHeightMm;
    }

    // Description
    if (adaptacion.descripcion) {
      writeBodyText(adaptacion.descripcion);
    }
    y += 2;
  }

  // === FUNDAMENTACIÓN ===
  writeSectionTitle('Fundamentación');
  writeBodyText(planificacion.fundamentacion);

  return doc;
}

/**
 * Genera y descarga el PDF de la planificación.
 */
export function downloadPdf(planificacion: Planificacion): void {
  const doc = generatePdf(planificacion);
  const filename = generateFilename(planificacion.titulo, planificacion.fechaInicio);
  doc.save(filename);
}

/**
 * Genera el PDF y abre el diálogo de impresión del navegador.
 */
export function printPdf(planificacion: Planificacion): void {
  const doc = generatePdf(planificacion);
  // Open PDF in a new window for printing
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);

  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
      // Clean up the URL after a delay to allow the print dialog to finish
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    });
  } else {
    // Fallback: auto-print from current window using iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.addEventListener('load', () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 10000);
    });
  }
}
