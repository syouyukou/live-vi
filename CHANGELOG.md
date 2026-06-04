# Changelog

本專案所有重要變更都記錄於此。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版本號遵循 [語意化版本](https://semver.org/lang/zh-TW/)。

維護方式見 [docs/VERSIONING.md](docs/VERSIONING.md)。

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

---

## [0.2.1] — 2026-06-04

對應 Git tag：`v0.2.1`

### Added

- **滑鼠移動方向跟隨**：游標影響範圍內的元素會依滑鼠移動方向旋轉（`mouseFollowDirection`、`mouseDirectionInfluence`）
- 滑鼠面板：**跟隨方向** 開關、**方向強度** 滑桿（0–1）
- `instanceAngle()` / `lerpAngle()`：路徑切線角度與滑鼠方向平滑混合
- 渲染迴圈追蹤滑鼠位移方向；SVG 匯出同步套用旋轉
- `.gitignore`（排除 `node_modules`、`dist` 等）
- 本檔 `CHANGELOG.md` 與版本維護說明

### Changed

- README「滑鼠」列加入方向跟隨說明

### Infrastructure

- 首次推送至 GitHub：`syouyukou/live-vi`（private）

---

## [0.2.0] — 2026-06（基線版）

首個可在瀏覽器運行的 **LIVE VI Composer** Web 版，對齊 [Autumn Meteorite VI Composer](https://composer.autumnmeteorite.jp/) 的**視覺**功能（不含陀螺儀、音訊、麥克風、文字層）。

### Added

**核心渲染**

- Vite 6 + Three.js：`InstancedMesh` 沿路徑排列 SVG 元素
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

### Known limitations（0.2.0 起沿用）

- Timeline Editor UI 尚未開放（按鈕提示鎖定於 Ver. 0.2.1）
- `sensorTypeIndex` 僅 UI 預留，實際僅 mouse 模式
- 無陀螺儀、音訊、麥克風、字型層、完整節點圖編輯器

---

## 版本對照

| 版本   | 日期       | 摘要 |
|--------|------------|------|
| 0.2.1  | 2026-06-04 | 滑鼠方向跟隨、CHANGELOG、GitHub |
| 0.2.0  | 2026-06    | 首版 Web VI Composer 基線功能 |

更早的桌面 / 原站功能不在本 repo 版本史內；請參考 Autumn Meteorite 官方 Composer。
