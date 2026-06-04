import { APP_FLOW_SCENES } from "./presets.js";
import { applyColorMode } from "./color-modes.js";

export function createAppFlow() {
  return {
    index: 0,
    scenes: APP_FLOW_SCENES.map((s) => ({ ...s })),
  };
}

/**
 * @param {ReturnType<createAppFlow>} flow
 * @param {import("./params.js").ViParams} params
 */
export function applyScene(flow, params) {
  const scene = flow.scenes[flow.index];
  if (!scene) return;
  if (scene.presetIndex !== undefined) params.svgPresetIndex = scene.presetIndex;
  if (scene.colorModeIndex !== undefined) {
    params.colorModeIndex = scene.colorModeIndex;
    applyColorMode(params.colorModeIndex, params);
  }
  if (scene.shapeModifyFactor !== undefined) params.shapeModifyFactor = scene.shapeModifyFactor;
  if (scene.pitch !== undefined) params.pitch = scene.pitch;
  if (scene.randomnessMultiply !== undefined) params.randomnessMultiply = scene.randomnessMultiply;
}

export function nextScene(flow) {
  flow.index = (flow.index + 1) % flow.scenes.length;
}

export function prevScene(flow) {
  flow.index = (flow.index - 1 + flow.scenes.length) % flow.scenes.length;
}
