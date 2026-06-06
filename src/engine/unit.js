import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** 與內建 unit 相近的標準尺寸，避免 @2x / 大 viewBox 導致間距與縮放異常 */
const UNIT_TARGET_SIZE = 10;
/** 無 SVG 描邊時，依 viewBox 產生 AI 風格均勻外框（相對 vb 短邊） */
const GENERATED_OUTLINE_VB_RATIO = 0.042;
/** 開放路徑書法筆觸寬度（相對 vb 短邊） */
const CALLIGRAPHIC_VB_RATIO = 0.18;

/** @typedef {{ geometry: THREE.BufferGeometry, outlineGeometry?: THREE.BufferGeometry | null, outlineLoops?: { x: number, y: number }[][], unitLength: number, useSvgColors?: boolean, fillColor?: string, outlineColor?: string | null, isCalligraphic?: boolean }} UnitShape */

/** outlineScale 參數 → 標準化 unit 空間內的描邊寬度（非 mesh 縮放） */
export function unitOutlineStrokeWidth(outlineScale = 1.14) {
  return 0.12 + Math.max(0, outlineScale - 1) * 2.2;
}

/** @param {number} outlineScale @param {[number, number]} viewBoxSize */
export function viewBoxOutlineStrokeWidth(outlineScale, viewBoxSize) {
  const vbMin = Math.min(viewBoxSize[0], viewBoxSize[1]);
  return vbMin * GENERATED_OUTLINE_VB_RATIO * Math.max(0.75, outlineScale);
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

/** @param {string} svgText */
export function svgHasVectorContent(svgText) {
  try {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    if (doc.querySelector("parsererror")) return false;
    return Boolean(
      doc.querySelector("path,circle,rect,ellipse,polygon,polyline,line"),
    );
  } catch {
    return false;
  }
}

function hasFill(style) {
  return style.fill !== undefined && style.fill !== "none";
}

function hasStroke(style) {
  return style.stroke !== undefined && style.stroke !== "none";
}

function pathHasExplicitFill(path) {
  const node = path.userData?.node;
  if (!node?.getAttribute) return false;
  const fill = node.getAttribute("fill");
  return fill !== null && fill !== "" && fill !== "none";
}

function isOpenPath(path) {
  for (const subPath of path.subPaths) {
    const pts = subPath.getPoints();
    if (pts.length < 2) continue;
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (Math.hypot(a.x - b.x, a.y - b.y) > 2) return true;
  }
  return false;
}

/** @param {import("three/examples/jsm/loaders/SVGLoader.js").ShapePath} path */
function extractPathColors(path) {
  const style = path.userData?.style ?? {};
  let fill = null;
  let stroke = null;
  if (path.color?.isColor) fill = `#${path.color.getHexString()}`;
  else if (hasFill(style) && typeof style.fill === "string") fill = style.fill;
  if (hasStroke(style) && typeof style.stroke === "string") stroke = style.stroke;
  return { fill, stroke };
}

/** @param {ReturnType<SVGLoader["parse"]>} data */
function extractSvgColors(data) {
  let fill = null;
  let stroke = null;
  for (const path of data.paths) {
    const c = extractPathColors(path);
    if (c.fill) fill = c.fill;
    if (c.stroke) stroke = c.stroke;
  }
  return {
    fillColor: fill ?? "#111111",
    outlineColor: stroke,
  };
}

function strokeStyleFor(path, viewBoxSize, widthOverride) {
  const style = path.userData?.style ?? {};
  const vbMin = Math.min(viewBoxSize[0], viewBoxSize[1]);
  const autoWidth =
    widthOverride ?? Math.min(vbMin * CALLIGRAPHIC_VB_RATIO, Math.max(Number(style.strokeWidth) || 0, 2), 64);
  return {
    strokeColor: style.strokeColor ?? style.stroke ?? "#000",
    strokeWidth: Math.max(Number(style.strokeWidth) || 0, autoWidth, 1.5),
    strokeLineJoin: style.strokeLinejoin ?? style.strokeLineJoin ?? "round",
    strokeLineCap: style.strokeLinecap ?? style.strokeLineCap ?? "round",
    strokeMiterLimit: style.strokeMiterlimit ?? style.strokeMiterLimit ?? 4,
  };
}

/** @param {import("three").Vector2[] | { x: number, y: number }[]} points @param {number} cx @param {number} cy @param {number} s */
function transformPointsToUnit(points, cx, cy, s) {
  return points.map((p) => ({
    x: (p.x - cx) * s,
    y: -(p.y - cy) * s,
  }));
}

/** @param {{ x: number, y: number }[][]} loops @param {number} strokeWidthUnit */
export function buildOutlineGeometryFromLoops(loops, strokeWidthUnit) {
  if (!loops.length) return null;
  const style = {
    strokeColor: "#000",
    strokeWidth: Math.max(strokeWidthUnit, 0.04),
    strokeLineJoin: "round",
    strokeLineCap: "round",
    strokeMiterLimit: 4,
  };
  /** @type {THREE.BufferGeometry[]} */
  const geoms = [];
  for (const loop of loops) {
    if (loop.length < 2) continue;
    const vectors = loop.map((p) => new THREE.Vector2(p.x, p.y));
    const g = SVGLoader.pointsToStroke(vectors, style, 12, 0.3);
    if (g) geoms.push(g);
  }
  return mergeOrNull(geoms);
}

/** @param {import("three/examples/jsm/loaders/SVGLoader.js").Path} subPath */
function subPathPointCount(subPath) {
  return Math.min(96, Math.max(16, Math.ceil(subPath.getLength() / 12)));
}

/** @param {import("three/examples/jsm/loaders/SVGLoader.js").Path} subPath */
function isClosedSubPath(subPath) {
  const pts = subPath.getPoints(4);
  if (pts.length < 3) return false;
  const a = pts[0];
  const b = pts[pts.length - 1];
  return Math.hypot(a.x - b.x, a.y - b.y) <= 2;
}

/** @param {import("three").Vector2[]} pts */
function signedArea2(pts) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return area * 0.5;
}

