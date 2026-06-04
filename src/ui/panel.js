import { PARAM_GROUPS } from "../engine/param-registry.js";
import { SVG_PRESETS } from "../engine/presets.js";
import { PIPELINE_NODES } from "../engine/graph.js";

function formatVal(v) {
  if (Number.isInteger(v)) return String(v);
  return Number(v).toFixed(Math.abs(v) < 0.1 ? 3 : 2);
}

function sliderRow(def, val) {
  const id = `p-${def.key}`;
  return `
    <div class="vi-param-row relative flex items-center w-full h-8 mb-0.5" data-key="${def.key}">
      <span class="vi-param-label absolute left-0 w-32 -translate-y-1/2 top-1/2 text-xs font-light leading-tight pr-2">
        <span class="block text-foreground/90">${def.labelEn}</span>
        <span class="block text-[10px] text-foreground/40">${def.labelJa}</span>
      </span>
      <div class="relative flex items-center flex-1 ml-32 h-full min-w-0">
        <input type="range" class="vi-slider w-full" id="${id}"
          min="${def.min}" max="${def.max}" step="${def.step}" value="${val}" />
        <output class="vi-param-value absolute -right-1 top-1/2 -translate-y-1/2 text-[10px] font-light tabular-nums text-foreground/70 w-10 text-right" id="${id}-val">${formatVal(val)}</output>
      </div>
    </div>`;
}

function collapsible(id, titleEn, titleJa, open, bodyHtml) {
  return `
    <div class="vi-collapsible group/collapsible w-full border-b border-foreground/15" data-group="${id}">
      <button type="button" class="vi-collapsible-trigger flex flex-row items-center justify-between w-full py-3 px-1 text-sm font-light text-foreground hover:bg-foreground/5" aria-expanded="${open}">
        <span class="flex flex-col items-start text-left">
          <span>${titleEn}</span>
          <span class="text-[10px] text-foreground/45">${titleJa}</span>
        </span>
        <span class="vi-chevron text-foreground/50 text-xs transition-transform">▾</span>
      </button>
      <div class="vi-collapsible-body ${open ? "" : "hidden"} pb-3 px-1">
        ${bodyHtml}
      </div>
    </div>`;
}

/** @param {HTMLElement} scrollRoot */
export function buildSidebarParams(scrollRoot, params, onChange) {
  const presetBlock = `
    <label class="vi-field-row flex flex-col gap-1 mb-3 text-xs font-light">
      <span class="text-foreground/80">Shape / Preset / Index</span>
      <span class="text-[10px] text-foreground/40">シェイプ / プリセット / インデックス番号</span>
      <select id="svg-preset" class="vi-select"></select>
    </label>
    <label class="vi-switch-row">
      <input type="checkbox" id="enable-second-layer" class="vi-switch-input" />
      <span class="vi-switch-ui"></span>
      <span class="text-xs font-light">Dual layer</span>
    </label>
    <label class="vi-field-row flex flex-col gap-1 mb-2 text-xs font-light">
      <span>2nd preset</span>
      <select id="second-preset" class="vi-select"></select>
    </label>
    <label class="vi-switch-row">
      <input type="checkbox" id="path-edit-enabled" class="vi-switch-input" />
      <span class="vi-switch-ui"></span>
      <span class="text-xs font-light">Bezier path</span>
    </label>`;

  const colorBlock = `
    <label class="vi-field-row flex flex-col gap-1 mb-3 text-xs font-light">
      <span>Color / Mode / Index</span>
      <span class="text-[10px] text-foreground/40">カラーモード / インデックス番号</span>
      <select id="color-mode" class="vi-select">
        <option value="0">0 — Classic</option>
        <option value="1">1 — Navy</option>
        <option value="2">2 — Neon</option>
        <option value="3">3 — Forest</option>
        <option value="4">4 — Brown</option>
      </select>
    </label>
    <div class="flex flex-row gap-1.5">
      <input type="number" id="seed" class="vi-select flex-1" value="42" min="0" max="999999" />
      <button type="button" class="vi-btn" id="randomize">Random</button>
    </div>`;

  const mouseToggle = `
    <label class="vi-switch-row mb-2">
      <input type="checkbox" id="mouse-enabled" class="vi-switch-input" checked />
      <span class="vi-switch-ui"></span>
      <span class="text-xs font-light">Mouse enabled</span>
    </label>`;

  const handToggles = `
    <label class="vi-switch-row">
      <input type="checkbox" id="hand-enabled" class="vi-switch-input" />
      <span class="vi-switch-ui"></span>
      <span class="text-xs font-light">Hand enabled</span>
    </label>
    <label class="vi-switch-row">
      <input type="checkbox" id="hand-follow" class="vi-switch-input" checked />
      <span class="vi-switch-ui"></span>
      <span class="text-xs font-light">Follow cursor</span>
    </label>`;

  let html = collapsible("preset", "Shape", "シェイプ", true, presetBlock);

  for (const g of PARAM_GROUPS) {
    let body = "";
    if (g.id === "mouse") body = mouseToggle;
    if (g.id === "hand") body = handToggles;
    for (const def of g.params) {
      body += sliderRow(def, params[def.key]);
    }
    html += collapsible(g.id, g.titleEn, g.titleJa, g.id === "element" || g.id === "shape", body);
  }

  html += collapsible("color", "Color", "カラー", true, colorBlock);

  scrollRoot.innerHTML = html;

  scrollRoot.querySelectorAll(".vi-collapsible-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = btn.nextElementSibling;
      const open = body.classList.toggle("hidden");
      btn.setAttribute("aria-expanded", String(!open));
      btn.querySelector(".vi-chevron").style.transform = open ? "" : "rotate(-90deg)";
    });
  });

  scrollRoot.querySelectorAll(".vi-slider").forEach((input) => {
    const key = input.closest("[data-key]")?.dataset.key;
    input.addEventListener("input", () => {
      if (key) params[key] = parseFloat(input.value);
      const out = scrollRoot.querySelector(`#${input.id}-val`);
      if (out) out.textContent = formatVal(params[key]);
      onChange(key);
    });
  });
}

export function fillPresetSelect(select) {
  select.innerHTML = SVG_PRESETS.map(
    (p, i) => `<option value="${i}">${i} — ${p.name}</option>`,
  ).join("");
}

export function renderGraph(root, nodes, onToggle) {
  root.innerHTML = nodes
    .map(
      (n) => `<label class="vi-graph-node">
      <input type="checkbox" data-id="${n.id}" ${n.enabled ? "checked" : ""} class="accent-[#22d3ee]" />
      <span><strong class="font-light text-xs text-gray-200">${n.label}</strong><br/><small class="text-[10px] text-gray-500">${n.desc}</small></span>
    </label>`,
    )
    .join("");
  root.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => onToggle(input.dataset.id, input.checked));
  });
}

export function renderPipelineList() {
  return PIPELINE_NODES.map((n) => n.label).join(" → ");
}

export function syncAllSliderOutputs(root, params) {
  for (const g of PARAM_GROUPS) {
    for (const def of g.params) {
      const input = root.querySelector(`#p-${def.key}`);
      const out = root.querySelector(`#p-${def.key}-val`);
      if (input && def.key in params) input.value = params[def.key];
      if (out && def.key in params) out.textContent = formatVal(params[def.key]);
    }
  }
}
