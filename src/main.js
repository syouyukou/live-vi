import { defaultParams } from "./engine/params.js";
import { SVG_PRESETS, getElementPresets, isNoPathPreset } from "./engine/presets.js";
import { parsePathSvg } from "./engine/path.js";
import { parseUnitSvg, ViRenderer } from "./engine/renderer.js";
import { createAppFlow } from "./engine/app-flow.js";
import { createDefaultTimeline } from "./engine/timeline.js";
import { initDesignPanel } from "./ui/design-panel.js";
import { applyCanvasLayout } from "./ui/canvas-layout.js";
import { formatLabel, initUiLang, UI_STRINGS } from "./ui/i18n.js";
import { initSettingPanel } from "./ui/setting-panel.js";
import { bindSliderPair } from "./ui/bind-controls.js";
import { initSidebarResize } from "./ui/sidebar-resize.js";
import { createUnitAssetLibrary } from "./lib/asset-library-idb.js";
import { initElementImportPopover } from "./ui/element-import-popover.js";
import { importConfig } from "./engine/config-io.js";
import defaultConfig from "./config/default-config.json";

const canvasHost = document.getElementById("canvas-host");
if (!canvasHost) {
  document.body.innerHTML =
    "<p style=\"padding:2rem;font-family:system-ui,sans-serif\">無法啟動：找不到畫布容器。請在 <code>live-vi</code> 資料夾執行 <code>npm run dev</code>，不要直接雙擊開啟 HTML 檔案。</p>";
  throw new Error("Missing #canvas-host — run via Vite dev server (npm run dev)");
}

const params = defaultParams();
const vi = new ViRenderer(canvasHost);
vi.setParams(params);

params.handEnabled = false;
params.mouseEnabled = true;

const emptyState = document.getElementById("empty-state");
const panelDesign = document.getElementById("panel-design");
const panelSetting = document.getElementById("panel-setting");
const panelSelect = document.getElementById("panel-select");
const panelSwitch = document.querySelector(".composer-panel-switch");
const timeline = createDefaultTimeline();
const appFlow = createAppFlow();

const defaults = () => structuredClone(defaultParams());

/** @type {const} */
const SENSOR_TYPES = ["mouse", "none"];

/** @param {number} index */
function applySensorType(index) {
  const idx = Math.max(0, Math.min(SENSOR_TYPES.length - 1, index));
  params.sensorTypeIndex = idx;
  params.mouseEnabled = idx === 0;
  document.getElementById("section-mouse")?.classList.toggle("hidden", idx !== 0);
  if (idx !== 0) vi.mouse.active = false;
  vi.markStructureDirty();
}

function syncSensorUi() {
  const idx = params.sensorTypeIndex ?? 0;
  params.mouseEnabled = idx === 0;
  const sensorSelect = document.getElementById("sensor-type");
  if (sensorSelect) sensorSelect.value = SENSOR_TYPES[idx] ?? "mouse";
  document.getElementById("section-mouse")?.classList.toggle("hidden", idx !== 0);
}

function updateReadyUi() {
  emptyState?.classList.toggle("hidden", vi.isReady());
}

const elementPresets = getElementPresets();

function syncElementPresetIndexFromSvgPreset(svgPresetIndex) {
  const match = elementPresets.findIndex((entry) => entry.svgPresetIndex === svgPresetIndex);
  params.elementPresetIndex = match >= 0 ? match : null;
}

function applyPresetIndex(index) {
  const preset = SVG_PRESETS[index];
  if (!preset) return;
  params.svgPresetIndex = index;
  if (isNoPathPreset(preset)) {
    vi.setPaths([]);
    params.pathInstanceLimit = 1;
  } else {
    vi.setPaths(parsePathSvg(preset.path));
    params.pathInstanceLimit = null;
  }
  if (!params.hasCustomUnit) {
    vi.setUnit(parseUnitSvg(preset.unit, { outlineScale: params.outlineScale }));
    syncElementPresetIndexFromSvgPreset(index);
  }
  updateReadyUi();
  vi.markStructureDirty();
  seedMouseCenter();
}

/**
 * @param {number} elementPresetIndex
 */
