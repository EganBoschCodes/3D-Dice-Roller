"use client";

import dynamic from "next/dynamic";
import { BlackFlash } from "./BlackFlash";
import { ControlBar } from "./ControlBar";
import { FavoritesPanel } from "./FavoritesPanel";
import { QuickActions } from "./QuickActions";
import { ResultsPanel } from "./ResultsPanel";
import { RollTotalPopup } from "./RollTotalPopup";
import { Settings } from "./Settings";

// Rapier + three must never render on the server; ssr:false is only allowed
// inside a Client Component in Next 15, hence this wrapper.
const Scene = dynamic(() => import("./scene/Scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Loading physics…</div>,
});

export default function DiceApp() {
  return (
    <main>
      <Scene />
      <QuickActions />
      <Settings />
      <FavoritesPanel />
      <ControlBar />
      <ResultsPanel />
      <RollTotalPopup />
      <BlackFlash />
    </main>
  );
}
