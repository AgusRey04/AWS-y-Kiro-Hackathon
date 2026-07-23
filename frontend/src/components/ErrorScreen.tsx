interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4"
      role="alert"
    >
      {/* Icono de error */}
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      {/* Mensaje de error */}
      <p className="text-base text-text-dark font-quicksand text-center max-w-xs">
        {message}
      </p>

      {/* Botón reintentar */}
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[56px] bg-mostaza text-white font-bold font-quicksand rounded-full px-8 py-3 text-lg transition-all hover:brightness-110 active:scale-95"
      >
        Reintentar
      </button>
    </div>
  );
}
