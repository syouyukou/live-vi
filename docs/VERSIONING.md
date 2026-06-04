# 版本維護

## 版本號在哪裡

| 位置 | 用途 |
|------|------|
| `package.json` → `version` | 發布與對外顯示的主版本號 |
| `CHANGELOG.md` | **每個版本改了什麼**（必須更新） |
| Git tag `vX.Y.Z` | 與 CHANGELOG 條目對應的永久標記 |
| `src/main.js` 等 UI 字串 | 若有「Ver. x.y.z」提示，需手動與 `package.json` 一致 |

## 發布新版本（建議流程）

1. 在 `CHANGELOG.md` 的 **`[Unreleased]`** 下累積變更（Added / Changed / Fixed / Removed）。
2. 準備發布時：
   - 將 `[Unreleased]` 內容移到新區塊 `## [X.Y.Z] — YYYY-MM-DD`。
   - 清空 `[Unreleased]` 各小節（可留空標題）。
   - 更新 `package.json` 的 `version`。
   - 更新 `CHANGELOG.md` 底部「版本對照」表格。
3. 提交並打 tag：

```bash
git add CHANGELOG.md package.json package-lock.json
git commit -m "Release vX.Y.Z: 簡短一句話"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push && git push origin vX.Y.Z
```

## 語意化版本（簡要）

- **MAJOR (x)**：不相容的參數 / 匯出格式變更。
- **MINOR (y)**：新功能，向後相容。
- **PATCH (z)**：錯誤修正、文案、樣式微調。

範例：新增滑鼠方向跟隨 → `0.2.0` → `0.2.1`（MINOR 下的 PATCH 或功能小版本，本專案採 `0.2.1`）。

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
