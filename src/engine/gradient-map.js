import * as THREE from "three";
import { normalizeHexColor } from "./color-modes.js";

/** @typedef {{ id: string, position: number, color: string, midpoint: number }} GradientStop */

let stopIdSeq = 0;

/** @returns {string} */
export function newGradientStopId() {
  stopIdSeq += 1;
  return `gs${stopIdSeq}`;
}

/** @returns {GradientStop[]} */
export function defaultGradientStops() {
  return [
    { id: newGradientStopId(), position: 0, color: "#39c837", midpoint: 0.5 },
    { id: newGradientStopId(), position: 0.5, color: "#111111", midpoint: 0.5 },
    { id: newGradientStopId(), position: 1, color: "#3366ff", midpoint: 0.5 },
  ];
}

/**
 * @param {string} start
 * @param {string} end
 * @returns {GradientStop[]}
 */
export function gradientStopsFromLegacy(start, end) {
  return [
    { id: newGradientStopId(), position: 0, color: normalizeHexColor(start) ?? "#39c837", midpoint: 0.5 },
    { id: newGradientStopId(), position: 1, color: normalizeHexColor(end) ?? "#3366ff", midpoint: 0.5 },
  ];
}

/**
 * @param {GradientStop[] | undefined} stops
 * @param {string} [fillColor]
 * @param {string} [gradientColorEnd]
 * @returns {GradientStop[]}
 */
export function ensureGradientStops(stops, fillColor, gradientColorEnd) {
  if (Array.isArray(stops) && stops.length >= 2) return normalizeGradientStops(stops);
  return gradientStopsFromLegacy(fillColor ?? "#39c837", gradientColorEnd ?? "#3366ff");
}

/**
 * @param {GradientStop[]} stops
 * @returns {GradientStop[]}
 */
export function normalizeGradientStops(stops) {
  const sorted = stops
    .map((s) => ({
      id: s.id || newGradientStopId(),
      position: Math.max(0, Math.min(1, Number(s.position) || 0)),
      color: normalizeHexColor(s.color) ?? "#111111",
      midpoint: Math.max(0.05, Math.min(0.95, Number(s.midpoint) || 0.5)),
    }))
    .sort((a, b) => a.position - b.position);

  if (sorted.length < 2) return defaultGradientStops();

  sorted[0].position = 0;
  sorted[sorted.length - 1].position = 1;

  for (let i = 1; i < sorted.length - 1; i++) {
    const prev = sorted[i - 1].position;
    const next = sorted[i + 1].position;
    sorted[i].position = Math.max(prev + 0.02, Math.min(next - 0.02, sorted[i].position));
  }

  return sorted;
}

/**
 * Photoshop-style segment bias: stop.midpoint is where 50% blend occurs (0–1 within segment).
 * @param {number} u 0–1 along segment
 * @param {number} midpoint
 */
export function applySegmentMidpoint(u, midpoint) {
  const m = Math.max(0.05, Math.min(0.95, midpoint));
  if (Math.abs(m - 0.5) < 0.001) return u;
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return Math.pow(u, Math.log(0.5) / Math.log(m));
}

/**
 * @param {GradientStop[]} stops
 * @param {number} t 0–1 along path
 * @returns {THREE.Color}
 */
export function sampleGradientMap(t, stops) {
  const list = normalizeGradientStops(stops);
  const x = Math.max(0, Math.min(1, t));

  if (x <= list[0].position) return new THREE.Color(list[0].color);
  if (x >= list[list.length - 1].position) return new THREE.Color(list[list.length - 1].color);

  for (let i = 0; i < list.length - 1; i++) {
    const a = list[i];
    const b = list[i + 1];
    if (x >= a.position && x <= b.position) {
      const span = b.position - a.position || 1;
      const u = (x - a.position) / span;
      const blend = applySegmentMidpoint(u, a.midpoint);
      const c1 = new THREE.Color(a.color);
      const c2 = new THREE.Color(b.color);
      return c1.lerp(c2, blend);
    }
  }

  return new THREE.Color(list[list.length - 1].color);
}

/** CSS linear-gradient preview matching engine sampling (incl. midpoints). */
export function gradientMapCss(stops, steps = 28) {
  const list = normalizeGradientStops(stops);
  const parts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const hex = `#${sampleGradientMap(t, list).getHexString()}`;
    parts.push(`${hex} ${(t * 100).toFixed(1)}%`);
  }
  return `linear-gradient(90deg, ${parts.join(", ")})`;
}

/** @param {GradientStop[]} stops */
export function syncLegacyFillFromStops(stops) {
  const list = normalizeGradientStops(stops);
  return {
    fillColor: list[0].color,
    gradientColorEnd: list[list.length - 1].color,
  };
}

/** @param {THREE.BufferGeometry} geometry */
export function clearGradientVertexColors(geometry) {
  if (geometry.attributes.color) geometry.deleteAttribute("color");
}

/**
 * Bake gradient into unit geometry so each instance shows the full map locally.
 * @param {THREE.BufferGeometry} geometry
 * @param {GradientStop[]} stops
 */
export function applyGradientVertexColors(geometry, stops) {
  const list = normalizeGradientStops(stops);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const sizeX = box.max.x - box.min.x;
  const sizeY = box.max.y - box.min.y;
  const alongY = sizeY >= sizeX;
  const min = alongY ? box.min.y : box.min.x;
  const span = (alongY ? sizeY : sizeX) || 1;

  const positions = geometry.attributes.position;
  if (!positions) return;

  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const coord = alongY ? positions.getY(i) : positions.getX(i);
    const t = (coord - min) / span;
    const c = sampleGradientMap(t, list);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const attr = geometry.attributes.color;
  if (attr) {
    attr.array.set(colors);
    attr.needsUpdate = true;
  } else {
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
}
