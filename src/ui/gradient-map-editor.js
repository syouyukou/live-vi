import {
  ensureGradientStops,
  gradientMapCss,
  newGradientStopId,
  normalizeGradientStops,
  syncLegacyFillFromStops,
} from "../engine/gradient-map.js";
import { normalizeHexColor } from "../engine/color-modes.js";

const MAX_STOPS = 8;
const MIN_STOPS = 2;

/**
 * @param {HTMLElement} mount
 * @param {{
 *   getStops: () => import("../engine/gradient-map.js").GradientStop[],
 *   setStops: (stops: import("../engine/gradient-map.js").GradientStop[]) => void,
 *   getFillColor: () => string,
 *   getGradientEnd: () => string,
 * }} accessors
 * @param {() => void} onChange
 */
export function initGradientMapEditor(mount, accessors, onChange) {
  if (!mount) return { syncFromParams: () => {} };

  mount.innerHTML = `
    <div class="gradient-map" role="group" aria-label="Gradient map">
      <div class="gradient-map-track-wrap">
        <div class="gradient-map-midpoints" data-midpoints></div>
        <div class="gradient-map-track" data-track tabindex="0" aria-label="Gradient preview"></div>
        <div class="gradient-map-stops" data-stops></div>
      </div>
    </div>
  `;

  const track = mount.querySelector("[data-track]");
  const stopsLayer = mount.querySelector("[data-stops]");
  const midpointsLayer = mount.querySelector("[data-midpoints]");

  /** @type {string | null} */
  let selectedId = null;
  /** @type {{ kind: "stop" | "mid", id: string, pointerId: number } | null} */
  let drag = null;
  let suppressClick = false;

  const hiddenColor = document.createElement("input");
  hiddenColor.type = "color";
  hiddenColor.className = "gradient-map-hidden-color";
  hiddenColor.setAttribute("aria-hidden", "true");
  mount.appendChild(hiddenColor);

  function getStops() {
    return normalizeGradientStops(
      ensureGradientStops(accessors.getStops(), accessors.getFillColor(), accessors.getGradientEnd()),
    );
  }

  function commit(stops) {
    const normalized = normalizeGradientStops(stops);
    accessors.setStops(normalized);
    const legacy = syncLegacyFillFromStops(normalized);
    onChange(legacy);
    render();
  }

  function render() {
    const stops = getStops();
    if (track) track.style.background = gradientMapCss(stops);

    if (stopsLayer) {
      stopsLayer.innerHTML = stops
        .map(
          (s) => `
        <button type="button" class="gradient-map-stop ${s.id === selectedId ? "is-selected" : ""}"
          data-stop-id="${s.id}" style="left:${(s.position * 100).toFixed(3)}%"
          aria-label="Color stop ${Math.round(s.position * 100)}%"
          aria-pressed="${s.id === selectedId}">
          <span class="gradient-map-stop-color" style="background:${s.color}"></span>
        </button>`,
        )
        .join("");
    }

    if (midpointsLayer) {
      const mids = [];
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i];
        const b = stops[i + 1];
        const pos = a.position + (b.position - a.position) * a.midpoint;
        mids.push(
          `<button type="button" class="gradient-map-mid" data-mid-id="${a.id}"
            style="left:${(pos * 100).toFixed(3)}%" aria-label="Midpoint between stops"></button>`,
        );
      }
      midpointsLayer.innerHTML = mids.join("");
    }
  }

  function positionFromEvent(clientX) {
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function pickStop(id) {
    selectedId = id;
    render();
  }

  stopsLayer?.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest("[data-stop-id]");
    if (!btn || !(btn instanceof HTMLElement)) return;
    const id = btn.dataset.stopId;
    if (!id) return;
    pickStop(id);
    drag = { kind: "stop", id, pointerId: e.pointerId };
    btn.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  midpointsLayer?.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest("[data-mid-id]");
    if (!btn || !(btn instanceof HTMLElement)) return;
    const id = btn.dataset.midId;
    if (!id) return;
    drag = { kind: "mid", id, pointerId: e.pointerId };
    btn.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  function onPointerMove(e) {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const pos = positionFromEvent(e.clientX);
    const stops = getStops().map((s) => ({ ...s }));

    if (drag.kind === "stop") {
      const idx = stops.findIndex((s) => s.id === drag.id);
      if (idx < 0) return;
      const isFirst = idx === 0;
      const isLast = idx === stops.length - 1;
      if (isFirst) stops[idx].position = 0;
      else if (isLast) stops[idx].position = 1;
      else {
        const min = stops[idx - 1].position + 0.02;
        const max = stops[idx + 1].position - 0.02;
        stops[idx].position = Math.max(min, Math.min(max, pos));
      }
      commit(stops);
    } else if (drag.kind === "mid") {
      const idx = stops.findIndex((s) => s.id === drag.id);
      if (idx < 0 || idx >= stops.length - 1) return;
      const a = stops[idx];
      const b = stops[idx + 1];
      const span = b.position - a.position || 1;
      a.midpoint = Math.max(0.05, Math.min(0.95, (pos - a.position) / span));
      commit(stops);
    }
  }

  function onPointerUp(e) {
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag) suppressClick = true;
    drag = null;
  }

  mount.addEventListener("pointermove", onPointerMove);
  mount.addEventListener("pointerup", onPointerUp);
  mount.addEventListener("pointercancel", onPointerUp);

  stopsLayer?.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    const btn = e.target.closest("[data-stop-id]");
    if (!btn || !(btn instanceof HTMLElement)) return;
    const id = btn.dataset.stopId;
    const stops = getStops();
    if (stops.length <= MIN_STOPS) return;
    const idx = stops.findIndex((s) => s.id === id);
    if (idx <= 0 || idx >= stops.length - 1) return;
    commit(stops.filter((s) => s.id !== id));
    selectedId = null;
  });

  stopsLayer?.addEventListener("click", (e) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const btn = e.target.closest("[data-stop-id]");
    if (!btn || !(btn instanceof HTMLElement)) return;
    const id = btn.dataset.stopId;
    const stop = getStops().find((s) => s.id === id);
    if (!stop) return;
    hiddenColor.value = stop.color;
    hiddenColor.oninput = () => {
      const hex = normalizeHexColor(hiddenColor.value);
      if (!hex) return;
      const stops = getStops().map((s) => (s.id === id ? { ...s, color: hex } : s));
      commit(stops);
    };
    hiddenColor.click();
  });

  track?.addEventListener("dblclick", (e) => {
    const stops = getStops();
    if (stops.length >= MAX_STOPS) return;
    const pos = positionFromEvent(e.clientX);
    let insertAt = stops.length;
    for (let i = 0; i < stops.length; i++) {
      if (pos < stops[i].position) {
        insertAt = i;
        break;
      }
    }
    if (insertAt === 0 || insertAt === stops.length) return;
    const left = stops[insertAt - 1];
    const right = stops[insertAt];
    const color = left.color;
    const next = [
      ...stops.slice(0, insertAt),
      { id: newGradientStopId(), position: pos, color, midpoint: 0.5 },
      ...stops.slice(insertAt),
    ];
    commit(next);
    pickStop(next[insertAt].id);
  });

  track?.addEventListener("keydown", (e) => {
    if (!selectedId || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    const stops = getStops();
    const idx = stops.findIndex((s) => s.id === selectedId);
    if (idx < 0) return;
    const delta = e.key === "ArrowLeft" ? -0.02 : 0.02;
    const copy = stops.map((s) => ({ ...s }));
    if (idx === 0) copy[0].position = 0;
    else if (idx === copy.length - 1) copy[idx].position = 1;
    else {
      const min = copy[idx - 1].position + 0.02;
      const max = copy[idx + 1].position - 0.02;
      copy[idx].position = Math.max(min, Math.min(max, copy[idx].position + delta));
    }
    commit(copy);
    e.preventDefault();
  });

  return {
    syncFromParams() {
      render();
    },
  };
}
