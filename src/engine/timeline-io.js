/**
 * Timeline JSON import/export (aligned with composer.autumnmeteorite.jp).
 */

/**
 * @param {unknown} data
 * @returns {{ ok: true, data: object } | { ok: false, message: string }}
 */
export function validateTimeline(data) {
  if (!data || typeof data !== "object") {
    return { ok: false, message: "Invalid timeline config JSON" };
  }
  const tl = /** @type {{ duration?: number; params?: unknown[]; name?: string }} */ (data);
  const name = tl.name ?? "未命名タイムライン";
  const duration = tl.duration;
  if (typeof duration !== "number" || duration <= 0) {
    return { ok: false, message: `タイムライン「${name}」の duration が無効です` };
  }
  if (!Array.isArray(tl.params) || tl.params.length === 0) {
    return { ok: false, message: `タイムライン「${name}」の params が空です` };
  }
  for (const track of tl.params) {
    if (!track || typeof track !== "object") {
      return { ok: false, message: "パラメータ定義が不正です" };
    }
    const { id, keyframes } = /** @type {{ id?: string; keyframes?: unknown[] }} */ (track);
    if (!id || !Array.isArray(keyframes)) {
      return { ok: false, message: "パラメータに id または keyframes がありません" };
    }
    for (const kf of keyframes) {
      if (!kf || typeof kf !== "object") continue;
      const { time, value } = /** @type {{ time?: number; value?: number }} */ (kf);
      if (typeof time === "number" && time > duration) {
        return {
          ok: false,
          message: `「${id}」のキーフレーム time=${time} が duration=${duration} を超えています`,
        };
      }
      if (value === undefined) {
        return { ok: false, message: `「${id}」のキーフレームに value がありません` };
      }
    }
  }
  return { ok: true, data: tl };
}

/**
 * @param {ReturnType<import("./timeline.js").createDefaultTimeline>} timeline
 */
export function exportTimelineJson(timeline) {
  return JSON.stringify(
    {
      version: 1,
      name: timeline.name ?? "VI Timeline",
      duration: timeline.duration,
      params: timeline.params,
    },
    null,
    2,
  );
}

/**
 * @param {string} json
 * @param {ReturnType<import("./timeline.js").createDefaultTimeline>} timeline
 */
export function importTimelineJson(json, timeline) {
  const raw = JSON.parse(json);
  const payload = raw.timeline ?? raw;
  const result = validateTimeline(payload);
  if (!result.ok) throw new Error(result.message);

  const data = result.data;
  timeline.duration = data.duration;
  timeline.params = data.params.map((p) => ({
    id: p.id,
    keyframes: p.keyframes.map((k) => ({
      time: k.time,
      value: k.value,
      ...(k.ease !== undefined ? { ease: k.ease } : {}),
    })),
  }));
  if (data.name) timeline.name = data.name;
  timeline.time = 0;
  timeline.playing = false;
  return timeline;
}
