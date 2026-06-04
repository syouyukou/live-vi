---
name: vi-composer-web
description: >-
  Builds and maintains LIVE VI Composer–style apps (Three.js instanced SVG paths,
  param sidebars, timeline, App Flow). Use for live-vi, autumn meteorite clones,
  generative VI tools, Fhc-style parameters, canvas export, or when the user
  mentions VI Composer, 流動的 creative code, or path/instance rendering.
---

# VI Composer Web

## Stack (this repo)

- **Vite 6** + vanilla JS (no React unless migrating)
- **Three.js** `SVGLoader` → path resample → `InstancedMesh` (length/width scale)
- UI: `.vi-*` layout mirroring [composer.autumnmeteorite.jp](https://composer.autumnmeteorite.jp/)

## Out of scope (unless user asks)

- Audio / Tone.js, microphone, gyroscope
- Typeface / Canvas text layer (removed from live-vi)
- Full node-graph IDE (only pipeline toggles)

## File map

| Path | Role |
|------|------|
| `src/engine/param-registry.js` | Fhc groups + EN/JA labels |
| `src/engine/params.js` | `defaultParams()` |
| `src/engine/renderer.js` | `ViRenderer`, layers, export |
| `src/ui/panel.js` | Sidebar collapsibles + sliders |
| `src/main.js` | Wiring, timeline, I/O |
| `docs/ROADMAP.md` | Phases and priorities |
| `design-system/MASTER.md` | Visual tokens (do not drift to pink chaos) |

## UI rules (1:1 reference)

- Shell: `#1f2937`, panels `border 2px #6b7280`
- Canvas top: **purple** `#a855f7`; node panel top: **teal** `#14b8a6`
- Canvas bg: `#f5f2eb`; sidebar: `#262626` / text `#ebebeb`
- Font: Geist, `font-weight: 300`, `font-feature-settings: "palt"`
- Param row: label `w-32` left, slider right, value `tabular-nums`
- Timeline footer: **200px** height, transport left 20%

## Adding a parameter

1. Add default in `params.js`
2. Register in `param-registry.js` (group, min/max/step, labels)
3. Use in `renderer.js` / modifiers if it affects visuals
4. Sidebar auto-builds from registry — no duplicate HTML

## Performance

- Mark `structureDirty` only when paths/units/preset change
- Slider `input` updates params every frame is OK; avoid rebuilding all meshes per slider tick
- Cap `devicePixelRatio` at 2 (already in renderer)

## Related skills

- `ui-ux-pro-max` — checklist only; **keep** autumn meteorite palette, not generic Gen-Z output
- `web-design-guidelines` — a11y (focus, contrast, reduced motion)
- `vercel-react-best-practices` — when migrating to Next/React

## Verification

```bash
npm run build
npm run dev
```

- Canvas shows instanced units on path
- Timeline scrub changes `shapeModifyFactor` / zoom keyframes
- Export PNG/SVG/JSON works
