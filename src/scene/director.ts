// Pure maths that turns scroll position into scene state. No DOM, no Three.js,
// so every function here can be unit-tested.

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Hermite smoothstep: 0 below edge0, 1 above edge1, a soft S-curve between. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * How far through the hero's departure zone we are (0 → 1).
 * The zone is the extra scroll a pinned hero adds: its height minus one screen.
 * `heroTop` is the hero's top relative to the viewport (getBoundingClientRect().top).
 */
export function departureProgress(heroTop: number, heroHeight: number, viewportHeight: number): number {
  const zone = heroHeight - viewportHeight;
  if (zone <= 0) return 0;
  return clamp01(-heroTop / zone);
}

/** Name and tagline fade out over the first 30% of the departure. */
export function textOpacity(progress: number): number {
  return 1 - smoothstep(0, 0.3, progress);
}

/**
 * Move `current` toward `target`, frame-rate independent: after the same amount
 * of time you end up in the same place whether you render at 30 or 144 fps.
 * Higher `lambda` = snappier.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

/**
 * Camera distance at which a sphere of `radius` appears `diameterPx` tall,
 * for a perspective camera with vertical field of view `fovDeg`.
 */
export function cameraDistanceForDiameter(
  radius: number,
  fovDeg: number,
  viewportHeight: number,
  diameterPx: number,
): number {
  const halfFov = (fovDeg * Math.PI) / 360;
  return (radius * viewportHeight) / (diameterPx * Math.tan(halfFov));
}
