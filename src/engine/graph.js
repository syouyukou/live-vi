/** 簡化節點管線（對應原站 threejs → webgl-canvas 概念） */
export const PIPELINE_NODES = [
  { id: "svg-preset", label: "SVG 預設", enabled: true, desc: "載入內建路徑與符號" },
  { id: "resample", label: "路徑重採樣", enabled: true, desc: "Pitch 沿路徑取點" },
  { id: "deform", label: "形狀變形", enabled: true, desc: "shapeModify / rotate" },
  { id: "instance", label: "Instance 排列", enabled: true, desc: "長寬角 + 隨機" },
  { id: "interaction", label: "滑鼠 / 手勢", enabled: true, desc: "感應縮放" },
  { id: "webgl", label: "WebGL 輸出", enabled: true, desc: "Canvas 繪製" },
];

export function createGraphState() {
  return PIPELINE_NODES.map((n) => ({ ...n }));
}

/**
 * @param {ReturnType<createGraphState>} nodes
 * @param {import("./params.js").ViParams} params
 */
export function applyGraphToParams(nodes, params) {
  const map = Object.fromEntries(nodes.map((n) => [n.id, n.enabled]));
  if (!map.deform) params.shapeModifyFactor = 0;
  if (!map.interaction) {
    params.mouseEnabled = false;
    params.handEnabled = false;
  }
}
