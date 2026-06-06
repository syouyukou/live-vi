import { exportConfig, importConfig } from "../engine/config-io.js";
import { CanvasRecorder } from "../engine/recorder.js";
import { downloadBlob, downloadDataUrl, downloadText } from "../lib/download.js";
import { CANVAS_ASPECT_PRESETS, applyCanvasLayout } from "./canvas-layout.js";
import { UI_STRINGS, formatLabel } from "./i18n.js";

/** @param {keyof typeof UI_STRINGS} key */
function msg(key) {
  return formatLabel(UI_STRINGS[key], "both");
}

/**
 * @param {import("../engine/params.js").ViParams} params
 * @param {{
 *   timeline: ReturnType<import("../engine/timeline.js").createDefaultTimeline>,
 *   appFlow: ReturnType<import("../engine/app-flow.js").createAppFlow>,
 *   onConfigImported: () => void,
 *   onCanvasChange: () => void,
 *   exportPng: () => string | null,
 *   exportSvg: () => string | null,
 *   getCanvas: () => HTMLCanvasElement,
 * }} ctx
 */
export function initSettingPanel(params, ctx) {
  const jsonFile = document.getElementById("config-json-file");
  const importBtn = document.getElementById("config-import");
  const exportBtn = document.getElementById("config-export");
  const pngBtn = document.getElementById("export-png");
  const svgBtn = document.getElementById("export-svg");
  const recordStartBtn = document.getElementById("export-record-start");
  const recordStopBtn = document.getElementById("export-record-stop");
  const recordStatus = document.getElementById("record-status");
  const widthInput = document.getElementById("canvas-width");
  const heightInput = document.getElementById("canvas-height");
  const presetBtns = document.querySelectorAll("[data-canvas-preset]");

  /** @type {CanvasRecorder | null} */
  let recorder = null;

  function setRecordingUi(active) {
    recordStartBtn?.classList.toggle("hidden", active);
    if (recordStartBtn) recordStartBtn.hidden = active;
    recordStopBtn?.classList.toggle("hidden", !active);
    if (recordStopBtn) recordStopBtn.hidden = !active;
    recordStatus?.classList.toggle("hidden", !active);
    if (recordStatus) recordStatus.hidden = !active;
  }

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
    downloadBlob(blob, "vi-composer-config.json");
  });

  pngBtn?.addEventListener("click", () => {
    const dataUrl = ctx.exportPng();
    if (!dataUrl) {
      window.alert(msg("error.exportNotReady"));
      return;
    }
    downloadDataUrl(dataUrl, "vi-composer.png");
  });

  svgBtn?.addEventListener("click", () => {
    const svg = ctx.exportSvg();
    if (!svg) {
      window.alert(msg("error.exportNotReady"));
      return;
    }
    downloadText(svg, "vi-composer.svg", "image/svg+xml;charset=utf-8");
  });

  recordStartBtn?.addEventListener("click", () => {
    if (!CanvasRecorder.isSupported()) {
      window.alert(msg("error.recorderUnsupported"));
      return;
    }
    try {
      recorder = new CanvasRecorder(ctx.getCanvas());
      recorder.start();
      setRecordingUi(true);
    } catch (err) {
      recorder = null;
      window.alert(err instanceof Error ? err.message : msg("error.recorderUnsupported"));
    }
  });

  recordStopBtn?.addEventListener("click", async () => {
    if (!recorder) {
      setRecordingUi(false);
      return;
    }
    const blob = await recorder.stop();
    recorder = null;
    setRecordingUi(false);
    if (!blob) {
      window.alert(msg("error.recordEmpty"));
      return;
    }
    downloadBlob(blob, "vi-composer.webm");
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
