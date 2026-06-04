import { defaultParams } from "./engine/params.js";
import { SVG_PRESETS } from "./engine/presets.js";
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

const params = defaultParams();
const vi = new ViRenderer(document.getElementById("canvas-host"));
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

function updateReadyUi() {
  emptyState.classList.toggle("hidden", vi.isReady());
}

function applyPresetIndex(index) {
  const preset = SVG_PRESETS[index];
  if (!preset) return;
  params.svgPresetIndex = index;
  vi.setPaths(parsePathSvg(preset.path));
  if (!params.hasCustomUnit) {
    vi.setUnit(parseUnitSvg(preset.unit));
  }
  updateReadyUi();
  vi.markStructureDirty();
}

let uiLang = /** @type {import("./ui/i18n.js").UiLang} */ ("both");
const unitAssetLibrary = createUnitAssetLibrary();

/**
 * @param {string} text
 * @param {string} displayName
 * @returns {boolean}
 */
function applyUnitSvg(text, displayName) {
  const unit = parseUnitSvg(text);
  if (!unit) {
    const entry = UI_STRINGS["error.invalidElementSvg"];
    window.alert(formatLabel(entry, uiLang));
    return false;
  }
  params.hasCustomUnit = true;
  const tinted = parseUnitSvg(text, { useSvgColors: true });
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
  const tinted = parseUnitSvg(text, { useSvgColors: true });
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
  onPresetChange: applyPresetIndex,
  onPathSvg: (text) => {
    vi.setPaths(parsePathSvg(text));
    updateReadyUi();
    vi.markStructureDirty();
  },
  onUnitSvg: async (text, name) => {
    const ok = applyUnitSvg(text, name);
    if (ok) await saveUnitAsset(text, name);
    return ok;
  },
  onStructureChange: () => vi.markStructureDirty(),
  onColorChange: () => vi.updateColors(),
});

const settingPanel = initSettingPanel(params, {
  timeline,
  appFlow,
  onConfigImported: () => {
    syncUiFromParams();
    applyPresetIndex(params.svgPresetIndex);
    seedMouseCenter();
    vi.markStructureDirty();
  },
  onCanvasChange: () => vi.resize(),
});

const mouseDirectionControl = bindSliderPair("mouse-direction", {
  get: () => params.mouseDirectionInfluence,
  set: (n) => {
    params.mouseDirectionInfluence = n;
  },
  onChange: () => vi.markStructureDirty(),
});

function syncUiFromParams() {
  designPanel.syncFromParams();
  settingPanel.syncFromParams();
  document.getElementById("mouse-follow-direction").checked = params.mouseFollowDirection;
  mouseDirectionControl?.syncFromParams();
  document.getElementById("mouse-length").value = params.scalingByMouseSensitivityLength.toFixed(2);
  document.getElementById("mouse-width").value = params.scalingByMouseSensitivityWidth.toFixed(2);
}

function resetAll() {
  const fresh = defaults();
  Object.assign(params, fresh);
  params.handEnabled = false;
  params.mouseEnabled = true;
  document.getElementById("element-import-name")?.classList.add("hidden");
  params.hasCustomUnit = false;
  syncUiFromParams();
  applyPresetIndex(params.svgPresetIndex);
  seedMouseCenter();
}

function seedMouseCenter() {
  const b = vi.getCameraBounds?.();
  if (!b) return;
  const x = b.left + (b.right - b.left) * 0.28;
  const y = b.bottom + (b.top - b.bottom) * 0.55;
  vi.mouse.active = true;
  vi.mouse.world.set(x, y, 0);
  vi.mouse.target.set(x, y, 0);
  vi.mouse.directionValid = false;
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

document.getElementById("mouse-follow-direction")?.addEventListener("change", (e) => {
  params.mouseFollowDirection = e.target.checked;
  vi.markStructureDirty();
});

document.getElementById("mouse-length").addEventListener("input", (e) => {
  params.scalingByMouseSensitivityLength = Number(e.target.value);
  vi.markStructureDirty();
});

document.getElementById("mouse-width").addEventListener("input", (e) => {
  params.scalingByMouseSensitivityWidth = Number(e.target.value);
  vi.markStructureDirty();
});

document.getElementById("reset").addEventListener("click", resetAll);

document.getElementById("timeline-editor").addEventListener("click", () => {
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
applyPresetIndex(0);
syncUiFromParams();
vi.resize();
vi.render();
seedMouseCenter();
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
