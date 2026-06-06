/**
 * Headless smoke tests for live-vi engine & config modules.
 * Run: npm run test:smoke
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dom = new JSDOM("<!DOCTYPE html><html></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}${detail ? `: ${detail}` : ""}`);
  }
}

function assertThrows(name, fn) {
  try {
    fn();
    failed += 1;
    console.error(`  ✗ ${name}: expected throw`);
  } catch {
    passed += 1;
    console.log(`  ✓ ${name} (throws as expected)`);
  }
}

const { parseUnitSvg } = await import(join(root, "src/engine/unit.js"));
const { parsePathSvg } = await import(join(root, "src/engine/path.js"));
const { defaultParams } = await import(join(root, "src/engine/params.js"));
const { exportConfig, importConfig } = await import(join(root, "src/engine/config-io.js"));
const { createDefaultTimeline } = await import(join(root, "src/engine/timeline.js"));
const { createAppFlow } = await import(join(root, "src/engine/app-flow.js"));
const {
  ensureGradientStops,
  normalizeGradientStops,
  sampleGradientMap,
  gradientMapCss,
  applySegmentMidpoint,
  syncLegacyFillFromStops,
  defaultGradientStops,
  applyGradientVertexColors,
  clearGradientVertexColors,
} = await import(join(root, "src/engine/gradient-map.js"));
const { normalizeHexColor, lerpHexColor, applyColorMode } = await import(
  join(root, "src/engine/color-modes.js"),
);
const { instanceAngle, instanceScales, lerpAngle } = await import(
  join(root, "src/engine/instance-modifiers.js"),
);
const { validateTimeline, importTimelineJson } = await import(
  join(root, "src/engine/timeline-io.js"),
);
const { SVG_PRESETS } = await import(join(root, "src/engine/presets.js"));
const { formatLabel, nextUiLang, UI_STRINGS } = await import(join(root, "src/ui/i18n.js"));
const { hashSvgText } = await import(join(root, "src/lib/asset-library.js"));
const { samplePlacements } = await import(join(root, "src/engine/sampler.js"));
const { expandPlacementsWithCopies } = await import(join(root, "src/engine/placement-copy.js"));

console.log("\n=== SVG parse ===");
assert("parseUnitSvg rejects empty", parseUnitSvg("") === null);
assert("parseUnitSvg rejects garbage", parseUnitSvg("<html></html>") === null);
const curveSvg = readFileSync(join(root, "public/test-fixtures/curve-2x.svg"), "utf8");
const curveUnit = parseUnitSvg(curveSvg);
assert("parseUnitSvg loads curve fixture", curveUnit !== null && curveUnit.unitLength > 0);
assert("parseUnitSvg calligraphic has no outline geom", !curveUnit?.outlineGeometry);
assert(
  "parseUnitSvg filled preset has outline geom",
  parseUnitSvg(SVG_PRESETS[1].unit)?.outlineGeometry != null,
);
assert(
  "parseUnitSvg useSvgColors",
  parseUnitSvg(curveSvg, { useSvgColors: true })?.fillColor?.startsWith("#"),
);
const openLineWithFill = `<svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg" style="fill:#FFD700"><path d="M10,20 L190,20"/></svg>`;
const openLineUnit = parseUnitSvg(openLineWithFill);
assert("parseUnitSvg open path with inherited fill is calligraphic", openLineUnit?.isCalligraphic === true);
assert("parseUnitSvg open path with inherited fill has no outline", !openLineUnit?.outlineGeometry);

for (const preset of SVG_PRESETS) {
  const unit = parseUnitSvg(preset.unit);
  assert(`preset "${preset.name}" unit`, unit !== null);
  if (preset.noPath) {
    assert(`preset "${preset.name}" no path`, parsePathSvg(preset.path).length === 0);
  } else {
    const paths = parsePathSvg(preset.path);
    assert(`preset "${preset.name}" path`, paths.length > 0);
  }
}

const artboardPathSvg = `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="200" height="400" fill="none" stroke="#000"/>
  <path fill="none" stroke="#000" d="M120,20 C180,80 180,320 120,380"/>
</svg>`;
assert(
  "parsePathSvg drops artboard rect frame",
  parsePathSvg(artboardPathSvg).length === 1,
);
assert("parsePathSvg keeps open curve fixture", parsePathSvg(curveSvg).length === 1);

const kanjiSvg = readFileSync(join(root, "public/test-fixtures/kanji-li-6-2x.svg"), "utf8");
assert("parsePathSvg keeps compound path subpaths", parsePathSvg(kanjiSvg).length >= 6);
const liPreset = SVG_PRESETS.find((p) => p.name === "里");
assert("里 preset path parses", liPreset && parsePathSvg(liPreset.path).length >= 6);
const kanjiUnit = parseUnitSvg(kanjiSvg);
assert("parseUnitSvg loads compound kanji fixture", kanjiUnit !== null);
assert(
  "parseUnitSvg compound kanji has more fill verts than createShapes-only",
  kanjiUnit.geometry.attributes.position.count > 2000,
);

console.log("\n=== Config round-trip ===");
const params = defaultParams();
const timeline = createDefaultTimeline();
const appFlow = createAppFlow();
params.elementUseGradient = true;
const json = exportConfig(params, timeline, appFlow);
const params2 = defaultParams();
importConfig(json, params2, timeline, appFlow);
assert(
  "import preserves elementUseGradient",
  params2.elementUseGradient === true,
);
assert(
  "import normalizes gradient stops",
  Array.isArray(params2.elementGradientStops) && params2.elementGradientStops.length >= 2,
);
assertThrows("importConfig rejects invalid JSON", () =>
  importConfig("{not json", defaultParams(), createDefaultTimeline(), createAppFlow()),
);

console.log("\n=== Gradient map ===");
assert("ensureGradientStops from legacy", ensureGradientStops(undefined, "#aabbcc", "#112233").length === 2);
assert("normalize keeps endpoints", normalizeGradientStops([{ position: 0.5, color: "#000" }, { position: 0.5, color: "#fff" }]).length >= 2);
const mid = applySegmentMidpoint(0.5, 0.5);
assert("midpoint 0.5 is identity at 0.5", Math.abs(mid - 0.5) < 0.01);
const sampled = sampleGradientMap(0, [{ position: 0, color: "#ff0000", midpoint: 0.5 }, { position: 1, color: "#0000ff", midpoint: 0.5 }]);
assert("sampleGradientMap at 0 is red-ish", sampled.r > 0.9);
const css = gradientMapCss(ensureGradientStops());
assert("gradientMapCss returns linear-gradient", css.includes("linear-gradient"));
const legacy = syncLegacyFillFromStops(defaultGradientStops());
assert("syncLegacyFillFromStops endpoints", legacy.fillColor.startsWith("#") && legacy.gradientColorEnd.startsWith("#"));

const polyline = [
  { x: 0, y: 0, z: 0 },
  { x: 50, y: 0, z: 0 },
  { x: 50, y: 50, z: 0 },
  { x: 0, y: 50, z: 0 },
];
const placements = samplePlacements(polyline, 20, 0);
const ts = placements.map((p) => p.t);
assert("placement.t monotonic on polyline", ts.every((t, i) => i === 0 || t >= ts[i - 1] - 0.0001));
assert("placement.t starts near 0", ts[0] < 0.05);
assert("placement.t ends near 1", ts[ts.length - 1] > 0.85);
const c0 = sampleGradientMap(0, defaultGradientStops());
const c1 = sampleGradientMap(1, defaultGradientStops());
assert(
  "gradient endpoints differ",
  c0.getHexString() !== c1.getHexString(),
);

const { BufferGeometry, Float32BufferAttribute } = await import("three");
const triGeom = new BufferGeometry();
triGeom.setAttribute(
  "position",
  new Float32BufferAttribute([-1, -2, 0, 1, -2, 0, 0, 2, 0], 3),
);
applyGradientVertexColors(triGeom, defaultGradientStops());
assert("applyGradientVertexColors sets color attr", triGeom.attributes.color?.count === 3);
clearGradientVertexColors(triGeom);
assert("clearGradientVertexColors removes attr", !triGeom.attributes.color);

console.log("\n=== Element copy ===");
const copyParams = defaultParams();
copyParams.elementCopyEnabled = true;
copyParams.elementCopyCount = 2;
copyParams.elementCopyOffsetX = 5;
const basePlacements = samplePlacements(
  [
    { x: 0, y: 0, z: 0 },
    { x: 100, y: 0, z: 0 },
  ],
  40,
  0,
);
assert(
  "copy disabled keeps count",
  expandPlacementsWithCopies(basePlacements, defaultParams()).length === basePlacements.length,
);
const expanded = expandPlacementsWithCopies(basePlacements, copyParams);
assert("copy expands instances", expanded.length === basePlacements.length * 3);
assert("copy offsets x", Math.abs(expanded[1].x - (expanded[0].x + 5)) < 0.01);
const scaleParams = defaultParams();
scaleParams.elementCopyEnabled = true;
scaleParams.elementCopyCount = 1;
scaleParams.elementCopyScaleStep = 50;
const scaled = expandPlacementsWithCopies(basePlacements.slice(0, 1), scaleParams);
assert(
  "copy scale step on copy instance",
  scaled.length === 2 && Math.abs((scaled[1].copyScaleMul ?? 1) - 0.5) < 0.01,
);

console.log("\n=== Config round-trip (copy & overlap) ===");
const copyCfg = defaultParams();
copyCfg.elementCopyEnabled = true;
copyCfg.elementCopyCount = 2;
copyCfg.elementOverlapMode = "merged";
copyCfg.sensorTypeIndex = 1;
const jsonCopy = exportConfig(copyCfg, timeline, appFlow);
const copyCfg2 = defaultParams();
importConfig(jsonCopy, copyCfg2, timeline, appFlow);
assert("copy params round-trip", copyCfg2.elementCopyEnabled && copyCfg2.elementCopyCount === 2);
assert("overlap mode round-trip", copyCfg2.elementOverlapMode === "merged");
assert("sensor none round-trip", copyCfg2.sensorTypeIndex === 1);

console.log("\n=== Color & modifiers ===");
assert("normalizeHexColor accepts 6-digit", normalizeHexColor("aabbcc") === "#aabbcc");
assert("normalizeHexColor rejects short", normalizeHexColor("#abc") === null);
const lerped = lerpHexColor("#000000", "#ffffff", 0.5);
assert("lerpHexColor mid gray", lerped.r > 0.4 && lerped.r < 0.6);
applyColorMode(99, params);
assert("applyColorMode wraps palette", params.strokeColor.startsWith("#"));
const p = defaultParams();
const angle = instanceAngle(0, { x: 0, y: 0 }, p, { world: { x: 100, y: 0 }, active: true });
assert("instanceAngle with mouse", Number.isFinite(angle));
const scales = instanceScales({ x: 0, y: 0, t: 0.5, index: 3 }, p, { world: { x: 0, y: 0, z: 0 }, active: false });
assert("instanceScales positive", scales.scaleX > 0 && scales.scaleY > 0);
assert("lerpAngle wraps", Math.abs(lerpAngle(0, Math.PI * 1.9, 0.5)) < Math.PI * 2);

console.log("\n=== Timeline IO ===");
const bad = validateTimeline({ duration: -1, params: [] });
assert("validateTimeline rejects bad duration", !bad.ok);
const good = validateTimeline({
  duration: 10,
  params: [{ id: "zoom", keyframes: [{ time: 0, value: 1 }, { time: 5, value: 2 }] }],
});
assert("validateTimeline accepts good", good.ok);
const tl = createDefaultTimeline();
importTimelineJson(
  JSON.stringify({ duration: 8, params: [{ id: "test", keyframes: [{ time: 0, value: 0 }] }] }),
  tl,
);
assert("importTimelineJson sets duration", tl.duration === 8);

console.log("\n=== i18n ===");
assert("formatLabel both", formatLabel(UI_STRINGS["nav.design"], "both").includes("/"));
assert("formatLabel en", formatLabel(UI_STRINGS["nav.design"], "en") === "Design");
assert("nextUiLang cycles", nextUiLang("both") === "en");

console.log("\n=== Asset hash ===");
const h = await hashSvgText("<svg></svg>");
assert("hashSvgText 64 hex chars", h.length === 64);

console.log("\n=== Design panel DOM ===");
const indexHtml = readFileSync(join(root, "index.html"), "utf8");
const panelDom = new JSDOM(indexHtml, { url: "http://localhost/" });
const panelDoc = panelDom.window.document;
const panelIds = [
  "panel-design",
  "el-angle-slider",
  "el-angle-num",
  "el-length-slider",
  "el-length-num",
  "el-width-slider",
  "el-width-num",
  "el-pitch-slider",
  "el-pitch-num",
  "el-copy-enabled",
  "el-copy-fields",
  "el-copy-count",
  "el-copy-reset",
  "el-gradient",
  "el-gradient-map-root",
  "el-fill-color",
  "el-outline-color",
  "el-color-swap",
];
for (const id of panelIds) {
  assert(`index.html #${id}`, panelDoc.getElementById(id) != null);
}
assert("overlap buttons", panelDoc.querySelectorAll("[data-el-overlap]").length === 2);

console.log("\n=== Design panel bindings ===");
globalThis.window = panelDom.window;
globalThis.document = panelDom.window.document;
globalThis.HTMLElement = panelDom.window.HTMLElement;
globalThis.Event = panelDom.window.Event;
globalThis.Node = panelDom.window.Node;

const { initDesignPanel } = await import(join(root, "src/ui/design-panel.js"));
const panelParams = defaultParams();
let panelStructureChanges = 0;
let panelColorChanges = 0;
initDesignPanel(panelParams, {
  hasActivePath: () => false,
  onPresetChange: () => {},
  onElementPresetChange: () => {},
  onPathSvg: () => {},
  onUnitSvg: async () => true,
  onStructureChange: () => {
    panelStructureChanges += 1;
  },
  onColorChange: () => {
    panelColorChanges += 1;
  },
});

const fireInput = (el, value) => {
  el.value = value;
  el.dispatchEvent(new panelDom.window.Event("input", { bubbles: true }));
};
const fireChange = (el, value) => {
  el.value = value;
  el.dispatchEvent(new panelDom.window.Event("change", { bubbles: true }));
};

const angleSlider = panelDoc.getElementById("el-angle-slider");
fireInput(angleSlider, "200");
assert("angle slider → params", Math.abs(panelParams.elementAngleDeg - 200) < 0.1);
assert("angle slider triggers structure change", panelStructureChanges > 0);

panelDoc.querySelector('[data-el-overlap="merged"]')?.click();
assert("overlap merged", panelParams.elementOverlapMode === "merged");
assert(
  "overlap merged active class",
  panelDoc.querySelector('[data-el-overlap="merged"]')?.classList.contains("is-active"),
);

const copyCheck = panelDoc.getElementById("el-copy-enabled");
fireChange(copyCheck, true);
copyCheck.checked = true;
fireChange(copyCheck, true);
assert("copy checkbox enables params", panelParams.elementCopyEnabled === true);
assert(
  "copy fields lose is-disabled",
  !panelDoc.getElementById("el-copy-fields")?.classList.contains("is-disabled"),
);

const copyCount = panelDoc.getElementById("el-copy-count");
fireInput(copyCount, "5");
assert("copy count clamps to params", panelParams.elementCopyCount === 5);

panelParams.pathInstanceLimit = 1;
const pitchBefore = panelParams.pathInstanceLimit;
fireInput(panelDoc.getElementById("el-pitch-slider"), "40");
assert("pitch without path keeps preview limit", panelParams.pathInstanceLimit === pitchBefore);
assert("pitch updates value", Math.abs(panelParams.pitch - 0.04) < 0.0001);

const gradientToggle = panelDoc.getElementById("el-gradient");
gradientToggle.checked = true;
fireChange(gradientToggle, true);
assert("gradient toggle on", panelParams.elementUseGradient === true);
assert(
  "gradient map visible",
  !panelDoc.getElementById("el-gradient-map-wrap")?.classList.contains("hidden"),
);
assert("gradient toggle triggers color change", panelColorChanges > 0);

panelDoc.getElementById("el-color-swap")?.click();
const swappedFill = panelParams.fillColor;
const swappedOutline = panelParams.outlineColor;
assert("color swap exchanges values", swappedFill !== "#87CEEB" || swappedOutline !== "#5eb0ff");

console.log("\n=== Element B slots ===");
const { applySlotToPlacement } = await import(join(root, "src/engine/element-slots.js"));
const basePt = { x: 10, y: 20, z: 0, angle: 0, t: 0.5, index: 0 };
const slotted = applySlotToPlacement(basePt, { offsetX: 5, offsetY: -2, rotateDeg: 90, scale: 50 });
assert("slot offset x", Math.abs(slotted.x - 15) < 0.01);
assert("slot offset y", Math.abs(slotted.y - 18) < 0.01);
assert("slot scale mul", Math.abs((slotted.copyScaleMul ?? 1) - 0.5) < 0.01);
const bParams = defaultParams();
bParams.elementBEnabled = true;
bParams.elementBOffsetX = 4;
const jsonB = exportConfig(bParams, timeline, appFlow);
const bParams2 = defaultParams();
importConfig(jsonB, bParams2, timeline, appFlow);
assert("element B round-trip enabled", bParams2.elementBEnabled === true);
assert("element B round-trip offset", bParams2.elementBOffsetX === 4);

console.log("\n=== Single-preview copy ===");
const singlePlacement = { x: 0, y: 0, z: 0, angle: 0, t: 0.5, index: 0 };
const previewCopy = defaultParams();
previewCopy.pathInstanceLimit = 1;
previewCopy.elementCopyEnabled = true;
previewCopy.elementCopyCount = 3;
const previewExpanded = expandPlacementsWithCopies([singlePlacement], previewCopy);
assert("single-preview copy expands placements", previewExpanded.length === 4);
assert(
  "single-preview copy offsets",
  Math.abs(previewExpanded[1].x - previewCopy.elementCopyOffsetX) < 0.01 ||
    previewExpanded[1].x !== previewExpanded[0].x ||
    previewCopy.elementCopyDistance > 0,
);

console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
