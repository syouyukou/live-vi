# LIVE VI Composer

對齊 [Autumn Meteorite VI Composer](https://composer.autumnmeteorite.jp/) 的圖像功能（**不含**陀螺儀、音訊、麥克風、**文字層**）。

## 啟動

```bash
npm install
npm run dev
```

## Agent / Skills

| 位置 | Skill |
|------|--------|
| 專案 `.cursor/skills/vi-composer-web` | 本 repo 開發 SOP |
| 專案 `.agents/skills/` | `web-design-guidelines`, `vercel-react-best-practices` |
| 全域 `~/.cursor/skills/ui-ux-pro-max` | UI 檢查清單（配色以 `design-system/MASTER.md` 為準） |
| 全域 `~/.agents/skills/` | 同上 Vercel skills |

見 [AGENTS.md](AGENTS.md)、[docs/ROADMAP.md](docs/ROADMAP.md)。

## 已實作

| 類別 | 功能 |
|------|------|
| 元素 | 角度、長度、寬度、Pitch、線寬 |
| 形狀 | shapeModify、rotate、位移、縮放 |
| 預設 | `svgPresetIndex` 內建 4 組路徑+符號 |
| 隨機 | 感度、長/寬分軸、shared scale direction |
| 滑鼠 | 長/寬 scaling、移動方向跟隨旋轉 |
| 手勢 | handPos + 跟隨游標（無攝影機） |
| 色彩 | 5 種 colorMode |
| 堆疊 | 雙重符號第二層 |
| 路徑 | 上傳 SVG、貝茲編輯 |
| 腳本 | 右欄拖放 **Timeline JSON** / **Config JSON**（對齊原站 Import & Export） |
| 時間軸 | 播放 / scrub / keyframe 插值、Timeline 匯入匯出 |
| 場景 | App Flow 切換 |
| 節點 | 管線開關（簡化版） |
| 匯出 | PNG、SVG、WebM 錄影、JSON 設定 |

## 刻意未做

- 陀螺儀、音訊、麥克風
- 字型 / Typeface 文字層
- 完整可拖曳節點圖 IDE
- MediaPipe 手部追蹤（游標模擬 handPos）

## 架構

```
src/engine/   渲染與邏輯
src/ui/       面板產生
src/main.js   整合
design-system/  視覺規格
docs/ROADMAP.md  階段規劃
```
