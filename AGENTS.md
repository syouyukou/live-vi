# Agents — live-vi

Use skill **`vi-composer-web`** for all work in this repo.

## Quick context

- Clone of Autumn Meteorite **visual** VI (no audio, gyro, mic, **no text/typeface**).
- Params: `src/engine/param-registry.js` + `params.js`.
- Do not edit `dist/` or `.analysis-*.js`.

## Commands

```bash
npm run dev
npm run build
npm run test:smoke
```

After code changes, run `npm run test:smoke` before finishing (see `.cursor/rules/smoke-test.mdc`).

## Docs

- [CHANGELOG.md](CHANGELOG.md) — record every release under `[Unreleased]` then cut `## [x.y.z]`
- [docs/VERSIONING.md](docs/VERSIONING.md) — bump `package.json`, tag `v*`, push
- [docs/ROADMAP.md](docs/ROADMAP.md) — phases
- [design-system/MASTER.md](design-system/MASTER.md) — colors/layout