/**
 * 複合 path（多個 M 子路徑）時，createShapes 可能漏掉輪廓；改逐段填色。
 * @param {import("three/examples/jsm/loaders/SVGLoader.js").ShapePath} path
 * @param {[number, number]} viewBoxSize
 */
function addFillGeometries(path, geoms, viewBoxSize) {
  const shapes = SVGLoader.createShapes(path);
  const subPathCount = path.subPaths.length;
  const vbArea = viewBoxSize[0] * viewBoxSize[1];
  const minArea = vbArea * 0.0003;

  if (subPathCount > 1 && shapes.length < subPathCount) {
    let added = 0;
    for (const subPath of path.subPaths) {
      if (!isClosedSubPath(subPath)) continue;
      const pts = subPath.getPoints(subPathPointCount(subPath));
      if (Math.abs(signedArea2(pts)) < minArea) continue;
      geoms.push(new THREE.ShapeGeometry(new THREE.Shape(pts)));
      added++;
    }
    if (added > 0) return true;
  }

  for (const shape of shapes) {
    geoms.push(new THREE.ShapeGeometry(shape));
  }
  return shapes.length > 0;
}

function addStrokeGeometries(path, viewBoxSize, geoms, widthOverride, loopSink) {
  const strokeStyle = strokeStyleFor(path, viewBoxSize, widthOverride);
  let added = false;
  for (const subPath of path.subPaths) {
    const pointCount = Math.min(64, Math.max(20, Math.ceil(subPath.getLength() / 10)));
    const points = subPath.getPoints(pointCount);
    if (points.length < 2) continue;
    loopSink?.push(points);
    const strokeGeom = SVGLoader.pointsToStroke(points, strokeStyle, 12, 0.3);
    if (strokeGeom) {
      geoms.push(strokeGeom);
      added = true;
    }
  }
  return added;
}

/** 收集輪廓點（用於之後依 stroke width 重建外框） */
function collectOutlineLoops(path, viewBoxSize, loopSink, stroked) {
  if (stroked) {
    for (const subPath of path.subPaths) {
      const pointCount = Math.min(64, Math.max(20, Math.ceil(subPath.getLength() / 10)));
      const points = subPath.getPoints(pointCount);
      if (points.length >= 2) loopSink.push(points);
    }
    return;
  }

  const shapes = SVGLoader.createShapes(path);
  const vbArea = viewBoxSize[0] * viewBoxSize[1];
  const minArea = vbArea * 0.0003;
  if (path.subPaths.length > 1 && shapes.length < path.subPaths.length) {
    for (const subPath of path.subPaths) {
      if (!isClosedSubPath(subPath)) continue;
      const points = subPath.getPoints(subPathPointCount(subPath));
      if (Math.abs(signedArea2(points)) < minArea) continue;
      loopSink.push(points);
    }
    return;
  }

  for (const shape of shapes) {
    const points = shape.getSpacedPoints(80);
    if (points.length >= 2) loopSink.push(points);
  }
}

/**
 * @param {ReturnType<SVGLoader["parse"]>} data
 */
