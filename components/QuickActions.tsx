"use client";

import type { DieType } from "@/lib/dice/types";
import { useDiceStore, type RollMode } from "@/lib/store";

interface QuickAction {
  key: string;
  label: string;
  sub: string;
  types: DieType[];
  mode: RollMode;
}

const ACTIONS: QuickAction[] = [
  { key: "dis", label: "Disadvantage", sub: "2d20 · keep low", types: ["d20", "d20"], mode: "disadvantage" },
  { key: "d20", label: "Roll 1d20", sub: "flat", types: ["d20"], mode: "normal" },
  { key: "adv", label: "Advantage", sub: "2d20 · keep high", types: ["d20", "d20"], mode: "advantage" },
  { key: "d100", label: "Percentile", sub: "d% + d10", types: ["d%", "d10"], mode: "percentile" },
  { key: "fireball", label: "Fireball", sub: "8d6", types: ["d6", "d6", "d6", "d6", "d6", "d6", "d6", "d6"], mode: "normal" },
];

export function QuickActions() {
  const quickRoll = useDiceStore((s) => s.quickRoll);
  const rolling = useDiceStore((s) => s.phase === "rolling");

  return (
    <div className="quick-actions">
      {ACTIONS.map((a) => (
        <button
          key={a.key}
          className={`quick-btn quick-${a.key}`}
          onClick={() => quickRoll(a.types, a.mode)}
          disabled={rolling}
        >
          <span className="quick-label">{a.label}</span>
          <span className="quick-sub">{a.sub}</span>
        </button>
      ))}
    </div>
  );
}
