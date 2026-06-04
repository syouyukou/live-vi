/** @typedef {"both" | "en" | "zh"} UiLang */

/** @type {Record<string, { en: string; zh: string }>} */
export const UI_STRINGS = {
  "nav.setting": { en: "Setting", zh: "設定" },
  "nav.design": { en: "Design", zh: "設計" },
  "section.importExport": { en: "Import & Export", zh: "匯入與匯出" },
  "action.importJson": { en: "Import .json", zh: "匯入 .json" },
  "action.exportJson": { en: "Export .json", zh: "匯出 .json" },
  "section.canvasSize": { en: "Canvas Size", zh: "畫布尺寸" },
  "label.preset": { en: "Preset", zh: "預設值" },
  "preset.16x9": { en: "16:9", zh: "16:9" },
  "preset.9x16": { en: "9:16", zh: "9:16" },
  "preset.1x1": { en: "1:1", zh: "1:1" },
  "section.shape": { en: "Shape", zh: "形狀" },
  "label.size": { en: "Size", zh: "大小" },
  "label.modify": { en: "Modify", zh: "變形" },
  "label.rotate": { en: "Rotate", zh: "旋轉" },
  "label.posX": { en: "Pos X", zh: "X 位置" },
  "label.posY": { en: "Pos Y", zh: "Y 位置" },
  "label.shape": { en: "Shape", zh: "形狀" },
  "action.importSvg": { en: "Import path .svg", zh: "匯入路徑 .svg" },
  "action.importElementSvg": { en: "Import element .svg", zh: "匯入元素 .svg" },
  "section.recentElements": { en: "Recent elements", zh: "最近元素" },
  "action.pickNewElementFile": { en: "Choose new file…", zh: "選擇新檔案…" },
  "hint.noRecentElements": { en: "No saved elements yet.", zh: "尚無已儲存的元素。" },
  "error.invalidElementSvg": {
    en: "Could not read this SVG. Use filled shapes or stroked paths (not only images).",
    zh: "無法讀取此 SVG。請使用填色圖形或描邊路徑（不能只有點陣圖）。",
  },
  "section.element": { en: "Element", zh: "元素" },
  "label.angle": { en: "Angle", zh: "角度" },
  "label.length": { en: "Length", zh: "長度" },
  "label.width": { en: "Width", zh: "寬度" },
  "label.height": { en: "Height", zh: "高度" },
  "label.pitch": { en: "Pitch", zh: "間距" },
  "label.overlap": { en: "Overlap", zh: "交疊" },
  "overlap.separate": { en: "Separate", zh: "各自框線" },
  "overlap.merged": { en: "Merged", zh: "融合" },
  "label.copy": { en: "Copy", zh: "複製" },
  "label.copyEnable": { en: "Copy", zh: "複製" },
  "label.copyHorizontal": { en: "Horizontal", zh: "水平" },
  "label.copyVertical": { en: "Vertical", zh: "垂直" },
  "label.copyDistance": { en: "Distance", zh: "距離" },
  "label.copyAngle": { en: "Angle", zh: "角度" },
  "label.copyRotate": { en: "Rotation", zh: "旋轉" },
  "label.copyScale": { en: "Scale", zh: "縮放" },
  "label.copyCount": { en: "Copies", zh: "副本數量" },
  "section.elementColor": { en: "Color", zh: "顏色" },
  "label.useGradient": { en: "Gradient", zh: "漸層" },
  "label.gradientMap": { en: "Gradient map", zh: "漸層對應" },
  "hint.gradientMap": {
    en: "Gradient on each element (along its shape) · drag stops · diamonds adjust blend · double-click bar to add",
    zh: "漸層作用於每個物件本體 · 拖曳色標 · 菱形調過渡 · 雙擊列新增",
  },
  "label.fillColor": { en: "Fill", zh: "填色" },
  "label.outlineColor": { en: "Outline", zh: "外框" },
  "action.swapFillStroke": { en: "Swap fill and outline", zh: "交換填色與外框" },
  "section.randomness": { en: "Randomness", zh: "隨機" },
  "label.sensitivity": { en: "Sensitivity", zh: "敏感度" },
  "action.reRandom": { en: "Re-Random", zh: "重新隨機" },
  "section.sensor": { en: "Sensor", zh: "感應器" },
  "label.sensorType": { en: "Sensor Type", zh: "感應器類型" },
  "sensor.mouse": { en: "mouse", zh: "滑鼠" },
  "sensor.none": { en: "none", zh: "無反應" },
  "section.mouse": { en: "Mouse", zh: "滑鼠" },
  "label.mouseFollowDirection": { en: "Follow direction", zh: "跟隨方向" },
  "label.mouseDirectionInfluence": { en: "Direction influence", zh: "方向強度" },
  "action.reset": { en: "Reset", zh: "重設" },
  "footer.timelineEditor": { en: "Timeline Editor", zh: "時間軸編輯器" },
  "empty.loading": { en: "Loading…", zh: "載入中…" },
};

const LANG_CYCLE = /** @type {const} */ (["both", "en", "zh"]);
const LANG_BUTTON = { both: "EN/中", en: "EN", zh: "中" };

/** @param {{ en: string; zh: string }} entry @param {UiLang} lang */
export function formatLabel(entry, lang) {
  if (lang === "en") return entry.en;
  if (lang === "zh") return entry.zh;
  if (entry.en === entry.zh) return entry.en;
  return `${entry.en} / ${entry.zh}`;
}

/** @param {UiLang} lang */
export function applyUiLang(lang) {
  document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const entry = key && UI_STRINGS[key];
    if (!entry) return;
    el.textContent = formatLabel(entry, lang);
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    const entry = key && UI_STRINGS[key];
    if (!entry) return;
    const label = formatLabel(entry, lang);
    el.setAttribute("title", label);
    if (el.hasAttribute("aria-label")) el.setAttribute("aria-label", label);
  });

  const toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle.textContent = LANG_BUTTON[lang];
    toggle.setAttribute("aria-pressed", String(lang === "both"));
    toggle.setAttribute("title", lang === "both" ? "Bilingual" : lang === "en" ? "English" : "中文");
  }
}

/** @param {UiLang} current */
export function nextUiLang(current) {
  const i = LANG_CYCLE.indexOf(current);
  return LANG_CYCLE[(i + 1) % LANG_CYCLE.length];
}

/**
 * @param {HTMLElement | null} [toggleEl]
 * @param {(lang: UiLang) => void} [onChange]
 */
export function initUiLang(toggleEl, onChange) {
  let lang = /** @type {UiLang} */ ("both");
  applyUiLang(lang);
  onChange?.(lang);

  const toggle = toggleEl ?? document.getElementById("lang-toggle");
  toggle?.addEventListener("click", () => {
    lang = nextUiLang(lang);
    applyUiLang(lang);
    onChange?.(lang);
  });

  return () => lang;
}
