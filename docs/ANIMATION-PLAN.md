# live-vi 動畫功能規劃

> 建立日期：2026-06-06  
> 狀態：規劃中（尚未實作）

## 現況診斷

專案其實**已有一半動畫能力**，只是沒接好：

| 層級 | 現況 | 狀態 |
|------|------|------|
| **程序動畫** | `params.playing` + `speed` 驅動路徑波浪變形 | ✅ 運作中，但無 UI 控制 |
| **時間軸引擎** | `timeline.js` 有 keyframe 插值、`applyTimeline` | ⚠️ 已寫好，**未接入 render loop** |
| **場景切換** | `app-flow.js` 有 Intro / Flow / Dense | ⚠️ 資料在，**無 UI、無觸發** |
| **錄影輸出** | `CanvasRecorder` 可錄 WebM | ⚠️ 無 UI |
| **時間軸編輯器** | footer 有按鈕 | 🔒 v0.1.3 鎖定，點了只跳 alert |

### 資料流（現況 vs 目標）

```
現況：
  rAF loop → vi.tick → 路徑波浪變形
  Timeline 引擎 ──(未連接)── params

目標：
  rAF loop → tickTimeline → applyTimeline → params → vi.tick → render
                ↑
           Transport UI
```

### 相關檔案

| 路徑 | 角色 |
|------|------|
| `src/main.js` | rAF loop、滑鼠事件、鎖定的 timeline 按鈕 |
| `src/engine/timeline.js` | Keyframe 模型（未接入） |
| `src/engine/timeline-io.js` | Timeline JSON 驗證 / 匯入 / 匯出 |
| `src/engine/app-flow.js` | 場景切換（未接入） |
| `src/engine/deform.js` | 時間驅動的路徑波浪 |
| `src/engine/recorder.js` | WebM 錄製（未接入） |
| `src/engine/param-registry.js` | 可動畫參數的 min/max/step |
| `src/engine/config-io.js` | Config JSON 含 timeline / appFlow 區塊 |

### 兩套 `playing` 旗標

| 旗標 | 位置 | 現在行為 |
|------|------|----------|
| `params.playing` | `params.js` | 驅動路徑波浪變形 |
| `timeline.playing` | `timeline.js` | 應驅動 keyframe（未接） |

`prefers-reduced-motion` 目前只設 `params.playing = false`。

---

## 「動畫」範圍定義

拆成三種模式，由淺到深：

### 模式 A — 即時動態（最小可行）

畫面**持續在動**，使用者調參數即時看到效果。

- 路徑波浪（已有）
- 播放 / 暫停 / 速度控制
- 適合：創作探索、即時預覽

### 模式 B — 時間軸動畫（核心目標）

參數隨**時間**變化，可錄製、可重播。

- Keyframe：`shapeModify`、縮放、角度、顏色…
- 播放頭、scrub、循環
- 適合：成品輸出、精準控制

### 模式 C — 場景序列（進階）

多段預設組合自動切換（App Flow）。

- Intro → Flow → Dense（`presets.js` → `APP_FLOW_SCENES`）
- 適合：展示、展演模式

**建議先做 A + B 的骨架，C 當 v0.2 擴充。**

---

## 架構設計

### 1. 統一播放狀態

**建議：**

```
timeline.playing  →  主控（時間軸播放）
params.playing    →  子開關（是否啟用程序波浪）
```

播放時兩者可以同時 `true`；暫停時 timeline 停，波浪可選擇凍結或繼續。

### 2. Render loop 接入點

在 `main.js` 的 `loop()` 裡，**在 `vi.tick()` 之前**插入：

```js
tickTimeline(timeline, dt);
applyTimeline(timeline, params);
// 若 keyframe 改了結構性參數 → vi.markStructureDirty()
vi.tick(dt);
vi.render();
```

`applyTimeline` 目前只在 `time === 0` 且未播放時跳過；scrub 時要加 `force: true`。

### 3. 參數分級（效能考量）

| 等級 | 參數 | 每幀成本 | 建議 |
|------|------|----------|------|
| 🟢 輕量 | `shapeModifyFactor`, `cameraZoomValue`, `elementAngleDeg`, `shapePosX/Y` | 只更新 placement | **v1 優先** |
| 🟡 中等 | `fillColor`, `outlineColor` | `updateColors()` | v1.1 |
| 🔴 重量 | `pitch`, `svgPresetIndex`, `elementCopyEnabled` | 觸發 mesh rebuild | v2 或加 debounce |

預設 timeline 已有兩軌：`shapeModifyFactor`、`cameraZoomValue`——接入後立刻可見效果。

### 4. 時間軸資料模型擴充

現有格式夠用，建議補：

```ts
// 每個 keyframe
{ time: number, value: number, ease?: "linear" | "easeIn" | "easeOut" }

// 每條 track
{ id: string, keyframes: Keyframe[], enabled?: boolean }
```

顏色軌（v2）另開型別：`{ id: "fillColor", keyframes: [{ time, value: "#87CEEB" }] }`，用現有 `lerpHexColor`。

### 5. 可動畫參數清單

**已在預設 timeline 軌：**

- `shapeModifyFactor`（0–0.4）
- `cameraZoomValue`（0.4–2.5）

**高價值候選（`param-registry.js`）：**

