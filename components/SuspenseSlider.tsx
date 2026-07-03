"use client";

import { useDiceStore } from "@/lib/store";

export function SuspenseSlider() {
  const suspense = useDiceStore((s) => s.suspense);
  const setSuspense = useDiceStore((s) => s.setSuspense);

  return (
    <div className="suspense-panel">
      <div className="suspense-title">Suspense</div>
      <input
        className="suspense-range"
        type="range"
        min={0}
        max={100}
        value={Math.round(suspense * 100)}
        onChange={(e) => setSuspense(Number(e.target.value) / 100)}
        aria-label="Suspense"
      />
      <div className="suspense-ends">
        <span>Snappy</span>
        <span>Chaos</span>
      </div>
    </div>
  );
}
