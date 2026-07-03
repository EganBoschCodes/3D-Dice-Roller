/**
 * "Suspense" maps a single 0..1 dial to the physics feel of a roll.
 *
 * Low  → dice shed energy fast (low restitution, high damping) and we decide a
 *        die has settled quickly (higher speed tolerance, short dwell, shorter
 *        backstops) so results snap in.
 * High → dice are comically bouncy (near-elastic, low damping) and we wait much
 *        longer / more strictly before calling a die settled, drawing out the
 *        tumble for drama.
 */
export interface SuspensePhysics {
  dieRestitution: number;
  floorRestitution: number;
  linearDamping: number;
  angularDamping: number;
  /** Combined lin+ang speed below which a die counts as "coming to rest". */
  settleSpeed: number;
  /** How long (seconds) speed must stay under settleSpeed before we read it. */
  settleDwell: number;
  /** Backstop: slow-check / re-drop deadline (ms). */
  softMs: number;
  /** Backstop: force-read deadline (ms). */
  hardMs: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function suspenseToPhysics(suspense: number): SuspensePhysics {
  const s = Math.max(0, Math.min(1, suspense));
  const softMs = lerp(3500, 11000, s);
  return {
    // Very bouncy at the top, but restitution stays under 1 and damping never
    // drops to ~0, so the tumble decays and a die genuinely comes to rest well
    // before the force-read backstop — physics decides the face, not the timer.
    dieRestitution: lerp(0.2, 0.9, s),
    floorRestitution: lerp(0.15, 0.78, s),
    linearDamping: lerp(0.35, 0.14, s),
    angularDamping: lerp(0.85, 0.5, s),
    settleSpeed: lerp(0.9, 0.35, s),
    settleDwell: lerp(0.15, 0.6, s),
    softMs,
    hardMs: softMs + 8000,
  };
}
