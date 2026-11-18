# Decisions made on the learner's behalf (overnight build, 2026-11-19 → 20)

The learner approved R1 and asked me to decide and keep going. Each decision here is reversible; review together.

| # | Decision | Why | Easy to change? |
|---|---|---|---|
| 1 | Vite 5 + React 18 + TypeScript, no router/state/CSS libraries; `idb-keyval` for recordings | Smallest stack that covers the spec; fewer moving parts to maintain | Yes |
| 2 | Hash routing, `base: './'` | Same build on Vercel and GitHub Pages, no rewrites | Yes |
| 3 | PWA via vite-plugin-pwa; audio cached max 7 days / 400 files | everyayah publishes no terms; keep cache short (spec U1) | Yes |
| 4 | Content review done by agents against published references, each item with its source and a status; items they can't settle are `needs-teacher` and show a badge | Learner asked for an agent review instead of a teacher review | — |
| 5 | Build order: R1 complete first; R2 only if time remains after the review round | "Ready for deployment" means R1 solid, not R2 half-done | — |
