"use client";

import { useEffect, useState } from "react";
import {
  countsToTypes,
  loadFavorites,
  saveFavorites,
  summarize,
  type Favorite,
} from "@/lib/favorites";
import { totalCount, useDiceStore } from "@/lib/store";

export function FavoritesPanel() {
  const counts = useDiceStore((s) => s.counts);
  const quickRoll = useDiceStore((s) => s.quickRoll);
  const rolling = useDiceStore((s) => s.phase === "rolling");

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [name, setName] = useState("");

  // localStorage is client-only; load after mount to avoid SSR hydration mismatch.
  useEffect(() => setFavorites(loadFavorites()), []);

  const persist = (list: Favorite[]) => {
    setFavorites(list);
    saveFavorites(list);
  };

  const currentTotal = totalCount(counts);
  const canSave = currentTotal > 0 && name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const fav: Favorite = {
      id: crypto.randomUUID(),
      name: name.trim(),
      counts: { ...counts },
    };
    persist([...favorites, fav]);
    setName("");
  };

  const remove = (id: string) => persist(favorites.filter((f) => f.id !== id));

  return (
    <div className="favorites-panel">
      <div className="favorites-title">Favorites</div>

      <div className="favorites-save">
        <input
          className="favorites-input"
          type="text"
          value={name}
          placeholder="Name this roll"
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <button
          className="favorites-save-btn"
          onClick={save}
          disabled={!canSave}
          title={
            currentTotal === 0
              ? "Add dice on the right first"
              : "Save the current dice as a favorite"
          }
        >
          Save
        </button>
      </div>

      <div className="favorites-list">
        {favorites.length === 0 ? (
          <div className="favorites-empty">
            Build a set on the right, name it, and Save to keep it here.
          </div>
        ) : (
          favorites.map((f) => (
            <div key={f.id} className="favorite-row">
              <button
                className="favorite-roll"
                onClick={() => quickRoll(countsToTypes(f.counts))}
                disabled={rolling}
                title={`Roll ${summarize(f.counts)}`}
              >
                <span className="favorite-name">{f.name}</span>
                <span className="favorite-sub">{summarize(f.counts)}</span>
              </button>
              <button
                className="favorite-delete"
                onClick={() => remove(f.id)}
                aria-label={`delete ${f.name}`}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
