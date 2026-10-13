// Where each project's star goes on the chart.
//
// Stars sit on a gentle spiral: the first project at the centre, each newer one a
// step further out. A star's place depends only on its position in the order, so
// adding a project never moves the existing ones. The chart then frames ("zooms to")
// whatever stars exist, so 4 stars and 15 stars both fill the space.

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };

/** Angle between consecutive stars (radians): about six stars per turn. */
const TURN_STEP = 1.05;
/** Distance of the first star from the centre, and how much further each next one is. */
const START_RADIUS = 0.12;
const RADIUS_STEP = 0.07;
/** Empty space kept around the stars inside the frame (room for glow and labels). */
const MIN_PADDING = 0.3;
const MIN_ASPECT = 1;
const MAX_ASPECT = 1.8;

/** Small repeatable wobble per slot, so the spiral looks hand-drawn rather than perfect. */
function wobble(slot: number, salt: number): number {
  const x = Math.sin(slot * 91.7 + salt * 47.3) * 43758.5453;
  return x - Math.floor(x) - 0.5; // -0.5 .. 0.5
}

function starPosition(slot: number): Point {
  const angle = slot * TURN_STEP + wobble(slot, 1) * 0.7 - Math.PI / 2;
  const radius = START_RADIUS + slot * RADIUS_STEP + wobble(slot, 2) * 0.07;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

/** Positions for `count` stars and the box that frames them nicely. */
export function layoutConstellation(count: number): { points: Point[]; box: Box } {
  const points = Array.from({ length: count }, (_, slot) => starPosition(slot));
  if (count === 0) return { points, box: { x: -1, y: -1, width: 2, height: 2 } };

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  const padding = Math.max(MIN_PADDING, 0.15 * Math.max(maxX - minX, maxY - minY));
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  // Keep the frame landscape but never a thin strip: grow the short side, centred.
  let width = maxX - minX;
  let height = maxY - minY;
  if (width / height < MIN_ASPECT) {
    minX -= (height * MIN_ASPECT - width) / 2;
    width = height * MIN_ASPECT;
  } else if (width / height > MAX_ASPECT) {
    minY -= (width / MAX_ASPECT - height) / 2;
    height = width / MAX_ASPECT;
  }

  return { points, box: { x: minX, y: minY, width, height } };
}

/** A point as percentages of the frame, for positioning HTML on top of the SVG. */
export function toPercent(point: Point, box: Box): { left: number; top: number } {
  return {
    left: ((point.x - box.x) / box.width) * 100,
    top: ((point.y - box.y) / box.height) * 100,
  };
}
