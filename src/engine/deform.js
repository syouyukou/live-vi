function seededRandom(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hashSeed(seed, i) {
  return seededRandom(seed * 0.017 + i * 0.131);
}

/** @param {import("./path.js").PathGroup} group */
export function deformPolyline(group, t, params) {
  const { base, count } = group;
  const mod = params.shapeModifyFactor;
  const rot = params.shapeRotateFactor;
  const px = params.shapePosX;
  const py = params.shapePosY;
  const phaseX = hashSeed(params.seed, 1) * Math.PI * 2;
  const phaseY = hashSeed(params.seed, 2) * Math.PI * 2;
  const points = [];

  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  for (let i = 0; i < count; i++) {
    let x = base[i * 3] + px;
    let y = base[i * 3 + 1] + py;
    const dist = Math.hypot(x, y);

    const wave =
      Math.sin(y * 0.03 + t * params.speed + phaseX) * mod * 80 +
      Math.cos(x * 0.025 + t * params.speed * 0.9 + phaseY) * mod * 60 +
      Math.sin(dist * 0.02 + t + phaseX) * mod * 40;

    x += wave * 0.6;
    y += Math.sin(x * 0.02 + t + phaseY) * mod * 50;

    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;

    points.push({ x: rx, y: ry, z: wave * 0.2 });
  }
  return points;
}