function applyElementPreset(elementPresetIndex) {
  const entry = elementPresets[elementPresetIndex];
  if (!entry) return;
  const { preset, svgPresetIndex } = entry;
  const unit = parseUnitSvg(preset.unit, { outlineScale: params.outlineScale });
  if (!unit) return;

  params.elementPresetIndex = elementPresetIndex;
  vi.setUnit(unit);

  if (isNoPathPreset(SVG_PRESETS[params.svgPresetIndex])) {
    params.svgPresetIndex = svgPresetIndex;
    params.hasCustomUnit = false;
    document.getElementById("element-import-name")?.classList.add("hidden");
  } else {
    params.hasCustomUnit = true;
    document.getElementById("element-import-name")?.classList.add("hidden");
  }

  updateReadyUi();
  vi.markStructureDirty();
  syncUiFromParams();
}

/**
 * @param {number} elementBPresetIndex
 */
function applyElementBPreset(elementBPresetIndex) {
  const entry = elementPresets[elementBPresetIndex];
  if (!entry) return;
  const unit = parseUnitSvg(entry.preset.unit, { outlineScale: params.outlineScale });
  if (!unit) return;

  params.elementBPresetIndex = elementBPresetIndex;
  params.elementBHasCustomUnit = false;
  vi.setUnitB(unit);
  updateReadyUi();
  vi.markStructureDirty();
  syncUiFromParams();
}

function ensureElementBLoaded() {
  if (!params.elementBEnabled) return;
  if (vi.unitShapeB) return;
  const index = params.elementBPresetIndex ?? 3;
  applyElementBPreset(Math.max(0, Math.min(elementPresets.length - 1, index)));
}

/** 啟動／重設：只顯示置中的單位元素，不沿路徑排列 */
function loadInitialView() {
  params.hasCustomUnit = false;
  const index = Math.max(0, Math.min(SVG_PRESETS.length - 1, params.svgPresetIndex ?? 0));
  if (isNoPathPreset(SVG_PRESETS[index])) {
    applyPresetIndex(index);
    return;
  }
  params.svgPresetIndex = index;
  const preset = SVG_PRESETS[index];
  if (!preset) return;
  const unit = parseUnitSvg(preset.unit, { outlineScale: params.outlineScale });
  if (!unit) return;
  vi.setUnit(unit);
  vi.setPaths([]);
  params.pathInstanceLimit = 1;
  syncElementPresetIndexFromSvgPreset(index);
  updateReadyUi();
  vi.markStructureDirty();
  seedMouseCenter();
}

let uiLang = /** @type {import("./ui/i18n.js").UiLang} */ ("both");
const unitAssetLibrary = createUnitAssetLibrary();

/**
 * @param {string} text
 * @param {string} displayName
 * @returns {boolean}
 */
function applyUnitSvg(text, displayName) {
  const unit = parseUnitSvg(text, { outlineScale: params.outlineScale });
  if (!unit) {
    const entry = UI_STRINGS["error.invalidElementSvg"];
    window.alert(formatLabel(entry, uiLang));
    return false;
  }
  params.hasCustomUnit = true;
  params.elementPresetIndex = null;
  const tinted = parseUnitSvg(text, { useSvgColors: true, outlineScale: params.outlineScale });
  if (tinted?.fillColor) params.fillColor = tinted.fillColor;
  if (tinted?.outlineColor) params.outlineColor = tinted.outlineColor;
  vi.setUnit(unit);
  updateReadyUi();
  vi.markStructureDirty();
  syncUiFromParams();
  const hint = document.getElementById("element-import-name");
  if (hint) {
    hint.textContent = displayName;
    hint.classList.remove("hidden");
  }
  return true;
}

/** @param {string} text @param {string} displayName */
async function saveUnitAsset(text, displayName) {
  const tinted = parseUnitSvg(text, { useSvgColors: true, outlineScale: params.outlineScale });
  try {
    await unitAssetLibrary.save({
      displayName,
      svgText: text,
      meta: {
        parseOk: true,
        fillColor: tinted?.fillColor,
        outlineColor: tinted?.outlineColor,
      },
    });
  } catch (err) {
    console.error("[unitAssetLibrary]", err);
  }
}

const designPanel = initDesignPanel(params, {
  hasActivePath: () => vi.pathGroups.length > 0,
  onPresetChange: applyPresetIndex,
  onElementPresetChange: applyElementPreset,
  onElementBPresetChange: applyElementBPreset,
  onElementBEnabledChange: (enabled) => {
    if (enabled) ensureElementBLoaded();
    else {
      vi.setUnitB(null);
      vi.markStructureDirty();
    }
  },
  onPathSvg: (text) => {
    params.pathInstanceLimit = null;
    vi.setPaths(parsePathSvg(text));
    updateReadyUi();
    vi.markStructureDirty();
    seedMouseCenter();
  },
  onUnitSvg: async (text, name) => {
    const ok = applyUnitSvg(text, name);
    if (ok) await saveUnitAsset(text, name);
    return ok;
  },
  onStructureChange: () => vi.markStructureDirty(),
  onColorChange: () => vi.updateColors(),
});

