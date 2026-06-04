import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** 與內建 unit 相近的標準尺寸，避免 @2x / 大 viewBox 導致間距與縮放異常 */
const UNIT_TARGET_SIZE = 10;

/**
 * @typedef {{
 *   geometry: THREE.BufferGeometry,
 *   unitLength: number,
 *   useSvgColors?: boolean,
 *   fillColor?: string,
 *   outlineColor?: string | null,
 * }} UnitShape
 */

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
    widthOverride ?? Math.min(vbMin * 0.18, Math.max(Number(style.strokeWidth) || 0, 2), 64);
  return {
    strokeColor: style.strokeColor ?? style.stroke ?? "#000",
    strokeWidth: Math.max(Number(style.strokeWidth) || 0, autoWidth, 1.5),
    strokeLineJoin: style.strokeLinejoin ?? style.strokeLineJoin ?? "round",
    strokeLineCap: style.strokeLinecap ?? style.strokeLineCap ?? "round",
    strokeMiterLimit: style.strokeMiterlimit ?? style.strokeMiterLimit ?? 4,
  };
}

function addStrokeGeometries(path, viewBoxSize, geoms, widthOverride) {
  const strokeStyle = strokeStyleFor(path, viewBoxSize, widthOverride);
  let added = false;
  for (const subPath of path.subPaths) {
    const pointCount = Math.min(40, Math.max(16, Math.ceil(subPath.getLength() / 14)));
    const points = subPath.getPoints(pointCount);
    if (points.length < 2) continue;
    const strokeGeom = SVGLoader.pointsToStroke(points, strokeStyle, 8, 0.3);
    if (strokeGeom) {
      geoms.push(strokeGeom);
      added = true;
    }
  }
  return added;
}

/** @param {ReturnType<SVGLoader["parse"]>} data */
function pathsToGeometries(data, viewBoxSize) {
  /** @type {THREE.BufferGeometry[]} */
  const geoms = [];
  const vbMin = Math.min(viewBoxSize[0], viewBoxSize[1]);
  const ribbonWidth = vbMin * 0.18;

  for (const path of data.paths) {
    const style = path.userData?.style ?? {};
    const open = isOpenPath(path);
    const calligraphic = open && !pathHasExplicitFill(path);
    let added = false;

    if (hasStroke(style)) {
      added = addStrokeGeometries(path, viewBoxSize, geoms);
    }

    if (!added && calligraphic) {
      added = addStrokeGeometries(path, viewBoxSize, geoms, ribbonWidth);
    }

    if (!added && hasFill(style)) {
      const shapes = SVGLoader.createShapes(path);
      if (shapes.length) {
        geoms.push(new THREE.ShapeGeometry(shapes));
        added = true;
      }
    }

    if (!added) {
      added = addStrokeGeometries(path, viewBoxSize, geoms, ribbonWidth);
    }

    if (!added) {
      const shapes = SVGLoader.createShapes(path);
      if (shapes.length) geoms.push(new THREE.ShapeGeometry(shapes));
    }
  }

  return geoms;
}

/** @param {THREE.BufferGeometry} geometry */
function finalizeUnitGeometry(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return null;

  const cx = (box.min.x + box.max.x) * 0.5;
  const cy = (box.min.y + box.max.y) * 0.5;
  geometry.translate(-cx, -cy, 0);
  geometry.scale(1, -1, 1);
  geometry.computeBoundingBox();

  const b = geometry.boundingBox;
  if (!b) return null;
  const w = b.max.x - b.min.x;
  const h = b.max.y - b.min.y;
  const maxDim = Math.max(w, h, 1e-6);
  const s = UNIT_TARGET_SIZE / maxDim;
  geometry.scale(s, s, 1);
  geometry.computeBoundingBox();

  return { geometry, unitLength: UNIT_TARGET_SIZE };
}

/**
 * @param {string} svgText
 * @param {{ useSvgColors?: boolean }} [opts]
 * @returns {UnitShape | null}
 */
export function parseUnitSvg(svgText, opts = {}) {
  const loader = new SVGLoader();
  const data = loader.parse(svgText);
  const viewBoxSize = getViewBoxSize(svgText);
  const parts = pathsToGeometries(data, viewBoxSize);
  if (!parts.length) return null;

  const geometry =
    parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
  if (!geometry) return null;
  if (parts.length > 1) {
    for (const g of parts) g.dispose();
  }

  const finalized = finalizeUnitGeometry(geometry);
  if (!finalized) return null;

  if (opts.useSvgColors) {
    const colors = extractSvgColors(data);
    return {
      ...finalized,
      useSvgColors: true,
      fillColor: colors.fillColor,
      outlineColor: colors.outlineColor,
    };
  }

  return finalized;
}
