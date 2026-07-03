import { create } from "zustand";
import { DIE_TYPES, type DieSpec, type DieType } from "./dice/types";

export type Phase = "idle" | "rolling" | "settled";

/** How the current roll's total is derived from the settled dice. */
export type RollMode = "normal" | "advantage" | "disadvantage";

export const MAX_PER_TYPE = 10;
export const MAX_TOTAL = 20;

export interface DieResult {
  type: DieType;
  value: number;
  label: string;
}

interface DiceState {
  counts: Record<DieType, number>;
  phase: Phase;
  rollId: number;
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

  clear: () => set({ spec: [], results: {}, phase: "idle", mode: "normal" }),

  reportResult: (id, result) =>
    set((s) => {
      if (!s.spec.some((d) => d.id === id)) return {}; // stale report from a cleared roll
      const results = { ...s.results, [id]: result };
      const phase: Phase =
        Object.keys(results).length >= s.spec.length ? "settled" : s.phase;
      return { results, phase };
    }),
}));
