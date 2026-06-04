import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/** @typedef {{ base: Float32Array, count: number }} PathGroup */

/** @returns {PathGroup[]} */
export function parsePathSvg(svgText) {
  const loader = new SVGLoader();
  const data = loader.parse(svgText);
  /** @type {PathGroup[]} */
  const groups = [];
  const seen = new Set();

  for (const path of data.paths) {
    for (const points2d of extractPointSets(path)) {
      if (points2d.length < 2) continue;
      const first = points2d[0];
      const key = `${points2d.length}:${first.x.toFixed(1)},${first.y.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      groups.push(pointsToGroup(points2d));
    }
  }

  return groups;
}

/** @param {import("three").Vector2[]} points */
function filterValidPoints(points) {
  return points.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
}

function extractPointSets(path) {
  const sets = [];
  for (const subPath of path.subPaths) {
    const pts = filterValidPoints(subPath.getSpacedPoints(100));
    if (pts.length >= 2) sets.push(pts);
  }
  if (!sets.length) {
    for (const shape of SVGLoader.createShapes(path)) {
      const pts = filterValidPoints(shape.getSpacedPoints(100));
      if (pts.length >= 2) sets.push(pts);
    }
  }
  return sets;
}

function pointsToGroup(points2d) {
  const pts = filterValidPoints(points2d);
  const base = new Float32Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    base[i * 3] = pts[i].x;
    base[i * 3 + 1] = -pts[i].y;
    base[i * 3 + 2] = 0;
  }
  return { base, count: pts.length };
}
