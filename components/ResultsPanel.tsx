"use client";

import { DIE_TYPES } from "@/lib/dice/types";
import { useDiceStore } from "@/lib/store";

export function ResultsPanel() {
  const phase = useDiceStore((s) => s.phase);
  const spec = useDiceStore((s) => s.spec);
  const results = useDiceStore((s) => s.results);
  const mode = useDiceStore((s) => s.mode);

  if (phase === "idle" || spec.length === 0) return null;

  const settled = Object.keys(results).length;

  if (phase === "rolling") {
    return (
      <div className="results-panel">
        <div className="results-status">
          Rolling… {settled}/{spec.length} settled
        </div>
      </div>
    );
  }

  // Advantage / disadvantage: two d20s, keep the higher / lower — not a sum.
  if (mode === "advantage" || mode === "disadvantage") {
    const values = spec.map((d) => results[d.id]?.value ?? 0);
    const kept = mode === "advantage" ? Math.max(...values) : Math.min(...values);
    let keptShown = false; // highlight only one die on a tie
    return (
      <div className="results-panel">
        <div className="results-mode">
          {mode === "advantage" ? "Advantage" : "Disadvantage"}
        </div>
        <div className="results-adv">
          {values.map((v, i) => {
            const isKept = v === kept && !keptShown;
            if (isKept) keptShown = true;
            return (
              <span key={i} className={`adv-die ${isKept ? "adv-kept" : "adv-dropped"}`}>
                {v}
              </span>
            );
          })}
        </div>
        <div className="results-total">
          Result <strong>{kept}</strong>
        </div>
      </div>
    );
  }

  const groups = DIE_TYPES.map((t) => ({
    type: t,
    values: spec.filter((d) => d.type === t).map((d) => results[d.id]?.value ?? 0),
  })).filter((g) => g.values.length > 0);

  const total = groups.reduce((sum, g) => sum + g.values.reduce((a, b) => a + b, 0), 0);

  return (
    <div className="results-panel">
      {groups.map((g) => (
        <div key={g.type} className="results-group">
          <span className="results-type">{g.type}</span>
          <span className="results-values">{g.values.join(", ")}</span>
        </div>
      ))}
      <div className="results-total">
        Total <strong>{total}</strong>
      </div>
    </div>
  );
}