function applyConfigToScene() {
  syncUiFromParams();
  applySensorType(params.sensorTypeIndex ?? 0);
  applyPresetIndex(params.svgPresetIndex);
  if (params.elementBEnabled) ensureElementBLoaded();
  else vi.setUnitB(null);
  applyCanvasLayout(params);
  updateReadyUi();
  seedMouseCenter();
  vi.markStructureDirty();
}

function loadDefaultConfig() {
  const fresh = defaults();
  Object.assign(params, fresh);
  importConfig(JSON.stringify(defaultConfig), params, timeline, appFlow);
  params.handEnabled = false;
  document.getElementById("element-import-name")?.classList.add("hidden");
  applyConfigToScene();
}

const settingPanel = initSettingPanel(params, {
  timeline,
  appFlow,
  onConfigImported: applyConfigToScene,
  onCanvasChange: () => vi.resize(),
});

const mouseDirectionControl = bindSliderPair(
  "mouse-direction",
  {
    get: () => params.mouseDirectionInfluence,
    set: (n) => {
      params.mouseDirectionInfluence = n;
    },
  },
  () => vi.markStructureDirty(),
);

const mouseSpeedStretchControl = bindSliderPair(
  "mouse-speed-stretch",
  {
    get: () => params.mouseSpeedStretch,
    set: (n) => {
      params.mouseSpeedStretch = n;
    },
  },
  () => vi.markStructureDirty(),
);

const mouseSpeedScaleControl = bindSliderPair(
  "mouse-speed-scale",
  {
    get: () => params.mouseSpeedScale,
    set: (n) => {
      params.mouseSpeedScale = n;
    },
  },
  () => vi.markStructureDirty(),
);

const mouseTrailStretchControl = bindSliderPair(
  "mouse-trail-stretch",
  {
    get: () => params.mouseTrailStretch,
    set: (n) => {
      params.mouseTrailStretch = n;
    },
  },
  () => vi.markStructureDirty(),
);

const mouseSmoothingControl = bindSliderPair(
  "mouse-smoothing",
  {
    get: () => params.mouseSmoothing,
    set: (n) => {
      params.mouseSmoothing = n;
    },
  },
);

const mouseSpeedAnimControl = bindSliderPair(
  "mouse-speed-anim",
  {
    get: () => params.mouseSpeedAnim,
    set: (n) => {
      params.mouseSpeedAnim = n;
    },
  },
);

function syncUiFromParams() {
  designPanel.syncFromParams();
  settingPanel.syncFromParams();
  syncSensorUi();
  const mouseMode = document.getElementById("mouse-direction-mode");
  if (mouseMode) mouseMode.value = params.mouseDirectionMode ?? "blend";
  const mouseFollow = document.getElementById("mouse-follow-direction");
  if (mouseFollow) mouseFollow.checked = params.mouseFollowDirection;
  mouseDirectionControl?.syncFromParams();
  mouseSpeedStretchControl?.syncFromParams();
  mouseSpeedScaleControl?.syncFromParams();
  mouseTrailStretchControl?.syncFromParams();
  mouseSmoothingControl?.syncFromParams();
  mouseSpeedAnimControl?.syncFromParams();
  const mouseLen = document.getElementById("mouse-length");
  const mouseWid = document.getElementById("mouse-width");
  if (mouseLen) mouseLen.value = params.scalingByMouseSensitivityLength.toFixed(2);
  if (mouseWid) mouseWid.value = params.scalingByMouseSensitivityWidth.toFixed(2);
}

function resetAll() {
  loadDefaultConfig();
}

function seedMouseCenter() {
  if (params.pathInstanceLimit === 1) {
    vi.mouse.active = false;
    vi.mouse.world.set(0, 0, 0);
    vi.mouse.target.set(0, 0, 0);
    vi.mouse.directionValid = false;
    vi.mouse.speed = 0;
    vi.mouse.smoothedSpeed = 0;
    return;
  }
  const b = vi.getCameraBounds?.();
  if (!b) return;
  const x = b.left + (b.right - b.left) * 0.28;
  const y = b.bottom + (b.top - b.bottom) * 0.55;
  vi.mouse.active = true;
  vi.mouse.world.set(x, y, 0);
  vi.mouse.target.set(x, y, 0);
  vi.mouse.directionValid = false;
  vi.mouse.speed = 0;
  vi.mouse.smoothedSpeed = 0;
}

