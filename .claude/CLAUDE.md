# DND Dice Roller

A DnD dice roller where results come from a rigid-body physics simulation, not
a PRNG. Dice are thrown into a 3D tray, tumble until they sleep, then the app
reads each die's upward face and sums the results. `Math.random` only seeds
throw conditions (position jitter, spin, velocity) — the chaotic tumble is the
randomizer.

Runs fully client-side (physics is browser-side), so it ships as a static
site. Deployed to GitHub Pages at
https://eganboschcodes.github.io/3D-Dice-Roller/ — see Deployment below.

## Stack

- Bun (package manager + runner), Next.js 15 App Router, TypeScript
- three.js via @react-three/fiber v9 + @react-three/drei v10
- Physics: @react-three/rapier v2 (Rapier WASM, inlined base64 — no config needed)
- State: zustand (bridges the DOM UI and the R3F canvas, which is a separate
  React reconciler root where context doesn't cross)

App was scaffolded by hand (create-next-app rejects the space in the dir name).

## Commands

- `bun run dev` — dev server on localhost:3000
- `bun run typecheck` — tsc --noEmit
- `bun run build` — static export to `out/` (Next `output: 'export'`)

## Deployment

- GitHub Pages, auto-deployed by `.github/workflows/deploy.yml` on push to
  `main` (Bun build → `out/` → Pages). Repo Settings → Pages → Source must be
  "GitHub Actions".
- Served from the `/3D-Dice-Roller/` subpath, so `next.config.ts` sets
  `basePath`/`assetPrefix` — but only when `GITHUB_PAGES=true` (set in CI), so
  local dev/build stay at root. `public/.nojekyll` keeps `_next/` from being
  stripped. `out/` is gitignored (CI regenerates it).

## Layout

- `app/page.tsx` → `components/DiceApp.tsx` ("use client", dynamic-imports the
  scene with `ssr: false` — required; Rapier/three must never render on server).
  Desktop panels sit in a `.desktop-only` wrapper; `MobileControls` in a
  `.mobile-ui` wrapper. Which shows is pure CSS in globals.css (both trees
  mount, no JS/hydration branch): mobile = `@media (max-width: 820px),
  (max-height: 540px)` — the short-height clause catches a landscape phone,
  which is the primary mobile orientation. Settings/ResultsPanel/RollTotalPopup
  are shared (mobile just restyles them). The sheet drops from the bottom in
  portrait, slides from the right in landscape
- `components/ControlBar.tsx` — right-edge vertical bar, +/- per die type
  (max 10/type, 20 total), Roll, Clear
- `components/ResultsPanel.tsx` — per-type values + total, top-left
- `components/MobileControls.tsx` — the whole mobile control surface (bottom
  dock: dice-builder toggle + scrollable quick actions + Roll; slide-in sheet:
  dice +/- and favorites). Reuses the store/localStorage, no new logic
- `components/scene/` — Scene (Canvas/Physics/lights), Tray, DiceManager, Die
- `lib/store.ts` — zustand: counts, phase (idle/rolling/settled), rollId,
  spec, results
- `lib/dice/` — geometry.ts (die geometries incl. manual d10 trapezohedron),
  faceData.ts (face normals/centroids/values — single source of truth for both
  labels and readout), readFace.ts, throwParams.ts

## How it works

- Roll: store builds a spec; DiceManager mounts one `Die` per entry, keyed
  `${rollId}-${index}` so every roll gets fresh RigidBodies
- Each Die = `RigidBody` + explicit `ConvexHullCollider` (not `colliders="hull"`,
  which would also hull the drei `<Text>` face labels)
- Readout: on Rapier `onSleep`, rotate each stored local face normal by the
  body quaternion, take the face most aligned with world up
- Cocked dice (best dot < 0.88, i.e. leaning): nudged with an impulse, up to
  3 times, then reported as-is. Backstops: 7s slow-check/re-drop, 12s force-read
- Face labels are drei `<Text>` meshes placed at centroid + normal offset;
  logical faces are derived by merging coplanar triangles (three.js polyhedra
  are triangulated with no face groups)

## Conventions (user decisions — don't change casually)

- d10 shows 0–9; 0 counts as 10. d% is standalone, shows 00–90; 00 counts
  as 100 (NOT a paired-d10 percentile roll)
- d4 is apex-read: value = top vertex; each face renders its 3 corner values
- Opposite faces sum to n+1 (labels to 9 / 90 for d10/d%), like real dice
- Antipodal face pairing lives in faceData.ts `orderAntipodal`

## Physics tuning notes

- Dice are unit-ish scale; gravity is -40 (earth gravity at this scale feels
  floaty; don't shrink dice to cm scale — Rapier jitters)
- Tray floor 16×12 with tall invisible walls (y 0–10) and a ceiling collider
  at y≈10 as a net. Spawn grid in throwParams.ts is 5 cols × 2 rows per layer
  so 20 dice stay below y=8 — dice spawned above the ceiling land on top of it
  and float (this was a real bug; keep spawns under it)
- Bounce feel: dice restitution 0.6, floor 0.45 (Rapier averages the pair);
  `ccd` stays on or fast throws tunnel through walls

## Verification

Drive the real UI: dev server + Python Playwright (installed system-wide,
Chromium available). Roll each type and compare reported values against the
visually-up faces in a screenshot; roll 20 dice repeatedly to check none
escape or float. Past probe scripts: see scratchpad drive_dice.py pattern.
