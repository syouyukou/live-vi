import * as THREE from "three";
import { instanceAngle, instanceScales } from "./instance-modifiers.js";
import { applySlotToPlacement } from "./element-slots.js";

const MAX_CANVAS = 768;

/** @typedef {{ geometry: THREE.BufferGeometry, offsetX?: number, offsetY?: number, rotateDeg?: number, scale?: number }} OutlineSlot */

/**
 * @param {import("./sampler.js").Placement} pt
 * @param {THREE.BufferGeometry} unitGeom
 * @param {import("./params.js").ViParams} params
 * @param {{ world: { x: number, y: number }, active: boolean, direction?: number, directionValid?: boolean }} mouse
 * @param {number} scaleMul
 * @param {{ offsetX?: number, offsetY?: number, rotateDeg?: number, scale?: number } | null} [slot]
 */
function placementBounds(pt, unitGeom, params, mouse, scaleMul, slot = null) {
  const placed = slot ? applySlotToPlacement(pt, slot) : pt;
  const { scaleX, scaleY } = instanceScales(placed, params, mouse);
  const lineBoost = 1 + (params.elementLineWidth - 1) * 0.08;
  const copyMul = placed.copyScaleMul ?? 1;
  const rotZ = instanceAngle(placed.angle, placed, params, mouse);
  const cos = Math.cos(rotZ);
  const sin = Math.sin(rotZ);
  const sx = scaleX * lineBoost * scaleMul * copyMul;
  const sy = scaleY * lineBoost * scaleMul * copyMul;
  const pos = unitGeom.attributes.position.array;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    const ux = pos[i] * sx;
    const uy = pos[i + 1] * sy;
    const x = placed.x + ux * cos - uy * sin;
    const y = placed.y + ux * sin + uy * cos;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * @param {import("./sampler.js").Placement[]} placements
 * @param {OutlineSlot[]} slots
 * @param {import("./params.js").ViParams} params
 * @param {{ world: { x: number, y: number }, active: boolean }} mouse
 */
function computeWorldBounds(placements, slots, params, mouse) {
  const outlineBoost = params.outlineScale ?? 1.06;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pt of placements) {
    for (const slot of slots) {
      const b = placementBounds(
        pt,
        slot.geometry,
        params,
        mouse,
        outlineBoost,
        slot.offsetX != null || slot.rotateDeg != null || slot.scale != null
          ? {
              offsetX: slot.offsetX ?? 0,
              offsetY: slot.offsetY ?? 0,
              rotateDeg: slot.rotateDeg ?? 0,
              scale: slot.scale ?? 100,
            }
          : null,
      );
      if (b.minX < minX) minX = b.minX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.maxY > maxY) maxY = b.maxY;
    }
  }
  const pad = 6;
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
}

/** @param {Uint8Array} src @param {number} w @param {number} h @param {number} radius */
function dilateMask(src, w, h, radius) {
  const dst = new Uint8Array(w * h);
  const r = Math.max(1, radius);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let dy = -r; dy <= r && !on; dy++) {
        for (let dx = -r; dx <= r && !on; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (src[ny * w + nx]) on = 1;
        }
      }
      dst[y * w + x] = on;
    }
  }
  return dst;
}

/**
 * @param {Uint8Array} ring
 * @param {number} w
 * @param {number} h
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} bounds
 * @returns {THREE.BufferGeometry | null}
 */
function ringToGeometry(ring, w, h, bounds) {
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  if (spanX <= 0 || spanY <= 0) return null;

  const cellX = spanX / w;
  const cellY = spanY / h;
  const verts = [];
  const indices = [];
  let vi = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!ring[y * w + x]) continue;
      const x0 = bounds.minX + x * cellX;
      const x1 = x0 + cellX;
      const y0 = bounds.minY + y * cellY;
      const y1 = y0 + cellY;
      const base = vi;
      verts.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0);
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
      vi += 4;
    }
  }

  if (!verts.length) return null;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geom.setIndex(indices);
  geom.computeBoundingBox();
  return geom;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import("./sampler.js").Placement} pt
 * @param {THREE.BufferGeometry} unitGeom
 * @param {import("./params.js").ViParams} params
 * @param {{ world: { x: number, y: number }, active: boolean }} mouse
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} bounds
 * @param {number} w
 * @param {number} h
 * @param {{ offsetX?: number, offsetY?: number, rotateDeg?: number, scale?: number } | null} [slot]
 */
