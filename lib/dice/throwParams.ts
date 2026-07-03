export interface ThrowParams {
  position: [number, number, number];
  rotation: [number, number, number];
  linearVelocity: [number, number, number];
  angularVelocity: [number, number, number];
}

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Staggered spawn grid above the near edge of the tray, thrown toward the far
 * wall with heavy spin. Cell spacing exceeds the largest die diameter so
 * bodies never spawn interpenetrating. Math.random only sets the initial
 * conditions — the outcome comes from the rigid-body tumble.
 */
export function makeThrowParams(index: number): ThrowParams {
  // 5 cols x 2 rows per layer keeps 20 dice within two layers (y <= 8),
  // safely below the tray's invisible ceiling collider at y=10
  const cols = 5;
  const col = index % cols;
  const row = Math.floor(index / cols) % 2;
  const layer = Math.floor(index / (cols * 2));
  const x = (col - 2) * 2.7 + rand(-0.35, 0.35);
  const z = -4.6 + row * 2.8 + rand(-0.3, 0.3);
  return {
    position: [x, 5 + layer * 3, z],
    rotation: [rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2)],
    linearVelocity: [-x * 1.2 + rand(-3, 3), rand(-6, -2), rand(15, 22)],
    angularVelocity: [rand(-35, 35), rand(-35, 35), rand(-35, 35)],
  };
}
