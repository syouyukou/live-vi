import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/** @typedef {{ base: Float32Array, count: number }} PathGroup */

/** @typedef {{ group: PathGroup, path: import("three/examples/jsm/loaders/SVGLoader.js").ShapePath, subPathIndex: number }} PathEntry */

/** @returns {PathGroup[]} */
export function parsePathSvg(svgText) {
  const loader = new SVGLoader();
  const data = loader.parse(svgText);
  const viewBoxSize = getViewBoxSize(svgText);
  /** @type {PathEntry[]} */
  const entries = [];
  const seen = new Set();

  data.paths.forEach((path, pathIndex) => {
    path.subPaths.forEach((subPath, subPathIndex) => {
      const points2d = filterValidPoints(spacedPointsForSubPath(subPath));
      if (points2d.length < 2) return;
      const first = points2d[0];
      const key = `${pathIndex}:${subPathIndex}:${points2d.length}:${first.x.toFixed(1)},${first.y.toFixed(1)}`;
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({ group: pointsToGroup(points2d), path, subPathIndex });
    });

    if (!path.subPaths.length) {
      for (const points2d of extractShapePointSets(path)) {
        if (points2d.length < 2) continue;
        const first = points2d[0];
        const key = `${pathIndex}:shape:${points2d.length}:${first.x.toFixed(1)},${first.y.toFixed(1)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push({ group: pointsToGroup(points2d), path, subPathIndex: -1 });
      }
    }
  });

  return filterPathEntries(entries, viewBoxSize).map((entry) => entry.group);
}

/** @param {import("three/examples/jsm/loaders/SVGLoader.js").Path} subPath */
function spacedPointsForSubPath(subPath) {
  const count = Math.min(400, Math.max(100, Math.ceil(subPath.getLength() / 5)));
  return subPath.getSpacedPoints(count);
}

/** @returns {[number, number]} */
function getViewBoxSize(svgText) {
  try {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return [100, 100];
    const vb = svg.getAttribute("viewBox");
    if (vb) {
      const parts = vb.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4) return [Math.max(parts[2], 1), Math.max(parts[3], 1)];
    }
    const w = parseFloat(String(svg.getAttribute("width") || "100").replace(/px$/, ""));
    const h = parseFloat(String(svg.getAttribute("height") || "100").replace(/px$/, ""));
    return [Math.max(w, 1), Math.max(h, 1)];
  } catch {
    return [100, 100];
  }
}

/** @param {PathGroup} group */
function boundsOfGroup(group) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < group.count; i++) {
    const x = group.base[i * 3];
    const y = group.base[i * 3 + 1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    w: Math.max(0, maxX - minX),
    h: Math.max(0, maxY - minY),
  };
}

/**
 * Illustrator 匯出常含與 viewBox 同大的畫板框；略過後才會只留下實際路徑。
 * @param {import("three/examples/jsm/loaders/SVGLoader.js").ShapePath} path
 * @param {{ w: number, h: number }} bounds
 * @param {[number, number]} viewBoxSize
 */
function isArtboardFrame(path, bounds, viewBoxSize) {
  const [vbW, vbH] = viewBoxSize;
  const tol = Math.max(vbW, vbH, 1) * 0.04;

  const node = path.userData?.node;
  const tag = node?.tagName?.toLowerCase?.() ?? "";
  if (tag === "rect") {
    const rw = parseFloat(node.getAttribute("width") || "0");
    const rh = parseFloat(node.getAttribute("height") || "0");
    if (rw >= vbW - tol && rh >= vbH - tol) return true;
  }

  if (bounds.w >= vbW - tol && bounds.h >= vbH - tol) {
    const areaRatio = (bounds.w * bounds.h) / Math.max(vbW * vbH, 1);
    if (areaRatio > 0.82) return true;
  }

  return false;
}

/** @param {PathEntry[]} entries @param {[number, number]} viewBoxSize */
function filterPathEntries(entries, viewBoxSize) {
  if (!entries.length) return entries;

  const filtered = entries.filter(({ group, path }) => {
    const bounds = boundsOfGroup(group);
    return !isArtboardFrame(path, bounds, viewBoxSize);
  });

  return filtered.length ? filtered : entries;
}

/** @param {import("three").Vector2[]} points */
function filterValidPoints(points) {
  return points.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
}

/** @param {import("three/examples/jsm/loaders/SVGLoader.js").ShapePath} path */
function extractShapePointSets(path) {
  const sets = [];
  for (const shape of SVGLoader.createShapes(path)) {
    const pts = filterValidPoints(shape.getSpacedPoints(120));
    if (pts.length >= 2) sets.push(pts);
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
