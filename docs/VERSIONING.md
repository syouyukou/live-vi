# 版本維護

版本紀錄自 **0.1** 起寫入 [CHANGELOG.md](../CHANGELOG.md)，採 **0.1 → 0.1.1 → 0.1.2 …** 遞增（不用 `0.2.x`）。`0.1`、`0.1.1` 為回溯條目；自 **0.1.2** 起建議每個對外版本都有 Git tag。

## 版本號在哪裡

| 位置 | 用途 |
|------|------|
| `package.json` → `version` | 發布與對外顯示的主版本號 |
| `CHANGELOG.md` | **每個版本改了什麼**（必須更新） |
| Git tag `v0.1.2` 等 | 與 CHANGELOG 條目對應的永久標記 |
| `src/main.js` 等 UI 字串 | 若有「Ver. x.y.z」提示，需手動與 `package.json` 一致 |

## 發布新版本（建議流程）

1. 在 `CHANGELOG.md` 的 **`[Unreleased]`** 下累積變更（Added / Changed / Fixed / Removed）。
2. 準備發布時：
   - 將 `[Unreleased]` 內容移到新區塊 `## [0.1.x] — YYYY-MM-DD`。
   - 清空 `[Unreleased]` 各小節（可留空標題）。
   - 更新 `package.json` 的 `version`（例如 `0.1.2` → `0.1.3`）。
   - 更新 `CHANGELOG.md` 底部「版本對照」表格。
3. 提交並打 tag：

```bash
git add CHANGELOG.md package.json package-lock.json
git commit -m "Release 0.1.3: 簡短一句話"
git tag -a v0.1.3 -m "0.1.3"
git push && git push origin v0.1.3
```

## 版本號規則（本專案）

| 號碼 | 意義 | 範例 |
|------|------|------|
| **0.1** | 專案起步、最小可渲染 | 路徑 + InstancedMesh 雛形 |
| **0.1.1** | 首個完整 Composer 基線 | 側欄、時間軸、匯出 |
| **0.1.2+** | 在 0.1.1 上疊加的功能或修正 | 滑鼠方向跟隨 → `0.1.2` |

下一版通常為 `0.1.3`（小功能 / 修正），重大重構再討論是否改為 `0.2`。

## 類別說明（CHANGELOG）

| 類別 | 何時使用 |
|------|----------|
| **Added** | 新功能、新參數、新 UI |
| **Changed** | 既有行為或介面調整 |
| **Fixed** | 錯誤修正 |
| **Removed** | 刪除功能或參數 |
| **Infrastructure** | CI、Git、建置、依賴升級（可選小節） |

## 相關文件

- [CHANGELOG.md](../CHANGELOG.md) — 版本變更紀錄
- [ROADMAP.md](ROADMAP.md) — 尚未排進版本的規劃
