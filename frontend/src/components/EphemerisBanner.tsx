import { useEffect, useState } from 'react';
import type { Efemeride } from '../types';

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
    <div
      className="rounded-xl bg-mostaza/15 border border-mostaza/30 px-4 py-3"
      role="status"
      aria-label="Efeméride próxima"
    >
      <p className="text-sm font-semibold text-text-dark font-quicksand">
        📅 {efemeride.nombre}
      </p>
      <p className="text-xs text-text-muted font-quicksand mt-1">
        {efemeride.descripcion}
      </p>
    </div>
  );
}
