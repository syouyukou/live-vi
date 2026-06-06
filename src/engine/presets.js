const EMPTY_PATH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>`;

/** 內建 SVG 預設庫（對應原站 svgPresetIndex 概念） */
export const SVG_PRESETS = [
  {
    name: "無路徑",
    label: { en: "No path", zh: "無路徑" },
    elementLabel: { en: "Teardrop", zh: "水滴" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 54"><path fill="#111" d="M 10 0 C 15 20 16.5 28 10 30 C 16.8 32 16 44 10 54 C 3.2 44 2.2 32 10 30 C 3.5 28 5 20 10 0 Z"/></svg>`,
  },
  {
    name: "矩形",
    label: { en: "Rectangle", zh: "矩形" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect x="4" y="4" width="72" height="72" fill="#111"/></svg>`,
  },
  {
    name: "新月",
    label: { en: "Crescent", zh: "新月" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path fill="#111" d="M 48 4 C 16 24, 12 76, 48 96 C 36 72, 34 28, 48 4 Z"/></svg>`,
  },
  {
    name: "圓形",
    label: { en: "Circle", zh: "圓形" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#111"/></svg>`,
  },
  {
    name: "三角形",
    label: { en: "Triangle", zh: "三角形" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 72"><polygon points="40,4 76,68 4,68" fill="#111"/></svg>`,
  },
  {
    name: "橢圓",
    label: { en: "Ellipse", zh: "橢圓" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 48"><ellipse cx="50" cy="24" rx="46" ry="20" fill="#111"/></svg>`,
  },
  {
    name: "星形",
    label: { en: "Star", zh: "星形" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><polygon points="40,4 47.6,29.2 74.4,29.2 52.4,45.6 60,70.8 40,54.4 20,70.8 27.6,45.6 5.6,29.2 32.4,29.2" fill="#111"/></svg>`,
  },
  {
    name: "Tokyo",
    path: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320">
      <path fill="none" stroke="#000" d="M 20 240 C 80 200, 140 160, 220 120 S 380 40, 480 20"/>
      <path fill="none" stroke="#000" d="M 40 260 C 120 220, 200 180, 300 140 S 420 80, 500 60"/>
      <path fill="none" stroke="#000" d="M 0 200 C 60 180, 120 150, 200 110 S 360 30, 440 0"/>
    </svg>`,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 54"><path fill="#111" d="M 10 0 C 15 20 16.5 28 10 30 C 16.8 32 16 44 10 54 C 3.2 44 2.2 32 10 30 C 3.5 28 5 20 10 0 Z"/></svg>`,
  },
  {
    name: "波浪帶",
    path: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200">
      <path fill="none" stroke="#000" d="M 20 100 C 120 20, 200 180, 300 100 S 460 30, 460 100"/>
    </svg>`,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 12"><ellipse cx="16" cy="6" rx="14" ry="4" fill="#111"/></svg>`,
  },
  {
    name: "圓環",
    path: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="75" fill="none" stroke="#000"/>
    </svg>`,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 8"><rect x="2" y="2" width="20" height="4" rx="2" fill="#111"/></svg>`,
  },
  {
    name: "螺旋",
    path: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path fill="none" stroke="#000" d="M 100 100 m -70 0 a 70 70 0 1 1 140 0 a 55 55 0 1 1 -110 0 a 40 40 0 1 1 80 0"/>
    </svg>`,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 16"><polygon points="10,2 18,14 2,14" fill="#111"/></svg>`,
  },
  {
    name: "雙曲",
    path: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 160">
      <path fill="none" stroke="#000" d="M 20 80 C 80 20, 140 140, 200 80 S 320 20, 400 80"/>
      <path fill="none" stroke="#000" d="M 20 120 C 100 60, 180 160, 260 100"/>
    </svg>`,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#111"/></svg>`,
  },
  {
    name: "直條",
    label: { en: "Bar", zh: "直條" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 80"><rect x="3" y="2" width="6" height="76" fill="#111"/></svg>`,
  },
  {
    name: "箭頭",
    label: { en: "Arrow", zh: "箭頭" },
    noPath: true,
    path: EMPTY_PATH,
    unit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 80"><polygon points="24,4 44,68 24,56 4,68" fill="#111"/></svg>`,
  },
];

/** @param {typeof SVG_PRESETS[number] | undefined} preset */
export function isNoPathPreset(preset) {
  return Boolean(preset?.noPath);
}

/** @typedef {{ preset: typeof SVG_PRESETS[number]; svgPresetIndex: number }} ElementPresetEntry */

/** @returns {ElementPresetEntry[]} */
export function getElementPresets() {
  return SVG_PRESETS.map((preset, svgPresetIndex) => ({ preset, svgPresetIndex })).filter(({ preset }) =>
    isNoPathPreset(preset),
  );
}

export const APP_FLOW_SCENES = [
  { name: "Intro", presetIndex: 7, colorModeIndex: 0, shapeModifyFactor: 0.06 },
  { name: "Flow", presetIndex: 8, colorModeIndex: 2, shapeModifyFactor: 0.12 },
  { name: "Dense", presetIndex: 10, colorModeIndex: 1, pitch: 0.025, randomnessMultiply: 5 },
];
