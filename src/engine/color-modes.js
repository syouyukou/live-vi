import * as THREE from "three";

const PALETTES = [
  ["#111111", "#f5f2eb"],
  ["#1a1a2e", "#e8e4dc"],
  ["#c8ff00", "#0e0e0f"],
  ["#2d4a3e", "#f0ebe3"],
  ["#8b4513", "#fff8e7"],
];

export function applyColorMode(index, params) {
  const palette = PALETTES[index % PALETTES.length] ?? PALETTES[0];
  params.strokeColor = palette[0];
  params.bgColor = palette[1];
}

export function getMaterialColor(index, baseStroke, instanceIndex, seed) {
  const i = index % PALETTES.length;
  if (i === 2) {
    const hue = (instanceIndex * 0.07 + seed * 0.001) % 1;
    return new THREE.Color().setHSL(hue, 0.7, 0.55);
  }
  return new THREE.Color(baseStroke);
}

/** @param {string} hex */
export function normalizeHexColor(hex) {
  let h = String(hex).trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return null;
  return h.toLowerCase();
}

/**
 * @param {string} startHex
 * @param {string} endHex
 * @param {number} t 0–1
 */
export function lerpHexColor(startHex, endHex, t) {
  const a = normalizeHexColor(startHex) ?? "#111111";
  const b = normalizeHexColor(endHex) ?? "#111111";
  const u = Math.max(0, Math.min(1, t));
  const c1 = new THREE.Color(a);
  const c2 = new THREE.Color(b);
  return c1.lerp(c2, u);
}
