import { DIE_TYPES, type DieType } from "./dice/types";

export interface Favorite {
  id: string;
  name: string;
  counts: Record<DieType, number>;
}

const KEY = "dnd-dice-favorites";

/** Expand a counts map into the flat dice-type list a roll consumes. */
export function countsToTypes(counts: Record<DieType, number>): DieType[] {
  const types: DieType[] = [];
  for (const t of DIE_TYPES) for (let k = 0; k < (counts[t] ?? 0); k++) types.push(t);
  return types;
}

/** e.g. { d8: 5, d6: 1 } -> "5d8 + 1d6" */
export function summarize(counts: Record<DieType, number>): string {
  const parts = DIE_TYPES.filter((t) => (counts[t] ?? 0) > 0).map((t) => `${counts[t]}${t}`);
  return parts.join(" + ");
}

/** Reads localStorage; returns [] on the server or on any parse/storage error. */
export function loadFavorites(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (f): f is Favorite =>
        f && typeof f.id === "string" && typeof f.name === "string" && f.counts,
    );
  } catch {
    return [];
  }
}

export function saveFavorites(list: Favorite[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full or unavailable — nothing we can meaningfully do
  }
}
