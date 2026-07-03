"use client";

import { useEffect, useState } from "react";
import { rollTotal, useDiceStore } from "@/lib/store";

/** Caption above the big number, so the total reads correctly per mode. */
const CAPTIONS: Record<string, string> = {
  normal: "Total",
  advantage: "Advantage",
  disadvantage: "Disadvantage",
  percentile: "Percentile",
};

// How long the popup lingers after a roll settles before fading out.
const VISIBLE_MS = 2200;

/**
 * Big centered readout of a settled roll's total. Keyed to rollId so each new
 * roll re-triggers it; auto-dismisses (pointer-events disabled so it never
 * blocks the tray) and can be dismissed early with a click.
 */
export function RollTotalPopup() {
  const phase = useDiceStore((s) => s.phase);
  const rollId = useDiceStore((s) => s.rollId);
  const mode = useDiceStore((s) => s.mode);
  const spec = useDiceStore((s) => s.spec);
  const results = useDiceStore((s) => s.results);

  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (phase !== "settled") {
      setShown(false);
      return;
    }
    setShown(true);
    const timer = setTimeout(() => setShown(false), VISIBLE_MS);
    return () => clearTimeout(timer);
    // rollId in deps so re-rolling the same count still re-fires the popup.
  }, [phase, rollId]);

  if (!shown || phase !== "settled" || spec.length === 0) return null;

  const total = rollTotal(mode, spec, results);

  return (
    <div className="roll-total-overlay" onClick={() => setShown(false)}>
      <div className="roll-total-popup" key={rollId}>
        <span className="roll-total-caption">{CAPTIONS[mode] ?? "Total"}</span>
        <span className="roll-total-value">{total}</span>
      </div>
    </div>
  );
}
