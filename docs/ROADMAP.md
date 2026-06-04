# live-vi Roadmap

Planning informed by: **vi-composer-web**, **ui-ux-pro-max**, **web-design-guidelines**, **vercel-react-best-practices** (future React path).

## Current baseline

- Vite + Three.js instanced VI
- UI ~1:1 shell (3 columns + timeline)
- No text layer, no audio/gyro/mic

## Phase A — Polish (1–2 days) ✅ in progress

| Task | Priority | Status |
|------|----------|--------|
| a11y: focus-visible, pointer, reduced-motion | P0 | Done in CSS |
| Config import: strip unknown keys | P0 | Done |
| README + ROADMAP + design-system | P1 | Done |
| Param scroll height ~260px on large screens | P2 | Optional |
| Remove `.analysis-*.js` from repo | P2 | Recommended |

## Phase B — Fidelity (3–5 days)

| Task | Notes |
|------|--------|
| Collapsible animation match原站 | Radix-like chevron |
| Timeline keyframe UI | Visual keys on ruler, not only scrub |
| `sensorTypeIndex` wiring | If mimicking sensor modes without hardware |
| MediaPipe Hands | Optional; maps to `handPosX/Y` |
| Performance pass | Debounce mesh rebuild; profile `structureDirty` |

## Phase C — Platform (optional)

| Task | Notes |
|------|--------|
| Migrate to Next.js 15+ | Use `nextjs` + `shadcn` skills |
| React param panel | `vercel-react-best-practices` for state split |
| Deploy preview | `deploy-to-vercel` skill |
| Node graph editor | React Flow — large scope |

## Phase D — Out of scope unless requested

- Tone.js / microphone / gyroscope
- Typeface / dynamic typography
- Full App Flow authoring UI

## Skill usage cheat sheet

| When | Skill |
|------|--------|
| Any live-vi change | `vi-composer-web` (project) |
| UI review / a11y | `web-design-guidelines` |
| Visual audit checklist | `ui-ux-pro-max` + **MASTER.md** |
| Three.js API doubts | Context7 MCP `three` |
| React migration | `vercel-react-best-practices` |

## Installed skills (this machine)

**Global (Cursor):**

- `~/.agents/skills/vercel-react-best-practices`
- `~/.agents/skills/web-design-guidelines`
- `~/.cursor/skills/ui-ux-pro-max`

**Project (`live-vi/.agents/skills/`):**

- `web-design-guidelines`
- `vercel-react-best-practices` (if install succeeded)

**Project (`.cursor/skills/`):**

- `vi-composer-web`
