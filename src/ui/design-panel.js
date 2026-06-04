import { SVG_PRESETS } from "../engine/presets.js";
import { bindSliderPair } from "./bind-controls.js";

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
  const elementImportBtn = document.getElementById("element-import");
  const elementImportName = document.getElementById("element-import-name");
  if (elementImportBtn && elementFile) {
    elementImportBtn.addEventListener("click", () => elementFile.click());
    elementFile.addEventListener("change", async () => {
      const file = elementFile.files?.[0];
      if (!file) return;
      const ok = hooks.onUnitSvg(await file.text(), file.name);
      if (ok && elementImportName) {
        elementImportName.textContent = file.name;
        elementImportName.classList.remove("hidden");
      }
      elementFile.value = "";
    });
  }

  const bindings = [
    bindSliderPair(
      "shape-size",
      {
        get: () => params.cameraZoomValue,
        set: (n) => {
          params.cameraZoomValue = n;
        },
        toDisplay: (n) => n * 10,
        fromDisplay: (d) => d / 10,
      },
      hooks.onStructureChange,
    ),
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
      shapeSelect.value = String(params.svgPresetIndex);
      for (const b of bindings) b?.syncFromParams();
    },
  };
}
