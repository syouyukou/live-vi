import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

const dom = new JSDOM("<!DOCTYPE html><html></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const text = readFileSync(join(root, "public/test-fixtures/curve-2x.svg"), "utf8");
const data = new SVGLoader().parse(text);
const path = data.paths[0];
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const subPath of path.subPaths) {
  for (const p of subPath.getPoints(48)) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
}
console.log("path bounds", { w: maxX - minX, h: maxY - minY, minX, maxX, minY, maxY });

const style = path.userData.style;
const strokeStyle = {
  strokeColor: "#000",
  strokeWidth: Math.min(maxX - minX, maxY - minY) * 0.85,
  strokeLineJoin: "round",
  strokeLineCap: "round",
  strokeMiterLimit: 4,
};
const pts = path.subPaths[0].getPoints(48);
const g = SVGLoader.pointsToStroke(pts, strokeStyle, 10, 0.2);
g.computeBoundingBox();
const b = g.boundingBox;
console.log("stroke geom", {
  verts: g.attributes.position.count,
  w: b.max.x - b.min.x,
  h: b.max.y - b.min.y,
});
