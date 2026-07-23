import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../contexts/PlanContext';
import VoiceTextToggle, { type InputMode } from '../components/VoiceTextToggle';
import ConsignaInput from '../components/ConsignaInput';
import VoiceRecorder from '../components/VoiceRecorder';
import EphemerisBanner from '../components/EphemerisBanner';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';

export default function HomePage() {
  const { state } = useAuth();
  const { isLoading, error, crear } = usePlan();
  const [mode, setMode] = useState<InputMode>('texto');
  const [consigna, setConsigna] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastConsigna, setLastConsigna] = useState('');

  const nombre = state.user?.nombre ?? 'Docente';

  const handleVoiceTranscript = useCallback((text: string) => {
    setConsigna(text);
    setValidationError(null);
  }, []);

  const handleVoicePartial = useCallback((text: string) => {
    setConsigna(text);
  }, []);

  const handleVoiceError = useCallback(() => {
    // Errors are handled visually by VoiceRecorder itself
  }, []);

  const handleConsignaChange = useCallback((value: string) => {
    setConsigna(value);
    if (validationError) {
      setValidationError(null);
    }
  }, [validationError]);

  const handleCrear = useCallback(() => {
    const trimmed = consigna.trim();

    if (trimmed.length === 0) {
      setValidationError('La consigna es obligatoria. Escribí o dictá qué querés trabajar esta semana.');
      return;
    }

    if (trimmed.length > 500) {
      setValidationError('La consigna no puede superar los 500 caracteres.');
      return;
    }

    setValidationError(null);
    setLastConsigna(trimmed);
    crear(trimmed);
  }, [consigna, crear]);

  const handleRetry = useCallback(() => {
    if (lastConsigna) {
      crear(lastConsigna);
    }
  }, [lastConsigna, crear]);

  // Show loading screen while generating
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error screen with retry
  if (error) {
    return <ErrorScreen message={error} onRetry={handleRetry} />;
  }

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Saludo personalizado (Req 14.1) */}
      <h1 className="text-2xl font-bold text-text-dark font-quicksand">
        ¡Hola, {nombre}!
      </h1>

      {/* Toggle Voz/Texto (Req 14.2) */}
      <div className="flex justify-center">
        <VoiceTextToggle mode={mode} onChange={setMode} />
      </div>

      {/* Banner de efeméride (Req 14.5) */}
      <EphemerisBanner />

      {/* Input según modo seleccionado */}
      {mode === 'texto' ? (
        <ConsignaInput value={consigna} onChange={handleConsignaChange} />
      ) : (
        <div className="flex flex-col gap-3">
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            onPartialTranscript={handleVoicePartial}
            onError={handleVoiceError}
          />
          {consigna && (
            <div className="rounded-xl border border-border-light px-4 py-3">
              <p className="text-sm text-text-dark font-quicksand">{consigna}</p>
            </div>
          )}
        </div>
      )}

      {/* Mensaje de validación (Req 3.7) */}
      {validationError && (
        <p className="text-sm text-red-600 font-quicksand" role="alert">
          {validationError}
        </p>
      )}

      {/* Botón CREAR (Req 14.3) */}
      <button
        type="button"
        onClick={handleCrear}
        className="w-full min-h-[56px] bg-mostaza text-white font-bold font-quicksand rounded-full text-lg transition-all hover:brightness-110 active:scale-95"
      >
        CREAR
      </button>
    </div>
  );
}
