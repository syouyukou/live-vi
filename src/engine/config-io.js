import { defaultParams } from "./params.js";
import { ensureGradientStops } from "./gradient-map.js";

export function exportConfig(params, timeline, appFlow) {
  return JSON.stringify(
    {
      version: 1,
      params: { ...params },
      timeline: {
        name: timeline.name,
        duration: timeline.duration,
        params: timeline.params,
      },
      appFlow: { index: appFlow.index, scenes: appFlow.scenes },
    },
    null,
    2,
  );
}

/**
 * @param {string} json
 * @param {import("./params.js").ViParams} params
 */
/** @param {import("./params.js").ViParams} params */
function applyKnownParams(source, params) {
  const known = defaultParams();
  for (const key of Object.keys(source)) {
    if (key in known) params[key] = source[key];
  }
  params.elementGradientStops = ensureGradientStops(
    params.elementGradientStops,
    params.fillColor,
    params.gradientColorEnd,
  );
}

export function importConfig(json, params, timeline, appFlow) {
  const data = JSON.parse(json);
  if (data.params) applyKnownParams(data.params, params);
  if (data.timeline) {
    timeline.duration = data.timeline.duration ?? timeline.duration;
    timeline.params = data.timeline.params ?? timeline.params;
    if (data.timeline.name) timeline.name = data.timeline.name;
  }
  if (data.appFlow) {
    appFlow.index = data.appFlow.index ?? 0;
    if (data.appFlow.scenes) appFlow.scenes = data.appFlow.scenes;
  }
  return data;
}
