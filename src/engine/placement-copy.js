/** @typedef {import("./sampler.js").Placement} Placement */

/**
 * Duplicate each placement with stepped offset (Illustrator-style copy).
 * @param {Placement[]} placements
 * @param {import("./params.js").ViParams} params
 * @returns {Placement[]}
 */
export function expandPlacementsWithCopies(placements, params) {
  if (!params.elementCopyEnabled) return placements;

  const copies = Math.min(24, Math.max(1, Math.floor(params.elementCopyCount)));
  const dx = Number(params.elementCopyOffsetX) || 0;
  const dy = Number(params.elementCopyOffsetY) || 0;
  const dist = Number(params.elementCopyDistance) || 0;
  const angleRad = ((Number(params.elementCopyOffsetAngle) || 0) * Math.PI) / 180;
  const dirX = Math.cos(angleRad) * dist;
  const dirY = Math.sin(angleRad) * dist;
  const rotStep = ((Number(params.elementCopyRotateStep) || 0) * Math.PI) / 180;
  const scaleStep = Math.max(0.1, Math.min(2, (Number(params.elementCopyScaleStep) || 100) / 100));

  /** @type {Placement[]} */
  const out = [];
  let index = 0;

  for (const pt of placements) {
    out.push({ ...pt, index: index++ });
    for (let c = 1; c <= copies; c++) {
      const ox = (dx + dirX) * c;
      const oy = (dy + dirY) * c;
      out.push({
        ...pt,
        x: pt.x + ox,
        y: pt.y + oy,
        angle: pt.angle + rotStep * c,
        t: pt.t,
        index: index++,
        copyScaleMul: scaleStep ** c,
      });
    }
  }

  return out;
}
