export interface ThrowParams {
  position: [number, number, number];
  rotation: [number, number, number];
  linearVelocity: [number, number, number];
  angularVelocity: [number, number, number];
}

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Fisher-Yates shuffle (returns a new array; leaves input untouched)
function shuffled<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build throw params for a whole roll of `count` dice. Positions come from a
 * staggered grid (5 cols x 2 rows per layer) whose cell spacing exceeds the
 * largest die diameter, so bodies never spawn interpenetrating. The cells used
 * are chosen at random — shuffled per layer, lower layer filled first — so a
 * small roll scatters across the tray instead of always piling on the left.
 * Each die also launches in its own random heading + speed. Math.random only
 * sets the initial conditions; the outcome comes from the rigid-body tumble.
 */
export function makeThrows(count: number): ThrowParams[] {
  const cols = 5;
  const rows = 2; // per layer; 5 x 2 = 10 cells keep a layer's dice below y=8
  const perLayer = cols * rows;
  const layers = Math.max(1, Math.ceil(count / perLayer));

  // Assemble the pool of grid cells layer by layer so low counts stay in the
  // lower layer (safely below the ceiling collider at y=10), but shuffle the
  // cells within each layer so which columns/rows get used is random.
  const cells: { col: number; row: number; layer: number }[] = [];
  for (let layer = 0; layer < layers; layer++) {
    const layerCells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) layerCells.push({ col, row, layer });
    }
    cells.push(...shuffled(layerCells));
  }

  return cells.slice(0, count).map(({ col, row, layer }) => {
    // grid centered on the tray in both x and z (rows straddle z=0), so no die
    // starts pinned against a wall and the throw direction alone shapes spread
    const x = (col - 2) * 2.7 + rand(-0.35, 0.35);
    const z = (row - 0.5) * 2.8 + rand(-0.3, 0.3);
    // random horizontal heading + speed per die; with wall bounces this spreads
    // landings across the whole tray instead of a single forward lane
    const heading = rand(0, Math.PI * 2);
    const speed = rand(4, 12);
    return {
      position: [x, 5 + layer * 3, z],
      rotation: [rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2)],
      linearVelocity: [Math.cos(heading) * speed, rand(-6, -2), Math.sin(heading) * speed],
      angularVelocity: [rand(-35, 35), rand(-35, 35), rand(-35, 35)],
    };
  });
}
