import { useEffect, useState } from 'react';
import type { Efemeride } from '../types';

/** Convierte una fecha "MM-DD" al formato corto "D/M" usado en el banner. */
function formatFechaCorta(fecha: string): string {
  const [mes, dia] = fecha.split('-');
  if (!mes || !dia) return fecha;
  return `${Number(dia)}/${Number(mes)}`;
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8" />
      <path d="M3 8h18v4H3z" />
      <path d="M12 8v13" />
      <path d="M12 8S10.5 3.5 8 4s-1.5 4 4 4M12 8s1.5-4.5 4-4 1.5 4-4 4" />
    </svg>
  );
}

export default function EphemerisBanner() {
  const [efemeride, setEfemeride] = useState<Efemeride | null>(null);

  useEffect(() => {
    const fetchEfemerides = async () => {
      try {
        const res = await fetch('/api/datos-estaticos/efemerides?dias=7');
        if (!res.ok) return;
        const data = await res.json();
        const efemerides: Efemeride[] = data.data ?? data;
        if (efemerides.length > 0) {
          setEfemeride(efemerides[0]);
        }
      } catch {
        // Gracefully fall back: no banner shown if endpoint isn't available
      }
    };

    fetchEfemerides();
  }, []);

  if (!efemeride) return null;

  return (
    <div className="flex justify-center">
      <div
        className="inline-flex items-center gap-2 max-w-full rounded-full bg-[#D9F0DC] px-4 py-2.5 text-text-dark"
        role="status"
        aria-label="Efeméride próxima"
        title={efemeride.descripcion}
      >
        <GiftIcon className="w-4 h-4 shrink-0 text-green-primary" />
        <p className="text-xs sm:text-sm font-medium font-quicksand leading-snug">
          Se viene el {efemeride.nombre} ({formatFechaCorta(efemeride.fecha)}) — ¿lo
          trabajamos esta semana?
        </p>
      </div>
    </div>
  );
}
