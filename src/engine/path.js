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
      const key = `${points2d.length}:${points2d[0].x.toFixed(1)},${points2d[0].y.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      groups.push(pointsToGroup(points2d));
    }
  }

  return groups;
}

function extractPointSets(path) {
  const sets = [];
  for (const subPath of path.subPaths) {
    const pts = subPath.getSpacedPoints(100);
    if (pts.length >= 2) sets.push(pts);
  }
  if (!sets.length) {
    for (const shape of SVGLoader.createShapes(path)) {
      const pts = shape.getSpacedPoints(100);
      if (pts.length >= 2) sets.push(pts);
    }
  }
  return sets;
}

function pointsToGroup(points2d) {
  const base = new Float32Array(points2d.length * 3);
  for (let i = 0; i < points2d.length; i++) {
    base[i * 3] = points2d[i].x;
    base[i * 3 + 1] = -points2d[i].y;
    base[i * 3 + 2] = 0;
  }
  return { base, count: points2d.length };
}
