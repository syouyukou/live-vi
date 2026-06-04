/** 內建 SVG 預設庫（對應原站 svgPresetIndex 概念） */
export const SVG_PRESETS = [
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
];

export const APP_FLOW_SCENES = [
  { name: "Intro", presetIndex: 0, colorModeIndex: 0, shapeModifyFactor: 0.06 },
  { name: "Flow", presetIndex: 1, colorModeIndex: 2, shapeModifyFactor: 0.12 },
  { name: "Dense", presetIndex: 3, colorModeIndex: 1, pitch: 0.025, randomnessMultiply: 5 },
];
