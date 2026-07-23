import { usePlan } from '../contexts/PlanContext';
import EditableBlock from './EditableBlock';

interface FundamentacionTabProps {
  fundamentacion: string;
  planificacionId?: string;
}

export default function FundamentacionTab({ fundamentacion, planificacionId }: FundamentacionTabProps) {
  const { updateField } = usePlan();

  if (!fundamentacion) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-muted font-quicksand text-center text-sm">
          No hay fundamentación disponible para esta planificación.
        </p>
      </div>
    );
  }

  return (
    <article
      className="bg-white rounded-xl shadow-sm border border-border-light p-4"
      aria-label="Fundamentación pedagógica"
    >
      <h3 className="text-sm font-bold font-quicksand text-text-dark uppercase tracking-wide mb-3">
        Marco Teórico Pedagógico
      </h3>
      {planificacionId ? (
        <EditableBlock
          content={fundamentacion || ''}
          maxLength={2000}
          onSave={(newValue) => updateField('fundamentacion', newValue)}
          type="fundamentacion"
          fieldPath="fundamentacion"
          planificacionId={planificacionId}
          className="text-sm font-quicksand text-text-dark leading-relaxed"
          as="div"
        />
      ) : (
        <div className="text-sm font-quicksand text-text-dark leading-relaxed whitespace-pre-line">
          {fundamentacion}
        </div>
      )}
    </article>
  );
}
