# Implementation Plan: Portfolio Site

Spec: [docs/superpowers/specs/2026-10-13-portfolio-site-design.md](../docs/superpowers/specs/2026-10-13-portfolio-site-design.md)
Detailed tasks: [tasks/todo.md](todo.md)

## Overview

A single-page, space-themed portfolio built with Astro + TypeScript, deployed to GitHub Pages at `https://invictusstella.github.io` via GitHub Actions. English at `/` and Turkish at `/tr/`. A fixed Three.js canvas plays a continuous scroll-driven flight from a sun (hero), through deep space (about, skills, experience), to a star chart. On the chart, each GitHub repo tagged `portfolio` is an HTML star in one chronological constellation. Project data is fetched at build time; a daily scheduled build keeps it fresh.

## Architecture Decisions

- **Walking skeleton first.** The very first slice deploys a "hello" page live. Deployment is the least familiar part, so we hit its problems on day one, and every later task ships straight to a real URL.
- **Content before 3D.** The full page (both languages, projects included) works on a plain CSS gradient background before any WebGL exists. That gradient *is* the no-WebGL fallback, so the fallback is built and tested first instead of bolted on last.
- **Pure functions for logic.** GitHub mapping, constellation layout and the director's section-progress calculation are pure and unit-tested. 3D visuals are verified by eye.
- **Scene = director + chapters.** Each chapter (`sun`, `deepSpace`, `starField`) is its own module, so later redesigns replace chapters, not the scene.
- **No React.** Astro components + small TypeScript modules.

## Dependency Graph

```
T1 Scaffold
 └─ T2 Deploy pipeline ───────────────────────────────┐
     └─ T3 English page (hero/about/footer)            │
         ├─ T4 Timeline + CV button                    │
         ├─ T5 Turkish + toggle                        │
         │    └─ T8 Turkish project overrides ◄──┐     │
         ├─ T6 GitHub fetch → project list ◄─────┼─────┘ (CI token, cron)
         │    └─ T7 Constellation + cards ───────┘
         │         └─ T9 E2E smoke test (needs T5, T7)
         └─ T10 Scene skeleton (canvas, director, fallbacks)
              ├─ T11 Sun details
              │    └─ T14 Sunrise intro
              ├─ T12 deepSpace ─┐
              ├─ T13 starField ─┴─ T15 Lightspeed streaks
              └─ T16 Adaptive quality + perf pass (after T11–T15)
                   └─ T17 (optional) Prominences
```

T10 needs only T3 (sections to observe). The 3D track (T10–T13) can run in parallel with the projects track (T6–T9) if desired.

## Task List

### Phase 1 — Walking skeleton
- [x] T1: Scaffold Astro + TypeScript + Vitest
- [ ] T2: Deploy pipeline to GitHub Pages

### Checkpoint 1
- [ ] "Hello" page live at https://invictusstella.github.io, deployed by Actions

### Phase 2 — Content (no 3D)
- [ ] T3: English page: hero, about, footer on a gradient background
- [ ] T4: Experience timeline and CV button
- [ ] T5: Turkish version and language toggle

### Checkpoint 2
- [ ] Both languages live; full CV content readable; keyboard-navigable

### Phase 3 — Projects from GitHub
- [ ] T6: Fetch tagged repos at build time → plain project list; daily cron
- [ ] T7: Journey constellation with star links and cards
- [ ] T8: Turkish project description overrides
- [ ] T9: Playwright smoke test in CI

### Checkpoint 3
- [ ] Tag/untag a repo → site updates after "Run workflow"; all tests green in CI

### Phase 4 — The flight
- [ ] T10: Scene skeleton: canvas, director, camera flight, fallbacks
- [ ] T11: Sun surface details
- [ ] T12: deepSpace chapter
- [ ] T13: starField chapter

### Checkpoint 4
- [ ] Full flight sun → deep space → star chart works on desktop and phone; fallbacks verified

### Phase 5 — Cinematic polish
- [ ] T14: Sunrise intro
- [ ] T15: Lightspeed streaks
- [ ] T16: Adaptive quality and performance pass

### Checkpoint 5 — Complete
- [ ] All spec success criteria met; Lighthouse checked; ready to share

### Optional
- [ ] T17: Sun prominences / flares

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| First-time GitHub Pages / Actions setup fails in confusing ways | High | Done first (T2) with a trivial page; step-by-step walkthrough. |
| Scroll-driven WebGL janky on phones | High | Fallbacks built in T3/T10; DPR cap and pause in T10; adaptive quality in T16; test on a real phone at Checkpoint 4. |
| Sun shader harder than expected | Med | T10 ships a plain glowing sphere; T11 layers details one at a time, each kept only if it holds up. |
| HTML stars and SVG line misalign with the canvas on resize | Med | Stars and lines share one HTML/SVG layer, independent of the canvas; resize covered in the T7 manual check. |
| GitHub API outage during scheduled build | Low | Build fails, Pages keeps the last good deploy (spec §9). |
| Lightspeed effect causes motion sickness | Low | Capped length, transition zones only, off under reduced motion. |

## Open Questions (content needed from you; not blocking until the task that uses it)

- Bio, tagline, skills, hobbies and experience entries, in **both English and Turkish** (needed by T3–T5; placeholders until then).
- Photo (`me.jpg`) and CV (`cv.pdf`) (T3, T4).
- LinkedIn URL and contact email to show publicly (T3).
- Which existing repos to tag `portfolio` (T6; this site's own repo can be the first).
