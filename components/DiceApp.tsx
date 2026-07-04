"use client";

import dynamic from "next/dynamic";
import { BlackFlash } from "./BlackFlash";
import { ControlBar } from "./ControlBar";
import { FavoritesPanel } from "./FavoritesPanel";
import { MobileControls } from "./MobileControls";
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

      {/* Desktop-only panels — hidden below the mobile breakpoint (see globals.css).
          Kept exactly as-is so the desktop experience is unchanged. */}
      <div className="desktop-only">
        <QuickActions />
        <FavoritesPanel />
        <ControlBar />
      </div>

      {/* Mobile-only layout — hidden on desktop. */}
      <div className="mobile-ui">
        <MobileControls />
      </div>

      {/* Shared across both layouts (get mobile CSS tweaks, not separate markup). */}
      <Settings />
      <ResultsPanel />
      <RollTotalPopup />
      <BlackFlash />
    </main>
  );
}
