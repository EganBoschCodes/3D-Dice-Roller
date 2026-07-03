"use client";

import { useEffect, useState } from "react";
import { isBlackFlashRoll, useDiceStore } from "@/lib/store";

// Total on-screen lifetime of the effect; keep in sync with the CSS keyframes.
const FLASH_MS = 1600;

/**
 * Jujutsu Kaisen "black flash" (黒閃): a full-screen crimson-on-black burst that
 * fires when the black-flash setting is on and a d20 roll settles on a nat 20.
 * Rendered above everything, pointer-events off so it never blocks the tray.
 */
export function BlackFlash() {
  const phase = useDiceStore((s) => s.phase);
  const rollId = useDiceStore((s) => s.rollId);
  const mode = useDiceStore((s) => s.mode);
  const spec = useDiceStore((s) => s.spec);
  const results = useDiceStore((s) => s.results);
  const enabled = useDiceStore((s) => s.blackFlash);

  const [firing, setFiring] = useState(false);

  useEffect(() => {
    if (!enabled || phase !== "settled") return;
    if (!isBlackFlashRoll(mode, spec, results)) return;
    setFiring(true);
    const t = setTimeout(() => setFiring(false), FLASH_MS);
    return () => clearTimeout(t);
    // rollId in deps so a fresh nat-20 roll re-fires even at the same count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, rollId, enabled]);

  if (!firing) return null;

  return (
    <div className="black-flash" key={rollId} aria-hidden="true">
      <div className="bf-black" />
      <div className="bf-burst" />
      <div className="bf-ring" />
      <div className="bf-ring bf-ring-2" />
      <svg className="bf-bolts" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M50 50 L20 8 L34 30 L8 26" />
        <path d="M50 50 L86 12 L66 30 L94 34" />
        <path d="M50 50 L18 92 L36 70 L6 74" />
        <path d="M50 50 L88 90 L64 72 L96 66" />
      </svg>
      <div className="bf-text">
        <span className="bf-kanji">黒閃</span>
        <span className="bf-label">BLACK FLASH</span>
      </div>
    </div>
  );
}
