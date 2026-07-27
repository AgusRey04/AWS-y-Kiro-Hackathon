import { usePlan } from '../contexts/PlanContext';
import EditableBlock from './EditableBlock';

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 6.5S10 4.5 5 4.5v13c5 0 7 2 7 2s2-2 7-2v-13c-5 0-7 2-7 2z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

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
      className="rounded-2xl bg-[#F1F6F2] border-l-4 border-l-green-primary p-4 sm:p-6"
      aria-label="Fundamentación pedagógica"
    >
      <div className="flex items-start gap-3 sm:gap-3.5 mb-4 sm:mb-5">
        <span className="shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-primary text-white">
          <BookIcon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
        </span>
        <div>
          <h3 className="text-lg sm:text-xl font-semibold font-quicksand text-green-dark">
            Marco Teórico Pedagógico
          </h3>
          <p className="text-sm sm:text-[15px] font-quicksand text-text-muted mt-0.5">
            El respaldo didáctico que sostiene la propuesta de la semana.
          </p>
        </div>
      </div>
      {planificacionId ? (
        <EditableBlock
          content={fundamentacion || ''}
          maxLength={2000}
          onSave={(newValue) => updateField('fundamentacion', newValue)}
          type="fundamentacion"
          fieldPath="fundamentacion"
          planificacionId={planificacionId}
          className="text-sm sm:text-[15px] font-quicksand text-text-dark leading-relaxed"
          as="div"
          pencilSiempreVisible
        />
      ) : (
        <div className="text-sm sm:text-[15px] font-quicksand text-text-dark leading-relaxed whitespace-pre-line">
          {fundamentacion}
        </div>
      )}
    </article>
  );
}
