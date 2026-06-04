import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { parseUnitSvg } = await import(join(root, "src/engine/unit.js"));

const svgPath = join(root, "public/test-fixtures/curve-2x.svg");
const text = readFileSync(svgPath, "utf8");

const loader = new SVGLoader();
const data = loader.parse(text);
console.log("paths:", data.paths.length);
for (let i = 0; i < data.paths.length; i++) {
  const p = data.paths[i];
  const style = p.userData?.style ?? {};
  console.log(`path[${i}] subPaths:`, p.subPaths.length, "style:", JSON.stringify(style));
  const shapes = SVGLoader.createShapes(p);
  console.log(`  createShapes:`, shapes.length);
}

const unit = parseUnitSvg(text);
if (!unit) {
  console.error("parseUnitSvg FAILED");
  process.exit(1);
}
const pos = unit.geometry.attributes.position;
console.log("parseUnitSvg OK");
console.log("  unitLength:", unit.unitLength);
console.log("  vertices:", pos.count);
unit.geometry.computeBoundingBox();
const b = unit.geometry.boundingBox;
console.log("  bbox:", {
  x: [b.min.x, b.max.x],
  y: [b.min.y, b.max.y],
});
