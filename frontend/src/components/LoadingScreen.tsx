import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  'Alineando objetivos...',
  'Cultivando tu planificación...',
  'Organizando actividades...',
  'Preparando materiales...',
];

const ROTATION_INTERVAL_MS = 3000;

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4"
      role="status"
      aria-live="polite"
      aria-label="Generando planificación"
    >
      {/* Spinner animado */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-border-light" />
        <div className="absolute inset-0 rounded-full border-4 border-green-primary border-t-transparent animate-spin" />
      </div>

      {/* Mensaje rotativo */}
      <p className="text-lg font-semibold text-text-dark font-quicksand text-center transition-opacity duration-300">
        {LOADING_MESSAGES[messageIndex]}
      </p>

      {/* Texto secundario */}
      <p className="text-sm text-text-muted font-quicksand text-center">
        Esto puede tomar unos segundos
      </p>
    </div>
  );
}

export { LOADING_MESSAGES, ROTATION_INTERVAL_MS };
