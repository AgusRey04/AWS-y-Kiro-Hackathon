import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceError, VoiceState } from '../types';

const SILENCE_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_CHARS = 500;

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onPartialTranscript: (text: string) => void;
  onError: (error: VoiceError) => void;
  /** Notifica al padre cuando empieza o termina la grabación. */
  onRecordingChange?: (isRecording: boolean) => void;
  maxChars?: number;
  lang?: string;
}

function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ??
    null
  );
}

export default function VoiceRecorder({
  onTranscript,
  onPartialTranscript,
  onError,
  onRecordingChange,
  maxChars = DEFAULT_MAX_CHARS,
  lang = 'es-AR',
}: VoiceRecorderProps) {
  const [state, setState] = useState<VoiceState>({
    isRecording: false,
    partialTranscript: '',
    error: null,
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [isSupported] = useState(() => getSpeechRecognition() !== null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef('');

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const stopRecording = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState((prev) => ({ ...prev, isRecording: false }));
  }, [clearSilenceTimer]);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        const transcript = transcriptRef.current;
        stopRecording();
        if (transcript) {
          onTranscript(transcript);
        }
        showNotification('Grabación detenida por inactividad (10s sin audio)');
      }
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer, stopRecording, onTranscript, showNotification]);

  const startRecording = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      onError('not-supported');
      setState((prev) => ({ ...prev, error: 'not-supported' }));
      return;
    }

    setNotification(null);
    transcriptRef.current = '';

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setState({ isRecording: true, partialTranscript: '', error: null });
      startSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      clearSilenceTimer();
      startSilenceTimer();

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const combined = finalTranscript + interimTranscript;

      // Check character limit
      if (combined.length >= maxChars) {
        const truncated = combined.slice(0, maxChars);
        transcriptRef.current = truncated;
        onPartialTranscript(truncated);
        setState((prev) => ({ ...prev, partialTranscript: truncated }));
        stopRecording();
        onTranscript(truncated);
        onError('max-length');
        showNotification(`Límite de ${maxChars} caracteres alcanzado`);
        return;
      }

      transcriptRef.current = combined;
      onPartialTranscript(combined);
      setState((prev) => ({ ...prev, partialTranscript: combined }));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const partial = transcriptRef.current;

      if (event.error === 'not-allowed') {
        stopRecording();
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: 'permission-denied',
        }));
        onError('permission-denied');
        showNotification('Se necesita permiso de micrófono para grabar');
        return;
      }

      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        stopRecording();
        setState((prev) => ({
          ...prev,
          isRecording: false,
          partialTranscript: partial,
          error: 'no-audio',
        }));
        onError('no-audio');
        if (partial) onTranscript(partial);
        return;
      }

      // Generic recognition error - preserve partial transcript
      stopRecording();
      setState((prev) => ({
        ...prev,
        isRecording: false,
        partialTranscript: partial,
        error: 'recognition-error',
      }));
      onError('recognition-error');
      if (partial) onTranscript(partial);
      showNotification('Error de reconocimiento. Se conservó el texto parcial.');
    };

    recognition.onend = () => {
      // Only update state if we didn't already handle it
      setState((prev) => {
        if (prev.isRecording) {
          const transcript = transcriptRef.current;
          if (transcript) {
            onTranscript(transcript);
          }
          return { ...prev, isRecording: false };
        }
        return prev;
      });
      clearSilenceTimer();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setState((prev) => ({ ...prev, error: 'recognition-error' }));
      onError('recognition-error');
    }
  }, [lang, maxChars, onTranscript, onPartialTranscript, onError, startSilenceTimer, clearSilenceTimer, stopRecording, showNotification]);

  const handleToggle = useCallback(() => {
    if (state.isRecording) {
      const transcript = transcriptRef.current;
      stopRecording();
      if (transcript) {
        onTranscript(transcript);
      }
    } else {
      startRecording();
    }
  }, [state.isRecording, stopRecording, startRecording, onTranscript]);

  // Informa al padre los cambios de estado de grabación
  useEffect(() => {
    onRecordingChange?.(state.isRecording);
  }, [state.isRecording, onRecordingChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [clearSilenceTimer]);

  // If browser doesn't support Web Speech API, hide the button entirely
  if (!isSupported) {
    return (
      <p className="text-sm text-text-muted" role="status" aria-live="polite">
        Tu navegador no soporta reconocimiento de voz. Usá la entrada de texto.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Botón circular de grabación con halo suave */}
      <div className="relative flex items-center justify-center">
        <span
          aria-hidden="true"
          className={`absolute w-52 h-52 rounded-full transition-colors ${
            state.isRecording ? 'bg-red-400/10' : 'bg-mostaza/10'
          }`}
        />
        <span
          aria-hidden="true"
          className={`absolute w-44 h-44 rounded-full transition-colors ${
            state.isRecording ? 'bg-red-400/20 animate-pulse' : 'bg-mostaza/30'
          }`}
        />
        <button
          type="button"
          onClick={handleToggle}
          className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2 ${
            state.isRecording
              ? 'bg-red-500 text-white shadow-[0_0_40px_10px_rgba(239,68,68,0.25)]'
              : 'bg-mostaza text-text-dark shadow-[0_0_40px_10px_rgba(233,180,76,0.25)] hover:brightness-105'
          }`}
          aria-label={state.isRecording ? 'Detener grabación' : 'Iniciar grabación de voz'}
          aria-pressed={state.isRecording}
        >
          {state.isRecording ? <StopIcon /> : <MicIcon />}
          <span className="text-xs font-bold font-quicksand tracking-[0.18em] uppercase">
            {state.isRecording ? 'Detener' : 'Grabar'}
          </span>
        </button>
      </div>

      {/* Recording indicator with pulse animation */}
      {state.isRecording && (
        <div
          className="flex items-center gap-2"
          role="status"
          aria-live="polite"
          aria-label="Grabando"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-sm text-text-dark font-medium">Grabando...</span>
        </div>
      )}



      {/* Error messages */}
      {state.error === 'permission-denied' && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          Se necesita permiso de micrófono para grabar. Habilitalo en la configuración del navegador.
        </p>
      )}

      {/* Notification toast */}
      {notification && (
        <div
          className="mt-2 px-3 py-2 bg-mostaza/20 text-text-dark text-sm rounded-xl border border-mostaza/40"
          role="status"
          aria-live="polite"
        >
          {notification}
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-9 w-9"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-9 w-9"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
