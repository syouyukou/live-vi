import { defaultGradientStops } from "./gradient-map.js";

/** @typedef {ReturnType<typeof defaultParams>} ViParams */

export function defaultParams() {
  return {
    playing: true,
    speed: 1,
    seed: 42,

    elementAngleDeg: 149.7,
    baseScaleLength: 10,
    baseScaleWidth: 5.75,
    pitch: 0.03021,
    /** 沿路徑實例上限；null 表示不限制（調整 Pitch 後會解除） */
    pathInstanceLimit: 1,
    elementLineWidth: 1.5,
    /** @type {"separate" | "merged"} */
    elementOverlapMode: "separate",

    elementCopyEnabled: false,
    elementCopyCount: 1,
    elementCopyOffsetX: 0,
    elementCopyOffsetY: 0,
    elementCopyDistance: 0,
    elementCopyOffsetAngle: 0,
    elementCopyRotateStep: 0,
    elementCopyScaleStep: 100,
    sharedScaleDirectionX: 1,
    sharedScaleDirectionY: 1,
    sensorTypeIndex: 0,

    shapeModifyFactor: 0,
    shapeRotateFactor: 0.36,
    cameraZoomValue: 1.52,
    shapePosX: -0.05,
    shapePosY: -0.04,
    svgPresetIndex: 0,
    /** @type {number | null} */
    elementPresetIndex: 0,
    hasCustomUnit: false,

    randomnessMultiply: 3.6,
    randomnessSensitivityLength: 1,
    randomnessSensitivityWidth: 1,

    mouseEnabled: true,
    mouseFollowDirection: true,
    mouseDirectionInfluence: 0.85,
    scalingByMouseSensitivityLength: 10,
    scalingByMouseSensitivityWidth: 0,
    mouseRadius: 180,

    handEnabled: false,
    handFollowPointer: true,
    handPosX: 0,
    handPosY: 0,
    handInfluence: 1.2,
    handRadius: 160,

    colorModeIndex: 0,
    strokeColor: "#111111",
    fillColor: "#87CEEB",
    gradientColorEnd: "#3366ff",
    elementGradientStops: defaultGradientStops(),
    elementUseGradient: false,
    outlineColor: "#5eb0ff",
    outlineScale: 1.14,
    bgColor: "#ffffff",
    micSensitivity: 0.1,
    soundEnabled: false,

    enableSecondLayer: false,
    secondLayerOpacity: 0.55,
    secondLayerPhase: 0.5,
    secondPresetIndex: 1,

    echoLayers: 0,
    echoStep: 3,
    echoOpacity: 0.3,

    canvasWidth: 540,
    canvasHeight: 540,
    /** @type {"16:9" | "9:16" | "1:1" | null} */
    canvasAspectPreset: "1:1",
  };
}

