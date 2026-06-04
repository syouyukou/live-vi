/** @typedef {{ x: number, y: number, hIn?: {x:number,y:number}, hOut?: {x:number,y:number} }} BezierAnchor */

export function cubicAt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

export function resolveHandles(anchors, index) {
  const a = anchors[index];
  const b = anchors[index + 1];
  const p0 = { x: a.x, y: a.y };
  const p3 = { x: b.x, y: b.y };
  const mirror = (anchor, handle, fallback) =>
    handle ?? {
      x: anchor.x + (anchor.x - fallback.x) * 0.5,
      y: anchor.y + (anchor.y - fallback.y) * 0.5,
    };
  return {
    p0,
    p1: a.hOut ?? mirror(a, null, p3),
    p2: b.hIn ?? mirror(b, null, p0),
    p3,
  };
}

export function sampleBezierAnchors(anchors, segmentsPerCurve = 56) {
  if (anchors.length < 2) return [];
  const points = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const { p0, p1, p2, p3 } = resolveHandles(anchors, i);
    const steps = i === anchors.length - 2 ? segmentsPerCurve + 1 : segmentsPerCurve;
    const start = i === 0 ? 0 : 1;
    for (let s = start; s < steps; s++) {
      points.push(cubicAt(p0, p1, p2, p3, s / segmentsPerCurve));
    }
  }
  return points;
}

export function defaultBezierAnchors() {
  return [
    { x: -200, y: -20, hOut: { x: -90, y: 70 } },
    { x: -40, y: 30, hIn: { x: -120, y: -30 }, hOut: { x: 60, y: 80 } },
    { x: 120, y: -10, hIn: { x: 40, y: -60 }, hOut: { x: 200, y: 50 } },
    { x: 200, y: 20, hIn: { x: 160, y: -40 } },
  ];
}
