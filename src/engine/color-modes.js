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
