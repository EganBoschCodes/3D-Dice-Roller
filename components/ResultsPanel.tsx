"use client";

import { DIE_TYPES } from "@/lib/dice/types";
import { useDiceStore } from "@/lib/store";

export function ResultsPanel() {
  const phase = useDiceStore((s) => s.phase);
  const spec = useDiceStore((s) => s.spec);
  const results = useDiceStore((s) => s.results);

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