function showPanel(name) {
  const isDesign = name === "design";
  panelDesign.classList.toggle("hidden", !isDesign);
  panelDesign.hidden = !isDesign;
  panelSetting.classList.toggle("hidden", isDesign);
  panelSetting.hidden = isDesign;
  panelSwitch?.classList.toggle("is-setting", !isDesign);
}

panelSelect?.addEventListener("change", () => {
  showPanel(panelSelect.value);
});

document.getElementById("sensor-type")?.addEventListener("change", (e) => {
  const index = SENSOR_TYPES.indexOf(/** @type {string} */ (e.target.value));
  if (index >= 0) applySensorType(index);
});

document.getElementById("mouse-direction-mode")?.addEventListener("change", (e) => {
  params.mouseDirectionMode = /** @type {import("./engine/params.js").ViParams["mouseDirectionMode"]} */ (
    e.target.value
  );
  vi.markStructureDirty();
});

document.getElementById("mouse-follow-direction")?.addEventListener("change", (e) => {
  params.mouseFollowDirection = e.target.checked;
  vi.markStructureDirty();
});

document.getElementById("mouse-length")?.addEventListener("input", (e) => {
  params.scalingByMouseSensitivityLength = Number(e.target.value);
  vi.markStructureDirty();
});

document.getElementById("mouse-width")?.addEventListener("input", (e) => {
  params.scalingByMouseSensitivityWidth = Number(e.target.value);
  vi.markStructureDirty();
});

document.getElementById("reset")?.addEventListener("click", resetAll);

document.getElementById("timeline-editor")?.addEventListener("click", () => {
  window.alert("Timeline Editor is locked in Ver. 0.1.3.");
});

const elementImportPopover = initElementImportPopover({
  anchor: /** @type {HTMLElement} */ (document.getElementById("element-import")),
  fileInput: /** @type {HTMLInputElement} */ (document.getElementById("element-svg-file")),
  library: unitAssetLibrary,
  onApply: (text, name) => applyUnitSvg(text, name),
  getLang: () => uiLang,
});

initUiLang(document.getElementById("lang-toggle"), (lang) => {
  uiLang = lang;
  elementImportPopover.refreshI18n();
  designPanel.refreshShapePresetLabels(lang);
  designPanel.refreshElementPresetLabels(lang);
  designPanel.refreshElementBPresetLabels(lang);
});

initSidebarResize(document.querySelector(".composer-sidebar-resize"));

const canvas = vi.getCanvas();
canvas.addEventListener("pointermove", (e) => {
  vi.mouse.active = true;
  vi.mouse.target.copy(vi.clientToWorld(e.clientX, e.clientY));
});
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  vi.mouse.active = true;
  vi.mouse.target.copy(vi.clientToWorld(e.clientX, e.clientY));
});
canvas.addEventListener("pointerleave", () => {
  vi.mouse.active = false;
  vi.mouse.speed = 0;
  vi.mouse.smoothedSpeed = 0;
  vi.mouse.directionValid = false;
});

window.addEventListener("resize", () => {
  applyCanvasLayout(params);
  vi.resize();
});

let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  vi.tick(dt);
  vi.render();
  requestAnimationFrame(loop);
}

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  params.playing = false;
}

showPanel(panelSelect?.value ?? "design");
loadDefaultConfig();
vi.resize();
vi.render();
requestAnimationFrame(loop);

if (import.meta.env.DEV && new URLSearchParams(location.search).has("testCurve")) {
  fetch("/test-fixtures/curve-2x.svg")
    .then((r) => r.text())
    .then((text) => {
      const unit = parseUnitSvg(text);
      if (unit) {
        params.hasCustomUnit = true;
        vi.setUnit(unit);
        const hint = document.getElementById("element-import-name");
        if (hint) {
          hint.textContent = "curve-2x.svg (test)";
          hint.classList.remove("hidden");
        }
        vi.markStructureDirty();
        vi.render();
        console.info("[testCurve] loaded test-fixtures/curve-2x.svg");
      }
    })
    .catch((err) => console.error("[testCurve]", err));
}
