// Random-looking but repeatable star fields: the same seed always gives the same sky,
// so the page looks identical on every visit (and the generator is testable).

/** Mulberry32: a tiny, fast pseudo-random generator. Returns numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Range = readonly [number, number];
export type Bounds = { x: Range; y: Range; z: Range };

/** Star tints: mostly white and blue-white, some warm, like real star colours. */
const TINTS = [
  [1.0, 1.0, 1.0],
  [0.8, 0.87, 1.0],
  [0.7, 0.8, 1.0],
  [1.0, 0.92, 0.8],
  [1.0, 0.8, 0.65],
] as const;
const TINT_WEIGHTS = [0.4, 0.25, 0.15, 0.12, 0.08];

export function generateStars(count: number, seed: number, bounds: Bounds) {
  const random = seededRandom(seed);
  const between = ([min, max]: Range) => min + (max - min) * random();
  const positions = new Array<number>(count * 3);
  const colors = new Array<number>(count * 3);
  const sizes = new Array<number>(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = between(bounds.x);
    positions[i * 3 + 1] = between(bounds.y);
    positions[i * 3 + 2] = between(bounds.z);

    // Steep curve: most stars tiny, a rare few big and bright.
    sizes[i] = 0.6 + 2.6 * random() ** 8;

    let pick = random();
    let tint = 0;
    while (tint < TINTS.length - 1 && pick > TINT_WEIGHTS[tint]) pick -= TINT_WEIGHTS[tint++];
    colors[i * 3] = TINTS[tint][0];
    colors[i * 3 + 1] = TINTS[tint][1];
    colors[i * 3 + 2] = TINTS[tint][2];
  }
  return { positions, colors, sizes };
}
