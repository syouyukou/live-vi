import { defaultParams } from "../engine/params.js";
import { SVG_PRESETS } from "../engine/presets.js";
import { ensureGradientStops, syncLegacyFillFromStops } from "../engine/gradient-map.js";
import { bindColorPair, bindSliderPair } from "./bind-controls.js";
import { initGradientMapEditor } from "./gradient-map-editor.js";

/** @param {import("../engine/params.js").ViParams} params */
export function initDesignPanel(params, hooks) {
  const shapeSelect = document.getElementById("shape-preset");
  if (shapeSelect) {
    shapeSelect.innerHTML = SVG_PRESETS.map(
      (p, i) => `<option value="${i}">${p.name}</option>`,
    ).join("");
    shapeSelect.addEventListener("change", (e) => {
      hooks.onPresetChange(Number(e.target.value));
    });
  }

  const pathFile = document.getElementById("shape-svg-file");
  const importBtn = document.getElementById("shape-import");
  if (importBtn && pathFile) {
    importBtn.addEventListener("click", () => pathFile.click());
    pathFile.addEventListener("change", async () => {
      const file = pathFile.files?.[0];
      if (!file) return;
      hooks.onPathSvg(await file.text());
      pathFile.value = "";
    });
  }

  const elementFile = document.getElementById("element-svg-file");
  if (elementFile) {
    elementFile.addEventListener("change", async () => {
      const file = elementFile.files?.[0];
      if (!file) return;
      await hooks.onUnitSvg(await file.text(), file.name);
      elementFile.value = "";
    });
  }

  const gradientToggle = document.getElementById("el-gradient");
  const gradientMapWrap = document.getElementById("el-gradient-map-wrap");
  const fillRow = document.getElementById("el-fill-row");

  const syncGradientUi = () => {
    if (gradientToggle) gradientToggle.checked = params.elementUseGradient;
    gradientMapWrap?.classList.toggle("hidden", !params.elementUseGradient);
    fillRow?.classList.toggle("hidden", params.elementUseGradient);
  };

  const gradientEditor = initGradientMapEditor(
    document.getElementById("el-gradient-map-root"),
    {
      getStops: () => params.elementGradientStops,
      setStops: (stops) => {
        params.elementGradientStops = stops;
      },
      getFillColor: () => params.fillColor,
      getGradientEnd: () => params.gradientColorEnd,
    },
    (legacy) => {
      params.fillColor = legacy.fillColor;
      params.gradientColorEnd = legacy.gradientColorEnd;
      hooks.onColorChange?.();
    },
  );

  gradientToggle?.addEventListener("change", (e) => {
    params.elementUseGradient = e.target.checked;
    if (params.elementUseGradient) {
      params.elementGradientStops = ensureGradientStops(
        params.elementGradientStops,
        params.fillColor,
        params.gradientColorEnd,
      );
      const legacy = syncLegacyFillFromStops(params.elementGradientStops);
      params.fillColor = legacy.fillColor;
      params.gradientColorEnd = legacy.gradientColorEnd;
    }
    syncGradientUi();
    gradientEditor.syncFromParams();
    hooks.onColorChange?.();
  });

  const colorBindings = [
    bindColorPair(
      "el-fill",
      {
        get: () => params.fillColor,
        set: (hex) => {
          params.fillColor = hex;
          if (!params.elementUseGradient && params.elementGradientStops?.[0]) {
            params.elementGradientStops[0].color = hex;
          }
        },
      },
      hooks.onColorChange,
    ),
    bindColorPair(
      "el-outline",
      {
        get: () => params.outlineColor,
        set: (hex) => {
          params.outlineColor = hex;
        },
      },
      hooks.onColorChange,
    ),
  ].filter(Boolean);

  document.getElementById("el-color-swap")?.addEventListener("click", () => {
    const fill = params.fillColor;
    params.fillColor = params.outlineColor;
    params.outlineColor = fill;
    if (!params.elementUseGradient && params.elementGradientStops?.[0]) {
      params.elementGradientStops[0].color = params.fillColor;
    }
    for (const b of colorBindings) b?.syncFromParams();
    hooks.onColorChange?.();
  });

  const bindings = [
    bindSliderPair("shape-size", {
      get: () => params.cameraZoomValue,
      set: (n) => {
        params.cameraZoomValue = n;
      },
      toDisplay: (n) => n * 10,
      fromDisplay: (d) => d / 10,
    }),
    bindSliderPair(
      "shape-modify",
      {
        get: () => params.shapeModifyFactor,
        set: (n) => {
          params.shapeModifyFactor = n;
        },
      },
      hooks.onStructureChange,
    ),
    bindSliderPair(
      "shape-rotate",
      {
        get: () => params.shapeRotateFactor,
        set: (n) => {
          params.shapeRotateFactor = n;
        },
      },
      hooks.onStructureChange,
    ),
    bindSliderPair(
      "shape-pos-x",
      {
        get: () => params.shapePosX,
        set: (n) => {
          params.shapePosX = n;
        },
      },
      hooks.onStructureChange,
    ),
    bindSliderPair(
      "shape-pos-y",
      {
        get: () => params.shapePosY,
        set: (n) => {
          params.shapePosY = n;
        },
      },
      hooks.onStructureChange,
    ),
    bindSliderPair(
      "el-angle",
      {
        get: () => params.elementAngleDeg,
        set: (n) => {
          params.elementAngleDeg = n;
        },
      },
      hooks.onStructureChange,
    ),
    bindSliderPair(
      "el-length",
      {
        get: () => params.baseScaleLength,
        set: (n) => {
          params.baseScaleLength = n;
        },
      },
      hooks.onStructureChange,
    ),
    bindSliderPair(
      "el-width",
      {
        get: () => params.baseScaleWidth,
        set: (n) => {
          params.baseScaleWidth = n;
        },
      },
      hooks.onStructureChange,
    ),
    bindSliderPair(
      "el-pitch",
      {
        get: () => params.pitch,
        set: (n) => {
          params.pitch = n;
          params.pathInstanceLimit = null;
        },
        toDisplay: (n) => n * 1000,
        fromDisplay: (d) => d / 1000,
      },
      hooks.onStructureChange,
    ),
    bindSliderPair(
      "rand-sensitivity",
      {
        get: () => params.randomnessMultiply,
        set: (n) => {
          params.randomnessMultiply = n;
        },
      },
      hooks.onStructureChange,
    ),
  ].filter(Boolean);

  document.getElementById("re-random")?.addEventListener("click", () => {
    params.seed = Math.floor(Math.random() * 999999);
    hooks.onStructureChange();
  });

  const overlapBtns = document.querySelectorAll("[data-el-overlap]");
  const syncOverlapUi = () => {
    for (const btn of overlapBtns) {
      const mode = btn.getAttribute("data-el-overlap");
      btn.classList.toggle("is-active", mode === params.elementOverlapMode);
    }
  };
  for (const btn of overlapBtns) {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-el-overlap");
      if (mode !== "separate" && mode !== "merged") return;
      params.elementOverlapMode = mode;
      syncOverlapUi();
      hooks.onStructureChange();
    });
  }

  const copyEnabled = document.getElementById("el-copy-enabled");
  const copyFields = document.getElementById("el-copy-fields");
  const copyInputs = {
    count: document.getElementById("el-copy-count"),
    offsetX: document.getElementById("el-copy-offset-x"),
    offsetY: document.getElementById("el-copy-offset-y"),
    distance: document.getElementById("el-copy-distance"),
    offsetAngle: document.getElementById("el-copy-offset-angle"),
    rotate: document.getElementById("el-copy-rotate"),
    scale: document.getElementById("el-copy-scale"),
  };

  const syncCopyUi = () => {
    if (copyEnabled) copyEnabled.checked = params.elementCopyEnabled;
    copyFields?.classList.toggle("is-disabled", !params.elementCopyEnabled);
    if (copyInputs.count) copyInputs.count.value = String(params.elementCopyCount);
    if (copyInputs.offsetX) copyInputs.offsetX.value = String(params.elementCopyOffsetX);
    if (copyInputs.offsetY) copyInputs.offsetY.value = String(params.elementCopyOffsetY);
    if (copyInputs.distance) copyInputs.distance.value = String(params.elementCopyDistance);
    if (copyInputs.offsetAngle) copyInputs.offsetAngle.value = String(params.elementCopyOffsetAngle);
    if (copyInputs.rotate) copyInputs.rotate.value = String(params.elementCopyRotateStep);
    if (copyInputs.scale) copyInputs.scale.value = String(params.elementCopyScaleStep);
  };

  const applyCopyFromInputs = () => {
    if (copyInputs.count) {
      params.elementCopyCount = Math.min(24, Math.max(1, Math.floor(Number(copyInputs.count.value) || 1)));
    }
    if (copyInputs.offsetX) params.elementCopyOffsetX = Number(copyInputs.offsetX.value) || 0;
    if (copyInputs.offsetY) params.elementCopyOffsetY = Number(copyInputs.offsetY.value) || 0;
    if (copyInputs.distance) params.elementCopyDistance = Math.max(0, Number(copyInputs.distance.value) || 0);
    if (copyInputs.offsetAngle) params.elementCopyOffsetAngle = Number(copyInputs.offsetAngle.value) || 0;
    if (copyInputs.rotate) params.elementCopyRotateStep = Number(copyInputs.rotate.value) || 0;
    if (copyInputs.scale) {
      params.elementCopyScaleStep = Math.min(200, Math.max(10, Number(copyInputs.scale.value) || 100));
    }
    syncCopyUi();
    hooks.onStructureChange();
  };

  copyEnabled?.addEventListener("change", (e) => {
    params.elementCopyEnabled = e.target.checked;
    syncCopyUi();
    hooks.onStructureChange();
  });

  for (const input of Object.values(copyInputs)) {
    input?.addEventListener("change", applyCopyFromInputs);
    input?.addEventListener("input", applyCopyFromInputs);
  }

  document.getElementById("el-copy-reset")?.addEventListener("click", () => {
    const d = defaultParams();
    params.elementCopyCount = d.elementCopyCount;
    params.elementCopyOffsetX = d.elementCopyOffsetX;
    params.elementCopyOffsetY = d.elementCopyOffsetY;
    params.elementCopyDistance = d.elementCopyDistance;
    params.elementCopyOffsetAngle = d.elementCopyOffsetAngle;
    params.elementCopyRotateStep = d.elementCopyRotateStep;
    params.elementCopyScaleStep = d.elementCopyScaleStep;
    syncCopyUi();
    hooks.onStructureChange();
  });

  return {
    syncFromParams() {
      params.elementGradientStops = ensureGradientStops(
        params.elementGradientStops,
        params.fillColor,
        params.gradientColorEnd,
      );
      if (shapeSelect) shapeSelect.value = String(params.svgPresetIndex);
      for (const b of bindings) b?.syncFromParams();
      for (const b of colorBindings) b?.syncFromParams();
      syncGradientUi();
      syncOverlapUi();
      syncCopyUi();
      gradientEditor.syncFromParams();
    },
  };
}
