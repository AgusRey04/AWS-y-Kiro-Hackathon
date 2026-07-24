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
      <PreviewHeader
        titulo={planificacion.titulo}
        fechaInicio={planificacion.fechaInicio}
        fechaFin={planificacion.fechaFin}
        objetivos={planificacion.objetivos}
        areaCurricular={planificacion.areaCurricular}
      />

      <div className="mt-4 px-4">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="py-4"
        >
          <TabContent tabId={activeTab} planificacion={planificacion} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6 pt-2 flex flex-col gap-3">
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
        <button
          onClick={handleDownloadPdf}
          className="w-full bg-[#E9B44C] text-white font-bold font-quicksand rounded-full px-6 py-3 min-h-[56px] hover:brightness-110 active:scale-95 transition-all"
          aria-label="Descargar PDF"
        >
          Descargar PDF
        </button>
        <button
          onClick={handlePrint}
          className="w-full bg-[#4A7856] text-white font-bold font-quicksand rounded-full px-6 py-3 min-h-[56px] hover:brightness-110 active:scale-95 transition-all"
          aria-label="Imprimir"
        >
          Imprimir
        </button>

        {/* Eliminar */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full border-2 border-red-500 text-red-500 font-bold font-quicksand rounded-full px-6 py-3 min-h-[56px] hover:bg-red-50 active:scale-95 transition-all"
            aria-label="Eliminar planificación"
          >
            Eliminar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleEliminar}
              disabled={deleting}
              className="flex-1 bg-red-500 text-white font-bold font-quicksand rounded-full px-4 py-3 min-h-[56px] active:scale-95 transition-all disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 border-2 border-gray-300 text-text-dark font-bold font-quicksand rounded-full px-4 py-3 min-h-[56px] active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
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
