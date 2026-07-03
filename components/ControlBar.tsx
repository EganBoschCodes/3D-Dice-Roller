"use client";

import { DIE_TYPES } from "@/lib/dice/types";
import { MAX_PER_TYPE, MAX_TOTAL, totalCount, useDiceStore } from "@/lib/store";

export function ControlBar() {
  const counts = useDiceStore((s) => s.counts);
  const phase = useDiceStore((s) => s.phase);
  const increment = useDiceStore((s) => s.increment);
  const decrement = useDiceStore((s) => s.decrement);
  const roll = useDiceStore((s) => s.roll);
  const clear = useDiceStore((s) => s.clear);

  const total = totalCount(counts);
  const rolling = phase === "rolling";

  return (
    <div className="control-bar">
      <div className="control-title">Dice</div>
      {DIE_TYPES.map((t) => (
        <div key={t} className="die-row">
          <span className="die-label">{t}</span>
          <button
            className="count-btn"
            onClick={() => decrement(t)}
            disabled={counts[t] <= 0}
            aria-label={`remove ${t}`}
          >
            −
          </button>
          <span className="die-count">{counts[t]}</span>
          <button
            className="count-btn"
            onClick={() => increment(t)}
            disabled={counts[t] >= MAX_PER_TYPE || total >= MAX_TOTAL}
            aria-label={`add ${t}`}
          >
            +
          </button>
        </div>
      ))}
      <div className="total-row">
        {total}/{MAX_TOTAL} dice
      </div>
      <button className="roll-btn" onClick={roll} disabled={rolling || total === 0}>
        {rolling ? "Rolling…" : "Roll"}
      </button>
      <button className="clear-btn" onClick={clear} disabled={rolling}>
        Clear
      </button>
    </div>
  );
}
