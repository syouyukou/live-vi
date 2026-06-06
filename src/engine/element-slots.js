/** @typedef {{ offsetX: number, offsetY: number, rotateDeg: number, scale: number }} SlotTransform */

/** @param {import("./params.js").ViParams} params */
export function getElementBTransform(params) {
  if (!params.elementBEnabled) return null;
  return {
    offsetX: Number(params.elementBOffsetX) || 0,
    offsetY: Number(params.elementBOffsetY) || 0,
    rotateDeg: Number(params.elementBRotateDeg) || 0,
    scale: Math.min(200, Math.max(10, Number(params.elementBScale) || 100)),
  };
}

/**
 * @param {import("./sampler.js").Placement} pt
 * @param {SlotTransform | null} slot
 */
export function applySlotToPlacement(pt, slot) {
  if (!slot) return pt;
  const scaleMul = slot.scale / 100;
  return {
    ...pt,
    x: pt.x + slot.offsetX,
    y: pt.y + slot.offsetY,
    angle: pt.angle + (slot.rotateDeg * Math.PI) / 180,
    copyScaleMul: (pt.copyScaleMul ?? 1) * scaleMul,
  };
}
