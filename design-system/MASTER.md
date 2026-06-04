# live-vi Design System (MASTER)

Reference: [Autumn Meteorite VI Composer](https://composer.autumnmeteorite.jp/).  
ui-ux-pro-max was consulted; **this file overrides** generic “Gen Z chaos” suggestions.

## Layout

| Zone | Width | Notes |
|------|-------|--------|
| Params sidebar | 20% (200–320px) | Scroll, collapsible groups |
| Canvas | flex 1 | Purple 4px top border |
| Node panel | 20% (180–280px) | Teal 4px top border |
| Timeline | 100% × 200px | Transport 20% + track |

## Colors

| Token | Value | Use |
|-------|-------|-----|
| `--gray-800` | `#1f2937` | App shell |
| `--sidebar` | `#262626` | Params + timeline chrome |
| `--foreground` | `#ebebeb` | UI text (dark theme) |
| `--background` | `#121212` | Inputs on dark |
| Canvas paper | `#f5f2eb` | WebGL clear / stage |
| Accent purple | `#a855f7` | Canvas panel top |
| Accent teal | `#14b8a6` | Node panel top |
| Slider hover | `#22d3ee` | Thumb active |

## Typography

- **Geist** (CDN), weight 300 default, 500 for titles
- Japanese labels: secondary line 10px, opacity ~40%
- Numbers: `tabular-nums`

## Components

- **Slider**: 6px track, 14px round thumb, gray → cyan on hover
- **Switch**: 36×20 pill, cyan when on
- **Button**: `.vi-btn` / `.vi-btn-ghost`, min height 26px

## Accessibility (web-design-guidelines)

- [ ] `cursor: pointer` on all clickables
- [ ] `:focus-visible` ring on buttons, sliders, selects
- [ ] `prefers-reduced-motion`: disable timeline auto-play feel / shorten transitions
- [ ] Contrast: sidebar text on `#262626` ≥ 4.5:1
- [ ] Breakpoints: 960px stack columns

## Anti-patterns

- Do not add marketing hero sections inside the tool shell
- Do not replace Geist with Syne/Manrope for this clone
- Do not reintroduce typeface layer without explicit request
