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
assert(
  "parseUnitSvg useSvgColors",
  parseUnitSvg(curveSvg, { useSvgColors: true })?.fillColor?.startsWith("#"),
);

for (const preset of SVG_PRESETS) {
  const paths = parsePathSvg(preset.path);
  const unit = parseUnitSvg(preset.unit);
  assert(`preset "${preset.name}" path`, paths.length > 0);
  assert(`preset "${preset.name}" unit`, unit !== null);
}

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

console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
