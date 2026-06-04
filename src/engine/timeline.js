/**
 * @typedef {{ time: number, value: number }[]} KeyframeTrack
 * @typedef {{ id: string, keyframes: KeyframeTrack }[]} TimelineParam
 */

export function createDefaultTimeline(duration = 8) {
  return {
    name: "VI Timeline",
    duration,
    playing: false,
    time: 0,
    params: [
      { id: "shapeModifyFactor", keyframes: [{ time: 0, value: 0.06 }, { time: duration, value: 0.14 }] },
      { id: "cameraZoomValue", keyframes: [{ time: 0, value: 1 }, { time: duration, value: 1.2 }] },
    ],
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleTrack(track, time) {
  const kf = track.keyframes;
  if (!kf.length) return null;
  if (time <= kf[0].time) return kf[0].value;
  if (time >= kf[kf.length - 1].time) return kf[kf.length - 1].value;
  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i];
    const b = kf[i + 1];
    if (time >= a.time && time <= b.time) {
      const t = (time - a.time) / (b.time - a.time);
      return lerp(a.value, b.value, t);
    }
  }
  return kf[kf.length - 1].value;
}

/**
 * @param {ReturnType<createDefaultTimeline>} timeline
 * @param {import("./params.js").ViParams} params
 */
export function applyTimeline(timeline, params, force = false) {
  if (!force && !timeline.playing && timeline.time === 0) return;
  for (const track of timeline.params) {
    const v = sampleTrack(track, timeline.time);
    if (v !== null && track.id in params) params[track.id] = v;
  }
}

export function tickTimeline(timeline, dt) {
  if (!timeline.playing) return;
  timeline.time += dt;
  if (timeline.time > timeline.duration) timeline.time = 0;
}