function rasterizePlacement(ctx, pt, unitGeom, params, mouse, bounds, w, h, slot = null) {
  const placed = slot ? applySlotToPlacement(pt, slot) : pt;
  const { scaleX, scaleY } = instanceScales(placed, params, mouse);
  const lineBoost = 1 + (params.elementLineWidth - 1) * 0.08;
  const copyMul = placed.copyScaleMul ?? 1;
  const rotZ = instanceAngle(placed.angle, placed, params, mouse);
  const cos = Math.cos(rotZ);
  const sin = Math.sin(rotZ);
  const sx = scaleX * lineBoost * copyMul;
  const sy = scaleY * lineBoost * copyMul;
  const pos = unitGeom.attributes.position.array;
  const index = unitGeom.index;
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;

  const tri = (ia, ib, ic) => {
    const toPx = (ux, uy) => {
      const x = placed.x + ux * cos - uy * sin;
      const y = placed.y + ux * sin + uy * cos;
      return {
        px: ((x - bounds.minX) / spanX) * w,
        py: h - ((y - bounds.minY) / spanY) * h,
      };
    };
    const a = toPx(pos[ia * 3] * sx, pos[ia * 3 + 1] * sy);
    const b = toPx(pos[ib * 3] * sx, pos[ib * 3 + 1] * sy);
    const c = toPx(pos[ic * 3] * sx, pos[ic * 3 + 1] * sy);
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.lineTo(c.px, c.py);
    ctx.closePath();
    ctx.fill();
  };

  if (index) {
    const arr = index.array;
    const vertCount = pos.length / 3;
    for (let i = 0; i < arr.length; i += 3) {
      const a = arr[i];
      const b = arr[i + 1];
      const c = arr[i + 2];
      if (a >= vertCount || b >= vertCount || c >= vertCount) continue;
      tri(a, b, c);
    }
  } else {
    for (let i = 0; i < pos.length; i += 9) {
      tri(i / 3, i / 3 + 1, i / 3 + 2);
    }
  }
}

/**
 * Build a single merged outline mesh geometry for overlapping instances (supports multiple element slots).
 * @param {import("./sampler.js").Placement[]} placements
 * @param {OutlineSlot[]} slots
 * @param {import("./params.js").ViParams} params
 * @param {{ world: { x: number, y: number }, active: boolean }} mouse
 * @returns {THREE.BufferGeometry | null}
 */
export function buildMergedOutlineGeometry(placements, slots, params, mouse) {
  if (!placements.length || !slots.length) return null;

  const bounds = computeWorldBounds(placements, slots, params, mouse);
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  if (spanX <= 0 || spanY <= 0) return null;

  const aspect = spanX / spanY;
  let w;
  let h;
  if (aspect >= 1) {
    w = MAX_CANVAS;
    h = Math.max(32, Math.round(MAX_CANVAS / aspect));
  } else {
    h = MAX_CANVAS;
    w = Math.max(32, Math.round(MAX_CANVAS * aspect));
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = "#fff";
  for (const pt of placements) {
    for (const slot of slots) {
      const transform =
        slot.offsetX != null || slot.rotateDeg != null || slot.scale != null
          ? {
              offsetX: slot.offsetX ?? 0,
              offsetY: slot.offsetY ?? 0,
              rotateDeg: slot.rotateDeg ?? 0,
              scale: slot.scale ?? 100,
            }
          : null;
      rasterizePlacement(ctx, pt, slot.geometry, params, mouse, bounds, w, h, transform);
    }
  }

  const image = ctx.getImageData(0, 0, w, h);
  const fill = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    fill[i] = image.data[i * 4 + 3] > 8 ? 1 : 0;
  }

  const pxPerUnit = Math.max(w / spanX, h / spanY);
  const outlineBoost = params.outlineScale ?? 1.06;
  const radiusPx = Math.max(
    1,
    Math.round((outlineBoost - 1) * params.baseScaleWidth * 3.5 * pxPerUnit),
  );
  const dilated = dilateMask(fill, w, h, radiusPx);
  const ring = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    ring[i] = dilated[i] && !fill[i] ? 1 : 0;
  }

  return ringToGeometry(ring, w, h, bounds);
}
