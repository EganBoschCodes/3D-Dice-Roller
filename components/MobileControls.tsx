"use client";

import { useEffect, useState } from "react";
import { DIE_TYPES, type DieType } from "@/lib/dice/types";
import {
  countsToTypes,
  loadFavorites,
  saveFavorites,
  summarize,
  type Favorite,
} from "@/lib/favorites";
import {
  MAX_PER_TYPE,
  MAX_TOTAL,
  totalCount,
  useDiceStore,
  type RollMode,
} from "@/lib/store";

interface QuickAction {
  key: string;
  label: string;
  sub: string;
  types: DieType[];
  mode: RollMode;
}

// Same set the desktop QuickActions bar offers, tuned for a scrollable row.
const ACTIONS: QuickAction[] = [
  { key: "d20", label: "1d20", sub: "flat", types: ["d20"], mode: "normal" },
  { key: "adv", label: "Advantage", sub: "keep high", types: ["d20", "d20"], mode: "advantage" },
  { key: "dis", label: "Disadvantage", sub: "keep low", types: ["d20", "d20"], mode: "disadvantage" },
  { key: "d100", label: "Percentile", sub: "d% + d10", types: ["d%", "d10"], mode: "percentile" },
  { key: "fireball", label: "Fireball", sub: "8d6", types: ["d6", "d6", "d6", "d6", "d6", "d6", "d6", "d6"], mode: "normal" },
];

/**
 * Mobile control surface: a thumb-reachable bottom dock (dice-builder toggle +
 * scrollable quick actions + Roll) plus a slide-in sheet for building a custom
 * set and managing favorites. Rendered only inside `.mobile-ui`, which CSS hides
 * on desktop — the desktop panels are untouched. All state lives in the shared
 * zustand store / localStorage, so it stays in sync with everything else.
 */
export function MobileControls() {
  const counts = useDiceStore((s) => s.counts);
  const phase = useDiceStore((s) => s.phase);
  const increment = useDiceStore((s) => s.increment);
  const decrement = useDiceStore((s) => s.decrement);
  const roll = useDiceStore((s) => s.roll);
  const clear = useDiceStore((s) => s.clear);
  const quickRoll = useDiceStore((s) => s.quickRoll);

  const rolling = phase === "rolling";
  const total = totalCount(counts);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [name, setName] = useState("");

  // localStorage is client-only; load after mount to avoid SSR hydration mismatch.
  useEffect(() => setFavorites(loadFavorites()), []);

  const persist = (list: Favorite[]) => {
    setFavorites(list);
    saveFavorites(list);
  };

  const canSave = total > 0 && name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    persist([...favorites, { id: crypto.randomUUID(), name: name.trim(), counts: { ...counts } }]);
    setName("");
  };

  const remove = (id: string) => persist(favorites.filter((f) => f.id !== id));

  // Any roll closes the sheet so the tray is fully visible while dice tumble.
  const doRoll = () => {
    roll();
    setSheetOpen(false);
  };
  const doQuick = (a: QuickAction) => {
    quickRoll(a.types, a.mode);
    setSheetOpen(false);
  };
  const doFav = (f: Favorite) => {
    quickRoll(countsToTypes(f.counts));
    setSheetOpen(false);
  };

  return (
    <>
      {sheetOpen && (
        <div
          className="m-sheet-backdrop"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`m-sheet ${sheetOpen ? "m-sheet-open" : ""}`}
        role="dialog"
        aria-label="Build a roll"
        aria-hidden={!sheetOpen}
      >
        <button
          className="m-sheet-grip"
          onClick={() => setSheetOpen(false)}
          aria-label="Close"
        />
        <div className="m-sheet-scroll">
          <section className="m-section">
            <div className="m-section-head">
              <span className="m-section-title">Build a roll</span>
              <span className="m-total">
                {total}/{MAX_TOTAL}
              </span>
            </div>
            <div className="m-dice-grid">
              {DIE_TYPES.map((t) => (
                <div key={t} className="m-die">
                  <span className="m-die-label">{t}</span>
                  <div className="m-die-ctrls">
                    <button
                      className="m-step"
                      onClick={() => decrement(t)}
                      disabled={counts[t] <= 0}
                      aria-label={`remove ${t}`}
                    >
                      −
                    </button>
                    <span className="m-die-count">{counts[t]}</span>
                    <button
                      className="m-step"
                      onClick={() => increment(t)}
                      disabled={counts[t] >= MAX_PER_TYPE || total >= MAX_TOTAL}
                      aria-label={`add ${t}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="m-section-actions">
              <button className="m-clear" onClick={clear} disabled={rolling || total === 0}>
                Clear
              </button>
              <button className="m-roll-lg" onClick={doRoll} disabled={rolling || total === 0}>
                {rolling ? "Rolling…" : total > 0 ? `Roll ${total}` : "Roll"}
              </button>
            </div>
          </section>

          <section className="m-section">
            <span className="m-section-title">Favorites</span>
            <div className="m-fav-save">
              <input
                className="m-fav-input"
                type="text"
                value={name}
                placeholder="Name this roll"
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
              <button className="m-fav-savebtn" onClick={save} disabled={!canSave}>
                Save
              </button>
            </div>
            <div className="m-fav-list">
              {favorites.length === 0 ? (
                <div className="m-fav-empty">Build a set above, name it, and Save to keep it here.</div>
              ) : (
                favorites.map((f) => (
                  <div key={f.id} className="m-fav-row">
                    <button
                      className="m-fav-roll"
                      onClick={() => doFav(f)}
                      disabled={rolling}
                      title={`Roll ${summarize(f.counts)}`}
                    >
                      <span className="m-fav-name">{f.name}</span>
                      <span className="m-fav-sub">{summarize(f.counts)}</span>
                    </button>
                    <button
                      className="m-fav-del"
                      onClick={() => remove(f.id)}
                      aria-label={`delete ${f.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="m-dock">
        <button
          className={`m-dice-toggle ${sheetOpen ? "m-dice-toggle-open" : ""}`}
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
          aria-label="Build a roll"
        >
          <svg
            className="m-dice-toggle-icon"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="8" cy="8" r="1.6" fill="currentColor" />
            <circle cx="16" cy="8" r="1.6" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="8" cy="16" r="1.6" fill="currentColor" />
            <circle cx="16" cy="16" r="1.6" fill="currentColor" />
          </svg>
          {total > 0 && <span className="m-dice-toggle-count">{total}</span>}
        </button>

        <div className="m-quick-row">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              className={`m-quick m-quick-${a.key}`}
              onClick={() => doQuick(a)}
              disabled={rolling}
            >
              <span className="m-quick-label">{a.label}</span>
              <span className="m-quick-sub">{a.sub}</span>
            </button>
          ))}
        </div>

        <button className="m-roll" onClick={doRoll} disabled={rolling || total === 0}>
          {rolling ? "…" : "Roll"}
        </button>
      </div>
    </>
  );
}
