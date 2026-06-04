import { exportConfig, importConfig } from "../engine/config-io.js";
import { CANVAS_ASPECT_PRESETS, applyCanvasLayout } from "./canvas-layout.js";

/**
 * @param {import("../engine/params.js").ViParams} params
 * @param {{
 *   timeline: ReturnType<import("../engine/timeline.js").createDefaultTimeline>,
 *   appFlow: ReturnType<import("../engine/app-flow.js").createAppFlow>,
 *   onConfigImported: () => void,
 *   onCanvasChange: () => void,
 * }} ctx
 */
export function initSettingPanel(params, ctx) {
  const jsonFile = document.getElementById("config-json-file");
  const importBtn = document.getElementById("config-import");
  const exportBtn = document.getElementById("config-export");
  const widthInput = document.getElementById("canvas-width");
  const heightInput = document.getElementById("canvas-height");
  const presetBtns = document.querySelectorAll("[data-canvas-preset]");

  importBtn?.addEventListener("click", () => jsonFile?.click());

  jsonFile?.addEventListener("change", async () => {
    const file = jsonFile.files?.[0];
    if (!file) return;
    try {
      importConfig(await file.text(), params, ctx.timeline, ctx.appFlow);
      ctx.onConfigImported();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Invalid config file.");
    }
    jsonFile.value = "";
  });

  exportBtn?.addEventListener("click", () => {
    const blob = new Blob([exportConfig(params, ctx.timeline, ctx.appFlow)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vi-composer-config.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  function syncPresetUi() {
    presetBtns.forEach((btn) => {
      const id = btn.getAttribute("data-canvas-preset");
      btn.classList.toggle("is-active", id === params.canvasAspectPreset);
    });
  }

  function setCanvasSize(w, h, preset = null) {
    params.canvasWidth = Math.round(Math.max(64, Math.min(4096, w)));
    params.canvasHeight = Math.round(Math.max(64, Math.min(4096, h)));
    params.canvasAspectPreset = preset;
    if (widthInput) widthInput.value = String(params.canvasWidth);
    if (heightInput) heightInput.value = String(params.canvasHeight);
    syncPresetUi();
    applyCanvasLayout(params);
    ctx.onCanvasChange();
  }

  widthInput?.addEventListener("change", () => {
    setCanvasSize(Number(widthInput.value), params.canvasHeight, null);
  });

  heightInput?.addEventListener("change", () => {
    setCanvasSize(params.canvasWidth, Number(heightInput.value), null);
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-canvas-preset");
      const preset = key && CANVAS_ASPECT_PRESETS[key];
      if (!preset) return;
      setCanvasSize(preset.canvasWidth, preset.canvasHeight, key);
    });
  });

  return {
    syncFromParams() {
      if (widthInput) widthInput.value = String(params.canvasWidth);
      if (heightInput) heightInput.value = String(params.canvasHeight);
      syncPresetUi();
      applyCanvasLayout(params);
    },
  };
}
