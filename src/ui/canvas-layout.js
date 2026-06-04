/** @param {import("../engine/params.js").ViParams} params */
export function applyCanvasLayout(params) {
  const wrap = document.querySelector(".composer-canvas-wrap");
  const stage = document.querySelector(".composer-stage");
  if (!wrap || !stage) return;

  const w = Math.max(64, params.canvasWidth);
  const h = Math.max(64, params.canvasHeight);
  const maxW = Math.max(120, stage.clientWidth - 48);
  const maxH = Math.max(120, stage.clientHeight - 48);
  const scale = Math.min(maxW / w, maxH / h);
  wrap.style.width = `${Math.round(w * scale)}px`;
  wrap.style.height = `${Math.round(h * scale)}px`;
}

export const CANVAS_ASPECT_PRESETS = {
  "16:9": { canvasWidth: 960, canvasHeight: 540 },
  "9:16": { canvasWidth: 540, canvasHeight: 960 },
  "1:1": { canvasWidth: 540, canvasHeight: 540 },
};
