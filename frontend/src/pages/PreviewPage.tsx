import { useState } from 'react';
import { usePlan } from '../contexts/PlanContext';
import PreviewHeader from '../components/PreviewHeader';
import TabBar, { type TabItem } from '../components/TabBar';
import ActividadesTab from '../components/ActividadesTab';
import MaterialesTab from '../components/MaterialesTab';
import AdaptacionesTab from '../components/AdaptacionesTab';
import FundamentacionTab from '../components/FundamentacionTab';
import type { Planificacion } from '../types';

const TABS: TabItem[] = [
  { id: 'actividades', label: 'Actividades' },
  { id: 'materiales', label: 'Materiales' },
  { id: 'adaptaciones', label: 'Adaptaciones' },
  { id: 'fundamentacion', label: 'Fundamentación' },
];

export default function PreviewPage() {
  const { planificacion, isLoading, error } = usePlan();
  const [activeTab, setActiveTab] = useState('actividades');

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

  return (
    <div className="flex flex-col min-h-full bg-bg-cream">
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
