import { create } from "zustand";
import { DIE_TYPES, type DieSpec, type DieType } from "./dice/types";

export type Phase = "idle" | "rolling" | "settled";

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
  /** Dice currently in the tray (set at roll time). */
  spec: DieSpec[];
  results: Record<string, DieResult>;
  increment: (type: DieType) => void;
  decrement: (type: DieType) => void;
  roll: () => void;
  clear: () => void;
  reportResult: (id: string, result: DieResult) => void;
}

const emptyCounts = () =>
  Object.fromEntries(DIE_TYPES.map((t) => [t, 0])) as Record<DieType, number>;

export const totalCount = (counts: Record<DieType, number>) =>
  DIE_TYPES.reduce((sum, t) => sum + counts[t], 0);

export const useDiceStore = create<DiceState>((set, get) => ({
  counts: emptyCounts(),
  phase: "idle",
  rollId: 0,
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
    const { counts, rollId, phase } = get();
    if (phase === "rolling") return;
    const spec: DieSpec[] = [];
    let i = 0;
    for (const t of DIE_TYPES) {
      for (let k = 0; k < counts[t]; k++) spec.push({ id: `${rollId + 1}-${i++}`, type: t });
    }
    if (spec.length === 0) return;
    set({ spec, rollId: rollId + 1, phase: "rolling", results: {} });
  },

  clear: () => set({ spec: [], results: {}, phase: "idle" }),

  reportResult: (id, result) =>
    set((s) => {
      if (!s.spec.some((d) => d.id === id)) return {}; // stale report from a cleared roll
      const results = { ...s.results, [id]: result };
      const phase: Phase =
        Object.keys(results).length >= s.spec.length ? "settled" : s.phase;
      return { results, phase };
    }),
}));
