import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlan } from '../contexts/PlanContext';
import PreviewHeader from '../components/PreviewHeader';
import TabBar, { type TabItem } from '../components/TabBar';
import ActividadesTab from '../components/ActividadesTab';
import MaterialesTab from '../components/MaterialesTab';
import AdaptacionesTab from '../components/AdaptacionesTab';
import FundamentacionTab from '../components/FundamentacionTab';
import { downloadPdf, printPdf } from '../services/pdf.service';
import type { Planificacion } from '../types';

const TABS: TabItem[] = [
  { id: 'actividades', label: 'Actividades' },
  { id: 'materiales', label: 'Materiales' },
  { id: 'adaptaciones', label: 'Adaptaciones' },
  { id: 'fundamentacion', label: 'Fundamentación' },
];

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { planificacion, isLoading, error, loadById } = usePlan();
  const [activeTab, setActiveTab] = useState('actividades');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Cargar la planificación por ID si no es la que ya tenemos en memoria
  useEffect(() => {
    if (id && planificacion?.id !== id) {
      loadById(id);
    }
  }, [id, planificacion?.id, loadById]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status">
        <p className="text-text-muted font-quicksand">Cargando planificación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <p className="text-red-600 font-quicksand text-center">{error}</p>
      </div>
    );
  }

  if (!planificacion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-muted font-quicksand">No hay planificación disponible.</p>
      </div>
    );
  }

  const handleDownloadPdf = () => {
    try {
      setPdfError(null);
      downloadPdf(planificacion);
    } catch {
      setPdfError('No se pudo generar el PDF. Por favor, intentá de nuevo.');
    }
  };

  const handlePrint = () => {
    try {
      setPdfError(null);
      printPdf(planificacion);
    } catch {
      setPdfError('No se pudo generar el PDF para imprimir. Por favor, intentá de nuevo.');
    }
  };

  const handleEliminar = async () => {
    if (!planificacion) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`/api/planificaciones/${planificacion.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        navigate('/history');
      } else {
        setPdfError('No se pudo eliminar la planificación. Intentá de nuevo.');
      }
    } catch {
      setPdfError('Error de conexión al eliminar. Intentá de nuevo.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-bg-cream overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-8 pt-4 sm:pt-6">
        <PreviewHeader
          titulo={planificacion.titulo}
          fechaInicio={planificacion.fechaInicio}
          fechaFin={planificacion.fechaFin}
          objetivos={planificacion.objetivos}
          areaCurricular={planificacion.areaCurricular}
        />

        {/* Pestañas sobre el panel de contenido */}
        <div className="mt-5 sm:mt-7">
          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="bg-white rounded-2xl rounded-tl-none border border-border-light shadow-sm p-3.5 sm:p-7"
          >
            <TabContent tabId={activeTab} planificacion={planificacion} />
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="sticky bottom-0 z-20 mt-6 border-t border-border-light bg-bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-8 py-3.5 sm:py-5 flex flex-col gap-3">
          {pdfError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-red-600 font-quicksand text-sm">{pdfError}</p>
              <button
                onClick={handleDownloadPdf}
                className="mt-2 text-red-700 font-bold font-quicksand text-sm underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {!confirmDelete ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <button
                onClick={handleDownloadPdf}
                className="flex-1 min-w-[140px] sm:flex-none inline-flex items-center justify-center gap-2 sm:gap-2.5 bg-mostaza text-white font-bold font-quicksand text-[13px] sm:text-[15px] tracking-wide uppercase rounded-full px-4 sm:px-8 py-3 sm:py-3.5 min-h-[48px] sm:min-h-[52px] shadow-md shadow-mostaza/30 hover:brightness-105 active:scale-95 transition-all"
                aria-label="Descargar PDF"
              >
                <PdfIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                Descargar PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 min-w-[140px] sm:flex-none inline-flex items-center justify-center gap-2 sm:gap-2.5 bg-green-dark text-white font-bold font-quicksand text-[13px] sm:text-[15px] tracking-wide uppercase rounded-full px-4 sm:px-8 py-3 sm:py-3.5 min-h-[48px] sm:min-h-[52px] shadow-md shadow-green-dark/25 hover:brightness-110 active:scale-95 transition-all"
                aria-label="Imprimir"
              >
                <PrinterIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                Imprimir
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-red-300 text-red-500 font-semibold font-quicksand text-[13px] sm:text-[15px] rounded-full px-6 py-3 sm:py-3.5 min-h-[48px] sm:min-h-[52px] hover:bg-red-50 active:scale-95 transition-all"
                aria-label="Eliminar planificación"
              >
                <TrashIcon className="w-4 h-4 shrink-0" />
                Eliminar
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleEliminar}
                disabled={deleting}
                className="bg-red-500 text-white font-bold font-quicksand rounded-full px-7 py-3 min-h-[48px] active:scale-95 transition-all disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="border border-border-light bg-white text-text-dark font-bold font-quicksand rounded-full px-7 py-3 min-h-[48px] active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Icons ---

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M12 11v6M9.5 14.5L12 17l2.5-2.5" />
    </svg>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 9V4h10v5" />
      <rect x="3.5" y="9" width="17" height="7" rx="2" />
      <path d="M7 14h10v6H7z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 12.5a1 1 0 0 0 1 .95h7.4a1 1 0 0 0 1-.95L17.5 7" />
    </svg>
  );
}

// --- Tab Content ---

function TabContent({ tabId, planificacion }: { tabId: string; planificacion: Planificacion }) {
  switch (tabId) {
    case 'actividades':
      return <ActividadesTab actividades={planificacion.actividades} planificacionId={planificacion.id} />;
    case 'materiales':
      return <MaterialesTab materiales={planificacion.materiales} planificacionId={planificacion.id} />;
    case 'adaptaciones':
      return <AdaptacionesTab adaptaciones={planificacion.adaptaciones} planificacionId={planificacion.id} />;
    case 'fundamentacion':
      return <FundamentacionTab fundamentacion={planificacion.fundamentacion} planificacionId={planificacion.id} />;
    default:
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-text-muted font-quicksand text-center text-sm">
            No hay contenido disponible para esta sección.
          </p>
        </div>
      );
  }
}
