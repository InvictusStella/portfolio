// Where each project's star goes on the chart: the constellation Scorpius.
//
// Projects take its 15 main stars in a fixed order, from the tip of the stinger
// up to the claws, so Antares (the scorpion's heart) is the 11th project. A
// star's place depends only on its position in the order, so adding a project
// never moves the existing ones. The chart then frames ("zooms to") whatever
// stars exist.

import { seededRandom } from '../scene/starfield';

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };
export type Segment = [number, number];

/** Right ascension in hours, declination in degrees (J2000). */
type SkyStar = { name: string; ra: number; dec: number };
const hms = (h: number, m: number, s: number) => h + m / 60 + s / 3600;
const dms = (d: number, m: number, s: number) =>
  -(Math.abs(d) + m / 60 + s / 3600); // all southern

/** Scorpius, stinger → claws. */
export const SCORPIUS: SkyStar[] = [
  // Real separation from Shaula is ~0.6°; nudged to ~1.6° so the two stars can
  // be tapped separately.
  { name: 'Lesath', ra: hms(17, 28, 40), dec: dms(38, 20, 0) },
  { name: 'Shaula', ra: hms(17, 33, 36.5), dec: dms(37, 6, 14) },
  { name: 'Girtab', ra: hms(17, 42, 29.3), dec: dms(39, 1, 48) },
  { name: 'ι¹ Scorpii', ra: hms(17, 47, 35.1), dec: dms(40, 7, 37) },
  { name: 'Sargas', ra: hms(17, 37, 19.1), dec: dms(42, 59, 52) },
  { name: 'η Scorpii', ra: hms(17, 12, 9.2), dec: dms(43, 14, 21) },
  { name: 'ζ² Scorpii', ra: hms(16, 54, 35.0), dec: dms(42, 21, 41) },
  { name: 'μ¹ Scorpii', ra: hms(16, 51, 52.2), dec: dms(38, 2, 51) },
  { name: 'ε Scorpii', ra: hms(16, 50, 9.8), dec: dms(34, 17, 36) },
  { name: 'τ Scorpii', ra: hms(16, 35, 53.0), dec: dms(28, 12, 58) },
  { name: 'Antares', ra: hms(16, 29, 24.5), dec: dms(26, 25, 55) },
  { name: 'σ Scorpii', ra: hms(16, 21, 11.3), dec: dms(25, 35, 34) },
  { name: 'Dschubba', ra: hms(16, 0, 20.0), dec: dms(22, 37, 18) },
  { name: 'Acrab', ra: hms(16, 5, 26.2), dec: dms(19, 48, 20) },
  { name: 'Fang', ra: hms(15, 58, 51.1), dec: dms(26, 6, 51) },
];

/**
 * Lines of the traditional figure: the body as a chain, the claws branching
 * from Dschubba.
 */
const FIGURE: Segment[] = [
  ...Array.from({ length: 13 }, (_, i): Segment => [i, i + 1]),
  [12, 14],
];

// Flat projection around the figure's centre (accurate enough for ~25° of sky).
// Units: tens of degrees. East is on the left and north is up, as on a sky
// chart.
const RA0 = SCORPIUS.reduce((sum, s) => sum + s.ra, 0) / SCORPIUS.length;
const DEC0 = SCORPIUS.reduce((sum, s) => sum + s.dec, 0) / SCORPIUS.length;
const COS_DEC0 = Math.cos((DEC0 * Math.PI) / 180);
const project = ({ ra, dec }: SkyStar): Point => ({
  x: (-(ra - RA0) * 15 * COS_DEC0) / 10,
  y: -(dec - DEC0) / 10,
});
const FIGURE_POINTS = SCORPIUS.map(project);

/**
 * Empty space kept around the stars inside the frame (room for glow and cards).
 */
const MIN_PADDING = 0.3;
const MIN_ASPECT = 1;
const MAX_ASPECT = 1.8;
/**
 * Closest two extra stars (past the 15th project) may be, in projected units.
 */
const EXTRA_SPACING = 0.18;

/**
 * Stars beyond the figure's 15: scattered near it, repeatably, never crowding
 * others.
 */
function extraStars(count: number): Point[] {
  const random = seededRandom(8203);
  const xs = FIGURE_POINTS.map((p) => p.x);
  const ys = FIGURE_POINTS.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const placed = [...FIGURE_POINTS];
  const extras: Point[] = [];
  while (extras.length < count) {
    const candidate = {
      x: minX + (maxX - minX) * random(),
      y: minY + (maxY - minY) * random(),
    };
    if (
      placed.every(
        (p) => Math.hypot(p.x - candidate.x, p.y - candidate.y) > EXTRA_SPACING,
      )
    ) {
      placed.push(candidate);
      extras.push(candidate);
    }
  }
  return extras;
}

/**
 * Positions for `count` stars, the figure lines between them, and a frame that
 * fits.
 */
export function layoutConstellation(count: number): {
  points: Point[];
  segments: Segment[];
  box: Box;
} {
  const points = [
    ...FIGURE_POINTS.slice(0, count),
    ...extraStars(Math.max(0, count - FIGURE_POINTS.length)),
  ];
  const segments = FIGURE.filter(([a, b]) => a < count && b < count);
  if (count === 0)
    return { points, segments, box: { x: -1, y: -1, width: 2, height: 2 } };

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  const padding = Math.max(
    MIN_PADDING,
    0.15 * Math.max(maxX - minX, maxY - minY),
  );
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  // Keep the frame landscape but never a thin strip: grow the short side,
  // centred.
  let width = maxX - minX;
  let height = maxY - minY;
  if (width / height < MIN_ASPECT) {
    minX -= (height * MIN_ASPECT - width) / 2;
    width = height * MIN_ASPECT;
  } else if (width / height > MAX_ASPECT) {
    minY -= (width / MAX_ASPECT - height) / 2;
    height = width / MAX_ASPECT;
  }

  return { points, segments, box: { x: minX, y: minY, width, height } };
}

/**
 * A point as percentages of the frame, for positioning HTML on top of the SVG.
 */
export function toPercent(
  point: Point,
  box: Box,
): { left: number; top: number } {
  return {
    left: ((point.x - box.x) / box.width) * 100,
    top: ((point.y - box.y) / box.height) * 100,
  };
}
