/** @typedef {{ x: number, y: number, z: number, angle: number, t: number, index: number, copyScaleMul?: number }} Placement */

/**
 * @param {{ x: number, y: number, z: number }[]} polyline
 * @param {number} spacing
 * @param {number} phase01 0~1 沿 path 起點錯開
 */
export function samplePlacements(polyline, spacing, phase01 = 0) {
  if (polyline.length < 2 || spacing <= 0) return [];

  let totalLen = 0;
  const segLens = [];
  for (let i = 0; i < polyline.length - 1; i++) {
    const len = Math.hypot(
      polyline[i + 1].x - polyline[i].x,
      polyline[i + 1].y - polyline[i].y,
    );
    segLens.push(len);
    totalLen += len;
  }

  let carry = totalLen * phase01;
  /** @type {Placement[]} */
  const placements = [];
  let globalIndex = 0;
  let distBeforeSeg = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const len = segLens[i];
    if (len < 0.001) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let d = carry;
    while (d < len) {
      const u = d / len;
      const along = distBeforeSeg + d;
      placements.push({
        x: a.x + dx * u,
        y: a.y + dy * u,
        z: a.z + (b.z - a.z) * u,
        angle: Math.atan2(dy, dx),
        t: along / Math.max(totalLen, 1),
        index: globalIndex++,
      });
      d += spacing;
    }
    distBeforeSeg += len;
    carry = d - len;
  }

  return placements;
}
