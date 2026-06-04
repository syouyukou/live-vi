import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** 與內建 unit 相近的標準尺寸，避免 @2x / 大 viewBox 導致間距與縮放異常 */
const UNIT_TARGET_SIZE = 10;

/** @typedef {{ geometry: THREE.BufferGeometry, unitLength: number }} UnitShape */

function getViewBoxSize(svgText) {
  try {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return 100;
    const vb = svg.getAttribute("viewBox");
    if (vb) {
      const parts = vb.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4) return Math.max(parts[2], parts[3], 1);
    }
    const w = parseFloat(String(svg.getAttribute("width") || "100").replace(/px$/, ""));
    const h = parseFloat(String(svg.getAttribute("height") || "100").replace(/px$/, ""));
    return Math.max(w, h, 1);
  } catch {
    return 100;
  }
}

function hasFill(style) {
  return style.fill !== undefined && style.fill !== "none";
}

function hasStroke(style) {
  return style.stroke !== undefined && style.stroke !== "none";
}

/** @param {import("three/examples/jsm/loaders/SVGLoader.js").SVGLoader} loader */
function pathsToGeometries(data, viewBoxSize) {
  /** @type {THREE.BufferGeometry[]} */
  const geoms = [];

  for (const path of data.paths) {
    const style = path.userData?.style ?? {};
    let added = false;

    if (hasFill(style)) {
      const shapes = SVGLoader.createShapes(path);
      if (shapes.length) {
        geoms.push(new THREE.ShapeGeometry(shapes));
        added = true;
      }
    }

    if (!added && (hasStroke(style) || !hasFill(style))) {
      const strokeStyle = {
        strokeColor: style.strokeColor ?? style.stroke ?? "#000",
        strokeWidth: Math.max(
          Number(style.strokeWidth) || 0,
          viewBoxSize * 0.02,
          1,
        ),
        strokeLineJoin: style.strokeLinejoin ?? style.strokeLineJoin ?? "round",
        strokeLineCap: style.strokeLinecap ?? style.strokeLineCap ?? "round",
        strokeMiterLimit: style.strokeMiterlimit ?? style.strokeMiterLimit ?? 4,
      };

      for (const subPath of path.subPaths) {
        const points = subPath.getPoints(Math.max(8, Math.ceil(subPath.getLength() / 4)));
        if (points.length < 2) continue;
        const strokeGeom = SVGLoader.pointsToStroke(points, strokeStyle, 8, 0.25);
        if (strokeGeom) geoms.push(strokeGeom);
        added = true;
      }
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

/** @returns {UnitShape | null} */
export function parseUnitSvg(svgText) {
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

  return finalizeUnitGeometry(geometry);
}
