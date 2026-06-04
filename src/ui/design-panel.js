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

  return {
    syncFromParams() {
      params.elementGradientStops = ensureGradientStops(
        params.elementGradientStops,
        params.fillColor,
        params.gradientColorEnd,
      );
      shapeSelect.value = String(params.svgPresetIndex);
      for (const b of bindings) b?.syncFromParams();
      for (const b of colorBindings) b?.syncFromParams();
      syncGradientUi();
      gradientEditor.syncFromParams();
    },
  };
}
