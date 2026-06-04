function seededRandom(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function falloff(dist, radius) {
  const t = Math.max(0, 1 - dist / radius);
  return t * t * (3 - 2 * t);
}

function influenceAt(x, y, point, radius) {
  const dx = x - point.x;
  const dy = y - point.y;
  return falloff(Math.hypot(dx, dy), radius);
}

/** @param {number} a @param {number} b @param {number} t */
export function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}

/**
 * @param {number} pathAngle
 * @param {{ x: number, y: number }} placement
 * @param {import("./params.js").ViParams} params
 * @param {{ world: { x: number, y: number }, active: boolean, direction?: number, directionValid?: boolean }} mouse
 */
export function instanceAngle(pathAngle, placement, params, mouse) {
  const elementRad = (params.elementAngleDeg * Math.PI) / 180;
  const base = pathAngle + elementRad;

  if (!params.mouseFollowDirection || !params.mouseEnabled || !mouse.active) {
    return base;
  }

  const inf = influenceAt(placement.x, placement.y, mouse.world, params.mouseRadius);
  if (inf <= 0) return base;

  const t = inf * params.mouseDirectionInfluence;
  const towardMouse =
    Math.atan2(mouse.world.y - placement.y, mouse.world.x - placement.x) + elementRad;
  return lerpAngle(base, towardMouse, t);
}

/**
 * @param {{ x: number, y: number, t: number, index: number }} placement
 * @param {import("./params.js").ViParams} params
 * @param {{ world: { x: number, y: number, z: number }, active: boolean }} mouse
 */
export function instanceScales(placement, params, mouse) {
  const r = seededRandom(params.seed * 0.31 + placement.index * 0.17);
  const rnd = (r - 0.5) * 2 * params.randomnessMultiply * 0.2;

  let scaleLen =
    params.baseScaleLength *
    (1 + rnd * params.randomnessSensitivityLength * params.sharedScaleDirectionX);
  let scaleWid =
    params.baseScaleWidth *
    (1 + rnd * params.randomnessSensitivityWidth * params.sharedScaleDirectionY);

  if (params.mouseEnabled && mouse.active) {
    const inf = influenceAt(placement.x, placement.y, mouse.world, params.mouseRadius);
    scaleLen *= 1 + inf * params.scalingByMouseSensitivityLength * 0.35;
    scaleWid *= 1 + inf * params.scalingByMouseSensitivityWidth * 0.35;
  }

  if (params.handEnabled) {
    const hand = { x: params.handPosX, y: params.handPosY };
    const inf = influenceAt(placement.x, placement.y, hand, params.handRadius);
    scaleLen *= 1 + inf * params.handInfluence * 0.4;
    scaleWid *= 1 + inf * params.handInfluence * 0.3;
  }

  const minW = params.baseScaleWidth < 0.15 ? 0.03 : 0.15;
  return {
    scaleX: Math.max(0.15, scaleLen),
    scaleY: Math.max(minW, scaleWid),
  };
}
