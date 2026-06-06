function seededRandom(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function falloff(dist, radius) {
  const t = Math.max(0, 1 - dist / radius);
  return t * t * (3 - 2 * t);
}

/** @param {number} edge0 @param {number} edge1 @param {number} x */
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** @param {{ speed?: number, smoothedSpeed?: number }} mouse @param {number} [cap] */
function speedFactor(mouse, cap = 1.5) {
  const spd = mouse.smoothedSpeed ?? mouse.speed ?? 0;
  return smoothstep(0, cap, spd);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {{ world: { x: number, y: number }, direction?: number, directionValid?: boolean, speed?: number, smoothedSpeed?: number }} mouse
 * @param {import("./params.js").ViParams} params
 */
function mouseInfluenceAt(x, y, mouse, params) {
  const point = mouse.world;
  const radius = params.mouseRadius;
  const dx = x - point.x;
  const dy = y - point.y;
  const trailStretch = params.mouseTrailStretch ?? 0;
  const spd = mouse.smoothedSpeed ?? mouse.speed ?? 0;

  if (trailStretch > 0 && mouse.directionValid && spd > 0.02) {
    const cos = Math.cos(mouse.direction);
    const sin = Math.sin(mouse.direction);
    const along = dx * cos + dy * sin;
    const across = -dx * sin + dy * cos;
    const stretch = 1 + trailStretch * Math.min(spd * 2.5, 1);
    const alongScale = along < 0 ? stretch : 1 / Math.sqrt(stretch);
    const effectiveDist = Math.hypot(along / alongScale, across);
    return falloff(effectiveDist, radius);
  }

  return falloff(Math.hypot(dx, dy), radius);
}

/** @type {readonly ["toward", "motion", "blend", "perpendicular"]} */
export const MOUSE_DIRECTION_MODES = ["toward", "motion", "blend", "perpendicular"];

/**
 * @param {{ x: number, y: number }} placement
 * @param {import("./params.js").ViParams} params
 * @param {{ world: { x: number, y: number }, direction?: number, directionValid?: boolean, speed?: number, smoothedSpeed?: number }} mouse
 */
function targetAngleForMode(placement, params, mouse) {
  const elementRad = (params.elementAngleDeg * Math.PI) / 180;
  const towardCursor =
    Math.atan2(mouse.world.y - placement.y, mouse.world.x - placement.x) + elementRad;

  if (!mouse.directionValid) return towardCursor;

  const motion = mouse.direction + elementRad;
  const perp = motion + Math.PI / 2;
  const mode = params.mouseDirectionMode ?? "toward";

  switch (mode) {
    case "motion":
      return motion;
    case "blend":
      return lerpAngle(towardCursor, motion, speedFactor(mouse));
    case "perpendicular":
      return perp;
    default:
      return towardCursor;
  }
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
 * @param {{ world: { x: number, y: number }, active: boolean, direction?: number, directionValid?: boolean, speed?: number, smoothedSpeed?: number }} mouse
 */
export function instanceAngle(pathAngle, placement, params, mouse) {
  const elementRad = (params.elementAngleDeg * Math.PI) / 180;
  const base = pathAngle + elementRad;

  if (!params.mouseFollowDirection || !params.mouseEnabled || !mouse.active) {
    return base;
  }

  const inf = mouseInfluenceAt(placement.x, placement.y, mouse, params);
  if (inf <= 0) return base;

  const t = inf * params.mouseDirectionInfluence;
  const target = targetAngleForMode(placement, params, mouse);
  return lerpAngle(base, target, t);
}

/**
 * @param {number} scaleLen
 * @param {number} scaleWid
 * @param {number} inf
 * @param {{ angle: number }} placement
 * @param {import("./params.js").ViParams} params
 * @param {{ direction?: number, directionValid?: boolean, speed?: number, smoothedSpeed?: number }} mouse
 */
function applySpeedScaleEffects(scaleLen, scaleWid, inf, placement, params, mouse) {
  const sf = speedFactor(mouse);
  if (sf <= 0) return { scaleLen, scaleWid };

  let len = scaleLen;
  let wid = scaleWid;

  if (params.mouseSpeedScale > 0) {
    const boost = 1 + inf * params.mouseSpeedScale * sf * 0.35;
    len *= boost;
    wid *= 1 + inf * params.mouseSpeedScale * sf * 0.2;
  }

  if (params.mouseSpeedStretch > 0 && mouse.directionValid) {
    const pathAngle = placement.angle + (params.elementAngleDeg * Math.PI) / 180;
    const align = Math.abs(Math.cos(pathAngle - mouse.direction));
    const stretch = 1 + inf * params.mouseSpeedStretch * sf * align * 0.45;
    len *= stretch;
    wid *= Math.max(0.5, 1 / Math.sqrt(stretch));
  }

  return { scaleLen: len, scaleWid: wid };
}

/**
 * @param {{ x: number, y: number, t: number, index: number, angle?: number }} placement
 * @param {import("./params.js").ViParams} params
 * @param {{ world: { x: number, y: number, z: number }, active: boolean, direction?: number, directionValid?: boolean, speed?: number, smoothedSpeed?: number }} mouse
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
    const inf = mouseInfluenceAt(placement.x, placement.y, mouse, params);
    scaleLen *= 1 + inf * params.scalingByMouseSensitivityLength * 0.35;
    scaleWid *= 1 + inf * params.scalingByMouseSensitivityWidth * 0.35;
    ({ scaleLen, scaleWid } = applySpeedScaleEffects(
      scaleLen,
      scaleWid,
      inf,
      placement,
      params,
      mouse,
    ));
  }

  if (params.handEnabled) {
    const hand = { x: params.handPosX, y: params.handPosY };
    const inf = falloff(
      Math.hypot(placement.x - hand.x, placement.y - hand.y),
      params.handRadius,
    );
    scaleLen *= 1 + inf * params.handInfluence * 0.4;
    scaleWid *= 1 + inf * params.handInfluence * 0.3;
  }

  const minW = params.baseScaleWidth < 0.15 ? 0.03 : 0.15;
  return {
    scaleX: Math.max(0.15, scaleLen),
    scaleY: Math.max(minW, scaleWid),
  };
}
