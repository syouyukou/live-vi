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
    elementLineWidth: 1.5,
    sharedScaleDirectionX: 1,
    sharedScaleDirectionY: 1,
    sensorTypeIndex: 0,

    shapeModifyFactor: 0,
    shapeRotateFactor: 0.36,
    cameraZoomValue: 1.52,
    shapePosX: -0.05,
    shapePosY: -0.04,
    svgPresetIndex: 0,
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
    fillColor: "#ff3388",
    gradientColorEnd: "#3366ff",
    elementGradientStops: defaultGradientStops(),
    elementUseGradient: false,
    outlineColor: "#ffd700",
    outlineScale: 1.06,
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

