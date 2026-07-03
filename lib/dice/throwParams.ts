export interface ThrowParams {
  position: [number, number, number];
  rotation: [number, number, number];
  linearVelocity: [number, number, number];
  angularVelocity: [number, number, number];
}

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Staggered spawn grid centered over the tray, with each die launched in its
 * own random horizontal direction (random azimuth + speed) so landing spots
 * scatter instead of piling up on one edge. Cell spacing exceeds the largest
 * die diameter so bodies never spawn interpenetrating. Math.random only sets
 * the initial conditions — the outcome comes from the rigid-body tumble.
 */
export function makeThrowParams(index: number): ThrowParams {
  // 5 cols x 2 rows per layer keeps 20 dice within two layers (y <= 8),
  // safely below the tray's invisible ceiling collider at y=10
  const cols = 5;
  const col = index % cols;
  const row = Math.floor(index / cols) % 2;
  const layer = Math.floor(index / (cols * 2));
  // grid centered on the tray in both x and z (rows straddle z=0), so no die
  // starts pinned against a wall and the throw direction alone shapes the spread
  const x = (col - 2) * 2.7 + rand(-0.35, 0.35);
  const z = (row - 0.5) * 2.8 + rand(-0.3, 0.3);
  // random horizontal heading + speed per die; combined with wall bounces this
  // spreads landings across the whole tray instead of a single forward lane
  const heading = rand(0, Math.PI * 2);
  const speed = rand(4, 12);
  return {
    position: [x, 5 + layer * 3, z],
    rotation: [rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2)],
    linearVelocity: [Math.cos(heading) * speed, rand(-6, -2), Math.sin(heading) * speed],
    angularVelocity: [rand(-35, 35), rand(-35, 35), rand(-35, 35)],
  };
}
