import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../contexts/PlanContext';
import VoiceTextToggle, { type InputMode } from '../components/VoiceTextToggle';
import ConsignaInput from '../components/ConsignaInput';
import VoiceRecorder from '../components/VoiceRecorder';
import EphemerisBanner from '../components/EphemerisBanner';
import SuggestionChips from '../components/SuggestionChips';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import { fetchSuggestionChips } from '../services/suggestion.service';
import { insertChip } from '../utils/consigna';

/** Iconos decorativos de ámbitos de experiencia (arte, ideas, emociones, lectura). */
function DecorativeIcons() {
  const iconClass = 'w-8 h-8 text-text-muted/25';

  return (
    <div className="flex items-center justify-center gap-6 pt-2" aria-hidden="true">
      {/* Paleta */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={iconClass}>
        <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-1-.6-1.6-.6-2.4 0-.9.7-1.5 1.7-1.5h1.6c2.5 0 4.5-2 4.5-4.6C21 6.4 17 3 12 3z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="9" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="7" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="7" cy="13" r="1.1" fill="currentColor" stroke="none" />
      </svg>
      {/* Lámpara / ideas */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V18h5.4v-2.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" />
      </svg>
      {/* Emociones */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5c.9 1.1 2.1 1.7 3.5 1.7s2.6-.6 3.5-1.7" />
        <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
      {/* Libro */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M12 6.5S10 4.5 5 4.5v13c5 0 7 2 7 2s2-2 7-2v-13c-5 0-7 2-7 2z" />
        <path d="M12 6.5v13" />
      </svg>
    </div>
  );
}

export default function HomePage() {
  const { state } = useAuth();
  const { isLoading, error, crear } = usePlan();
  const [mode, setMode] = useState<InputMode>('voz');
  const [consigna, setConsigna] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastConsigna, setLastConsigna] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [autoFocusTexto, setAutoFocusTexto] = useState(false);

  const [chips, setChips] = useState<string[]>([]);

  const nombre = state.user?.nombre ?? 'Docente';

  useEffect(() => {
    fetchSuggestionChips().then(setChips);
  }, []);

  const irAModoTexto = useCallback(() => {
    setAutoFocusTexto(true);
    setMode('texto');
  }, []);

  const handleModeChange = useCallback((next: InputMode) => {
    setAutoFocusTexto(false);
    setMode(next);
  }, []);

  const handleChipSelect = useCallback((chip: string) => {
    setConsigna((prev) => insertChip(prev, chip));
    setValidationError(null);
    irAModoTexto();
  }, [irAModoTexto]);

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

  const handleRecordingChange = useCallback((recording: boolean) => {
    setIsRecording(recording);
    if (recording) {
      setValidationError(null);
    }
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
    <div className="w-full px-6 pt-6 pb-4 flex flex-col items-center gap-6 overflow-x-hidden">
      {/* Banner de efeméride (Req 14.5) */}
      <EphemerisBanner />

      {/* Saludo personalizado (Req 14.1) */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-primary font-quicksand">
          ¡Hola, {nombre}!
        </h1>
        <p className="mt-2 text-sm sm:text-base text-text-muted font-quicksand">
          ¿Qué vamos a planificar hoy?
        </p>
      </div>

      {/* Toggle Voz/Texto (Req 14.2) */}
      <VoiceTextToggle mode={mode} onChange={handleModeChange} />

      {/* Input según modo seleccionado */}
      {mode === 'texto' ? (
        <div className="w-full max-w-2xl">
          <ConsignaInput
            value={consigna}
            onChange={handleConsignaChange}
            autoFocus={autoFocusTexto}
          />
        </div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col items-center gap-4">
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            onPartialTranscript={handleVoicePartial}
            onError={handleVoiceError}
            onRecordingChange={handleRecordingChange}
          />

          {/* Transcripción en vivo + opción de editar (Req 1.4, 1.6) */}
          <div
            className={`w-full rounded-2xl border bg-white px-4 py-3 flex flex-col gap-2 text-left transition-colors ${
              isRecording ? 'border-mostaza' : 'border-border-light'
            }`}
          >
            <p
              className="text-sm font-quicksand whitespace-pre-wrap break-words min-h-[20px] text-text-dark"
              aria-live="polite"
              aria-label="Transcripción de la consigna"
            >
              {consigna || (
                <span className="italic text-text-muted">
                  {isRecording
                    ? 'Te escucho... contame qué querés trabajar.'
                    : 'Tocá GRABAR y lo que digas aparece acá.'}
                </span>
              )}
            </p>

            {consigna && !isRecording && (
              <button
                type="button"
                onClick={irAModoTexto}
                className="self-end text-xs text-green-primary font-semibold font-quicksand hover:underline"
                aria-label="Cambiar a modo texto para editar la transcripción"
              >
                ✏️ Editar texto
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chips de sugerencia (Req 14.4) */}
      {chips.length >= 2 && (
        <div className="w-full max-w-5xl flex flex-col items-center gap-3">
          <p className="text-sm text-text-muted font-quicksand">Sugerencias para tu sala:</p>
          <SuggestionChips chips={chips} onChipSelect={handleChipSelect} />
        </div>
      )}

      {/* Mensaje de validación (Req 3.7) */}
      {validationError && (
        <p className="text-sm text-red-600 font-quicksand text-center" role="alert">
          {validationError}
        </p>
      )}

      {/* Botón CREAR (Req 14.3) */}
      <button
        type="button"
        onClick={handleCrear}
        className="w-full max-w-2xl min-h-[56px] bg-mostaza text-white font-bold font-quicksand rounded-full text-lg tracking-wide shadow-md shadow-mostaza/30 transition-all hover:brightness-105 active:scale-95"
      >
        CREAR
      </button>

      <DecorativeIcons />
    </div>
  );
}