- Element：`elementAngleDeg`, `baseScaleLength`, `baseScaleWidth`, `pitch`
- Shape：`shapeRotateFactor`, `shapePosX`, `shapePosY`, `params.speed`
- Randomness：`randomnessMultiply`
- Mouse：`mouseDirectionInfluence`, `scalingByMouseSensitivityLength/Width`
- Echo：`echoLayers`, `echoStep`, `echoOpacity`

**需特殊處理（非純數值）：**

- 顏色：`fillColor`, `outlineColor`, `elementGradientStops`
- 枚舉：`colorModeIndex`, `svgPresetIndex`, `elementOverlapMode`
- 布林：`elementUseGradient`, `elementCopyEnabled`

**尚未實作、不可動畫：**

- `enableSecondLayer`, `secondLayerPhase`, `secondPresetIndex`（params 有定義，renderer 未用）

---

## UI 規劃

### Phase 1 — Transport Bar（1–2 天）

在 footer 或 canvas 下方加精簡控制列，**不解鎖完整編輯器**：

```
[ ▶ / ⏸ ]  [ 0:00 ━━━●━━━━ 0:08 ]  [ 🔁 ]  [ 速度 1× ]
```

| 元件 | 行為 |
|------|------|
| Play/Pause | 切換 `timeline.playing` |
| Scrubber | 拖曳設定 `timeline.time`，`applyTimeline(..., force: true)` |
| Loop | 循環（`tickTimeline` 已有，加 UI toggle） |
| Speed | 調 timeline 播放速率（或沿用 `params.speed`） |

同時在 Design 面板加 **「路徑動態」** 區塊：

- 波浪開關（`params.playing`）
- 速度滑桿（`params.speed`）

### Phase 2 — Keyframe 錄製（2–3 天）

側欄參數旁加 **🔑 錄製按鈕**：

1. 時間軸播放中，拖 slider → 自動在當前時間插入 keyframe
2. 或「錄製模式」：改任何參數 → 自動寫入當前時間點
3. 顯示已錄製軌道列表（名稱 + keyframe 數量）

### Phase 3 — Timeline Editor（3–5 天）

解鎖 `#timeline-editor`，展開底部面板（設計稿約 200px）：

```
┌─────────────────────────────────────────┐
│  ▶  ⏮  ⏭   0:03.2 / 0:08.0            │
│  ━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  shapeModify  ●────────●──────●        │
│  zoom         ●──────────────────●     │
│  elementAngle      ●────●              │
└─────────────────────────────────────────┘
```

功能：

- 軌道列表 + 可視 keyframe 菱形
- 拖 keyframe 改時間 / 值
- 雙擊軌道新增 key
- 匯入 / 匯出 Timeline JSON（`timeline-io.js` 已有）

### Phase 4 — 輸出（1 天）

Setting 面板加：

- **錄製 WebM**：`CanvasRecorder` + timeline 從 0 播到 duration
- **匯出 PNG 幀序列**（可選）

---

## 實作順序

```
v0.1.4  接線 + Transport
  ├─ main.js 接入 tickTimeline / applyTimeline
  ├─ footer transport UI（播放 / scrub / 時間顯示）
  ├─ 解鎖 timeline-editor → 先開簡易面板，非完整編輯器
  └─ scrub 時同步側欄 slider 顯示

v0.1.5  Keyframe 錄製
  ├─ 參數旁「錄 key」按鈕
  ├─ 從 param-registry 產生可錄製參數白名單
  └─ 結構性參數變更時 markStructureDirty

v0.2.0  完整 Timeline Editor
  ├─ 多軌視覺化編輯
  ├─ easing 曲線
  ├─ 顏色軌
  └─ WebM 錄製 UI

v0.2.x  App Flow 場景（可選）
  └─ 時間軸上放 scene marker，或獨立「展演模式」
```

---

## 待決策事項

1. **動畫主體是什麼？**
   - 路徑波浪（程序）+ 參數 keyframe（時間軸）——建議兩者並存
   - 還是只要其中一種？

2. **第一版要不要完整編輯器？**
   - 建議：v0.1.4 只做 Transport + 預設 keyframe 可播可 scrub
   - 完整軌道編輯放到 v0.2

3. **錄製優先級？**
   - WebM 影片 vs 靜態 PNG/SVG vs 兩者都要

4. **與滑鼠感應的關係？**
   - 播放時滑鼠仍即時影響（互動展演）
   - 或播放時鎖定滑鼠，純時間軸驅動（可重現輸出）

---

## 風險與對策

| 風險 | 對策 |
|------|------|
| Scrub 時 UI 與 timeline 雙向同步打架 | timeline 為 source of truth；scrub 時暫停錄製 |
| `pitch` 動畫卡頓 | v1 不開放；或每 100ms debounce rebuild |
| `applyTimeline` 在 t=0 不套用 | scrub / import 後呼叫 `force: true` |
| README 寫了 timeline 但 UI 沒有 | Phase 1 完成後更新 CHANGELOG |

---

## 下一步（v0.1.4）

改動集中在：

- `src/main.js` — loop 接入 timeline
- `index.html` + `src/style.css` — footer transport
- `src/ui/timeline-transport.js`（新檔）— 播放控制邏輯
- `src/ui/i18n.js` — 雙語標籤

預估 **半天到 1 天**可看到：`shapeModify` 和 `zoom` 隨時間軸變化，並能播放 / 暫停 / 拖曳 scrub。
