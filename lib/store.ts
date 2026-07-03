import { create } from "zustand";
import { DIE_TYPES, type DieSpec, type DieType } from "./dice/types";

export type Phase = "idle" | "rolling" | "settled";

/** How the current roll's total is derived from the settled dice. */
export type RollMode = "normal" | "advantage" | "disadvantage" | "percentile";

export const MAX_PER_TYPE = 10;
export const MAX_TOTAL = 20;

export interface DieResult {
  type: DieType;
  value: number;
  label: string;
}

export type BgMediaType = "image" | "video";

interface DiceState {
  counts: Record<DieType, number>;
  phase: Phase;
  rollId: number;
  /** 0..1 dial for bounciness + how long before a die is judged settled. */
  suspense: number;
  setSuspense: (v: number) => void;
  /** Play the Jujutsu Kaisen "black flash" when a d20 roll's result is a nat 20. */
  blackFlash: boolean;
  setBlackFlash: (v: boolean) => void;
  /** Data URL for user-uploaded tray-floor media (null = default felt). Persisted. */
  bgMediaUrl: string | null;
  bgMediaType: BgMediaType | null;
  setBackgroundMedia: (url: string, type: BgMediaType) => void;
  clearBackgroundMedia: () => void;
  /** How the current roll's total is derived (set at roll time). */
  mode: RollMode;
  /** Dice currently in the tray (set at roll time). */
  spec: DieSpec[];
  results: Record<string, DieResult>;
  increment: (type: DieType) => void;
  decrement: (type: DieType) => void;
  roll: () => void;
  /** Roll a fixed set of dice without touching `counts` (quick actions, favorites). */
  quickRoll: (types: DieType[], mode?: RollMode) => void;
  clear: () => void;
  reportResult: (id: string, result: DieResult) => void;
}

const emptyCounts = () =>
  Object.fromEntries(DIE_TYPES.map((t) => [t, 0])) as Record<DieType, number>;

/**
 * The headline number for a settled roll, derived the way each mode reports it:
 * percentile reads the tens/ones digits back out (all-zeros = 100), adv/dis keeps
 * the higher/lower die, normal sums every die. Single source of truth for both
 * the results panel and the roll-total popup.
 */
export function rollTotal(
  mode: RollMode,
  spec: DieSpec[],
  results: Record<string, DieResult>
): number {
  if (mode === "percentile") {
    const tensDie = spec.find((d) => d.type === "d%");
    const onesDie = spec.find((d) => d.type === "d10");
    const tensVal = tensDie ? results[tensDie.id]?.value ?? 0 : 0; // 100 or 10..90
    const onesVal = onesDie ? results[onesDie.id]?.value ?? 0 : 0; // 10 or 1..9
    const tens = tensVal === 100 ? 0 : tensVal;
    const ones = onesVal === 10 ? 0 : onesVal;
    return tens + ones === 0 ? 100 : tens + ones;
  }
  if (mode === "advantage" || mode === "disadvantage") {
    const values = spec.map((d) => results[d.id]?.value ?? 0);
    return mode === "advantage" ? Math.max(...values) : Math.min(...values);
  }
  return spec.reduce((sum, d) => sum + (results[d.id]?.value ?? 0), 0);
}

/**
 * Whether a settled roll should trigger the black flash: only the d20-based
 * modes count, and only when the *reported result* is a nat 20 — advantage's
 * kept (higher) die is 20, disadvantage's kept (lower) die is 20 (i.e. both
 * are 20), or a flat single-d20 roll shows 20.
 */
export function isBlackFlashRoll(
  mode: RollMode,
  spec: DieSpec[],
  results: Record<string, DieResult>
): boolean {
  const isFlatD20 =
    mode === "normal" && spec.length === 1 && spec[0]?.type === "d20";
  if (mode !== "advantage" && mode !== "disadvantage" && !isFlatD20) return false;
  return rollTotal(mode, spec, results) === 20;
}

export const totalCount = (counts: Record<DieType, number>) =>
  DIE_TYPES.reduce((sum, t) => sum + counts[t], 0);

// Shared roll starter: snapshots a dice list into a fresh spec so every roll
// gets new RigidBodies (keyed by rollId). Never mutates `counts`.
const startRoll = (
  get: () => DiceState,
  set: (partial: Partial<DiceState>) => void,
  types: DieType[],
  mode: RollMode
) => {
  const { rollId, phase } = get();
  if (phase === "rolling" || types.length === 0) return;
  const nextRoll = rollId + 1;
  const spec: DieSpec[] = types.map((type, i) => ({ id: `${nextRoll}-${i}`, type }));
  set({ spec, rollId: nextRoll, phase: "rolling", results: {}, mode });
};

export const useDiceStore = create<DiceState>((set, get) => ({
  counts: emptyCounts(),
  phase: "idle",
  rollId: 0,
  suspense: 0.5,
  setSuspense: (v) => set({ suspense: Math.max(0, Math.min(1, v)) }),
  blackFlash: false,
  setBlackFlash: (v) => set({ blackFlash: v }),
  bgMediaUrl: null,
  bgMediaType: null,
  setBackgroundMedia: (url, type) => set({ bgMediaUrl: url, bgMediaType: type }),
  clearBackgroundMedia: () => set({ bgMediaUrl: null, bgMediaType: null }),
  mode: "normal",
  spec: [],
  results: {},

  increment: (type) =>
    set((s) => {
      if (s.counts[type] >= MAX_PER_TYPE || totalCount(s.counts) >= MAX_TOTAL) return {};
      return { counts: { ...s.counts, [type]: s.counts[type] + 1 } };
    }),

  decrement: (type) =>
    set((s) => {
      if (s.counts[type] <= 0) return {};
      return { counts: { ...s.counts, [type]: s.counts[type] - 1 } };
    }),

  roll: () => {
    const { counts } = get();
    const types: DieType[] = [];
    for (const t of DIE_TYPES) for (let k = 0; k < counts[t]; k++) types.push(t);
    startRoll(get, set, types, "normal");
  },

  quickRoll: (types, mode = "normal") => startRoll(get, set, types, mode),

  clear: () =>
    set({ counts: emptyCounts(), spec: [], results: {}, phase: "idle", mode: "normal" }),

  reportResult: (id, result) =>
    set((s) => {
      if (!s.spec.some((d) => d.id === id)) return {}; // stale report from a cleared roll
      const results = { ...s.results, [id]: result };
      const phase: Phase =
        Object.keys(results).length >= s.spec.length ? "settled" : s.phase;
      return { results, phase };
    }),
}));
