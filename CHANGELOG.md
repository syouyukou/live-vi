# Changelog

本專案所有重要變更都記錄於此，**自 0.1 起**依版本累積。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

維護方式見 [docs/VERSIONING.md](docs/VERSIONING.md)。

> **Git 標籤：** `v0.1`、`v0.1.1` 為回溯整理；`v0.1.2` 起與提交對應（舊標籤 `v0.2.1` 已廢止）。

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

---

## [0.1.3] — 2026-06-04

對應 Git tag：`v0.1.3`

### Added

- 側欄**拖曳調整寬度**（`sidebar-resize.js`）：180–520px、寫入 `localStorage`、鍵盤 ←/→、小螢幕自動停用
- 元素 SVG：**描邊優先**解析、`viewBox` 寬高分開計算、依路徑跨度自動描邊粗細；匯入後可保留 SVG 填色（`useSvgColors`）
- `npm run test:unit-svg`：以 jsdom 驗證 `parseUnitSvg`（`public/test-fixtures/curve-2x.svg`）
- 開發模式 `?testCurve=1` 可快速載入測試用曲線 SVG

### Changed

- 側欄寬度改由 CSS 變數 `--sidebar-width` 控制，與拖曳把手連動

---

## [0.1.2] — 2026-06-04

對應 Git tag：`v0.1.2`

### Added

- **滑鼠移動方向跟隨**：游標影響範圍內的元素會依滑鼠移動方向旋轉（`mouseFollowDirection`、`mouseDirectionInfluence`）
- 滑鼠面板：**跟隨方向** 開關、**方向強度** 滑桿（0–1）
- `instanceAngle()` / `lerpAngle()`：路徑切線角度與滑鼠方向平滑混合
- 渲染迴圈追蹤滑鼠位移方向；SVG 匯出同步套用旋轉
- `.gitignore`（排除 `node_modules`、`dist` 等）
- 本檔 `CHANGELOG.md` 與 [docs/VERSIONING.md](docs/VERSIONING.md)

### Changed

- README「滑鼠」列加入方向跟隨說明
- 版本號由錯誤的 `0.2.x` 改為 `0.1` / `0.1.1` / `0.1.2` 序列

### Infrastructure

- 首次推送至 GitHub：`syouyukou/live-vi`（private）

---

## [0.1.1] — 2026-06

首個功能完整的 **LIVE VI Composer** Web 版，對齊 [Autumn Meteorite VI Composer](https://composer.autumnmeteorite.jp/) 的**視覺**能力（不含陀螺儀、音訊、麥克風、文字層）。

### Added

**核心渲染**

- 路徑變形（`shapeModify`、`shapeRotate`）、取樣間距（Pitch）
- 元素角度 / 長度 / 寬度 / 線寬、相機縮放
- 隨機種子與感度（長 / 寬分軸、`sharedScaleDirection`）
- 5 種 `colorMode`、描邊 / 填色 / 外框、第二層堆疊、echo 層
- 內建 4 組路徑 + 符號預設；匯入路徑 / 元素 `.svg`

**感應器**

- 滑鼠：位置影響範圍內元素的長 / 寬 scaling（`mouseRadius`、感度參數）
- 手勢：`handPos` 參數 + 可跟隨游標（無攝影機 / MediaPipe）

**介面**

- 雙欄面板：Design（形狀 / 元素 / 隨機 / 感應器 / 滑鼠）與 Setting（匯入匯出、畫布尺寸 16:9 / 9:16 / 1:1）
- 中英雙語切換（`data-i18n`）
- 配色對齊 `design-system/MASTER.md`（Geist、`palt`）

**時間軸與腳本**

- Timeline 播放 / scrub、關鍵影格插值、JSON 匯入匯出
- Config JSON 匯入匯出（僅套用已知參數鍵）
- App Flow 場景切換；簡化管線節點開關

**匯出**

- PNG、SVG、WebM 錄影、設定 JSON

**文件與工具**

- `README.md`、`docs/ROADMAP.md`、`AGENTS.md`
- 專案 skill：`vi-composer-web`；`.agents` 內 a11y / React 參考 skill
- Phase A：focus-visible、reduced-motion、config 過濾未知鍵

### Known limitations（0.1.1 起沿用）

- Timeline Editor UI 尚未開放（按鈕提示鎖定於目前版本）
- `sensorTypeIndex` 僅 UI 預留，實際僅 mouse 模式
- 無陀螺儀、音訊、麥克風、字型層、完整節點圖編輯器

---

## [0.1] — 2026-06（專案起步）

**流動的 creative code / live-vi** 專案建立，目標為在瀏覽器重現 VI Composer 的圖像管線。

### Added

- Vite 6 + Three.js 專案骨架（`package.json`、`src/main.js` 渲染迴圈）
- 正交相機 + `InstancedMesh` 沿路徑放置單一符號圖層
- `parsePathSvg` / `parseUnitSvg`、`samplePlacements` 基礎取樣
- `defaultParams()` 與 `param-registry.js` 參數結構雛形
- `ViRenderer`：路徑 → 變形 → 實例矩陣更新（無第二層 / echo）
- 最小畫布容器 `#canvas-host`（尚未對齊原站三欄 + 時間軸 footer）

### Not yet（留待 0.1.1）

- 完整 Design / Setting 側欄、雙語 UI
- 滑鼠 / 手勢感應、隨機感度面板
- Timeline、App Flow、Config / Timeline JSON、PNG·SVG·WebM 匯出
- `design-system/MASTER.md`、ROADMAP、Agent skills

---

## 版本對照

| 版本  | 日期       | Git tag    | 摘要 |
|-------|------------|------------|------|
| 0.1.3 | 2026-06-04 | `v0.1.3`   | 側欄拖曳寬度、SVG 描邊匯入改進、unit 測試 |
| 0.1.2 | 2026-06-04 | `v0.1.2`   | 滑鼠方向跟隨、CHANGELOG、GitHub |
| 0.1.1 | 2026-06    | —（回溯）  | 完整 Web VI Composer 基線 |
| 0.1   | 2026-06    | —（回溯）  | Vite + Three 渲染雛形、路徑/符號管線起步 |

Autumn Meteorite 官方桌面 / 原站 Composer 的功能不在本 repo 版本史內。
