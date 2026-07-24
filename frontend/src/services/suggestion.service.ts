/**
 * SuggestionService: fetches suggestion chips from the backend.
 * The backend handles the logic of whether to use ephemeris-based or season-based chips.
 */

export async function fetchSuggestionChips(): Promise<string[]> {
  try {
    const res = await fetch('/api/datos-estaticos/sugerencias');
    if (!res.ok) return [];
    const json = await res.json();
    const chips: string[] = json.data ?? [];
    // Enforce 2-5 bounds on frontend as well
    if (chips.length < 2) return [];
    return chips.slice(0, 5);
  } catch {
    return [];
  }
}