function pathsToFillAndOutline(data, viewBoxSize) {
  /** @type {THREE.BufferGeometry[]} */
  const fillGeoms = [];
  /** @type {import("three").Vector2[][]} */
  const outlineLoopsSvg = [];
  const vbMin = Math.min(viewBoxSize[0], viewBoxSize[1]);
  const ribbonWidth = vbMin * CALLIGRAPHIC_VB_RATIO;
  let calligraphic = false;

  for (const path of data.paths) {
    const style = path.userData?.style ?? {};
    const open = isOpenPath(path);

    // 開放路徑一律當描邊／筆觸（AI 常把筆刷色寫在 fill，不是封閉填色）
    if (open) {
      calligraphic = true;
      addStrokeGeometries(path, viewBoxSize, fillGeoms, ribbonWidth);
      continue;
    }

    const filled = hasFill(style);
    const stroked = hasStroke(style);

    if (filled) {
      addFillGeometries(path, fillGeoms, viewBoxSize);
      collectOutlineLoops(path, viewBoxSize, outlineLoopsSvg, stroked);
      continue;
    }

    if (stroked) {
      addStrokeGeometries(path, viewBoxSize, fillGeoms);
      continue;
    }

    if (addFillGeometries(path, fillGeoms, viewBoxSize)) {
      collectOutlineLoops(path, viewBoxSize, outlineLoopsSvg, false);
    } else {
      addStrokeGeometries(path, viewBoxSize, fillGeoms, ribbonWidth);
      calligraphic = true;
    }
  }

  return { fillGeoms, outlineLoopsSvg, calligraphic };
}

function mergeOrNull(geoms) {
  if (!geoms.length) return null;
  if (geoms.length === 1) return geoms[0];
  const merged = mergeGeometries(geoms, false);
  for (const g of geoms) g.dispose();
  return merged;
}

/** @param {THREE.BufferGeometry} geometry @param {number} cx @param {number} cy @param {number} s */
function applyUnitTransform(geometry, cx, cy, s) {
  geometry.translate(-cx, -cy, 0);
  geometry.scale(1, -1, 1);
  geometry.scale(s, s, 1);
  geometry.computeBoundingBox();
}

/** @param {import("three").Vector2[][]} loopsSvg @param {number} cx @param {number} cy @param {number} s */
function loopsSvgToUnit(loopsSvg, cx, cy, s) {
  return loopsSvg.map((pts) => transformPointsToUnit(pts, cx, cy, s));
}

/**
 * @param {UnitShape} unit
 * @param {number} outlineScale
 */
export function applyUnitOutlineWidth(unit, outlineScale = 1.14) {
  if (!unit.outlineLoops?.length) return;
  if (unit.outlineGeometry) unit.outlineGeometry.dispose();
  unit.outlineGeometry = buildOutlineGeometryFromLoops(
    unit.outlineLoops,
    unitOutlineStrokeWidth(outlineScale),
  );
}

/**
 * @param {string} svgText
 * @param {{ useSvgColors?: boolean, outlineScale?: number }} [opts]
 * @returns {UnitShape | null}
 */
export function parseUnitSvg(svgText, opts = {}) {
  if (!svgText?.trim()) return null;

  const loader = new SVGLoader();
  const data = loader.parse(svgText);
  const viewBoxSize = getViewBoxSize(svgText);

  if (!data.paths.length && !svgHasVectorContent(svgText)) return null;

  const outlineScale = opts.outlineScale ?? 1.14;
  const { fillGeoms, outlineLoopsSvg, calligraphic } = pathsToFillAndOutline(data, viewBoxSize);
  if (!fillGeoms.length) return null;

  const fillGeom = mergeOrNull(fillGeoms);
  if (!fillGeom) return null;

  fillGeom.computeBoundingBox();
  const box = fillGeom.boundingBox;
  if (!box) return null;

  const cx = (box.min.x + box.max.x) * 0.5;
  const cy = (box.min.y + box.max.y) * 0.5;
  const maxDim = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, 1e-6);
  const s = UNIT_TARGET_SIZE / maxDim;

  applyUnitTransform(fillGeom, cx, cy, s);

  const outlineLoops = calligraphic ? undefined : loopsSvgToUnit(outlineLoopsSvg, cx, cy, s);
  const outlineGeom =
    outlineLoops?.length ?
      buildOutlineGeometryFromLoops(outlineLoops, unitOutlineStrokeWidth(outlineScale))
    : null;

  const base = {
    geometry: fillGeom,
    outlineGeometry: outlineGeom,
    outlineLoops,
    unitLength: UNIT_TARGET_SIZE,
    isCalligraphic: calligraphic,
  };

  if (opts.useSvgColors) {
    const colors = extractSvgColors(data);
    return {
      ...base,
      useSvgColors: true,
      fillColor: colors.fillColor,
      outlineColor: colors.outlineColor,
    };
  }

  return base;
}
