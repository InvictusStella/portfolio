# Tasks: Portfolio Site

Plan: [tasks/plan.md](plan.md) · Spec: [docs/superpowers/specs/2026-10-13-portfolio-site-design.md](../docs/superpowers/specs/2026-10-13-portfolio-site-design.md)

**Standard commands** (defined in T1):
- `npm run check` = `astro check` (types)
- `npm test` = `vitest run` (unit)
- `npm run build` = `astro build`
- `npm run test:e2e` = Playwright against the built site (added in T9)

---

## Phase 1 — Walking skeleton

### Task 1: Scaffold Astro + TypeScript + Vitest

**Description:** Create the Astro project (strict TypeScript) with a single "Hello" page, Vitest wired up with one trivial test, a `.gitattributes` to normalise line endings, and npm scripts for check/test/build.

**Acceptance criteria:**
- [x] `npm run dev` serves a "Hello" page locally
- [x] `npm run check`, `npm test`, `npm run build` all pass
- [x] `.gitattributes` sets `* text=auto eol=lf`; no CRLF warnings on commit

**Verification:**
- [x] Run all three commands; open `http://localhost:4321`

**Dependencies:** None
**Files likely touched:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/pages/index.astro`, `.gitattributes`
**Estimated scope:** S
**You'll learn:** how an Astro project is laid out; what npm scripts are.

### Task 2: Deploy pipeline to GitHub Pages

**Description:** Add a GitHub Actions workflow that runs check → test → build → deploy to Pages on push to `main` and on manual trigger. Sets Astro `site` + `base: "/portfolio"` (repo is `InvictusStella/portfolio`). Human step: set Pages source to "GitHub Actions".

**Acceptance criteria:**
- [ ] Pushing to `main` deploys the Hello page to https://invictusstella.github.io/portfolio/
- [ ] A failing test stops the deploy (verified once by intentionally breaking a test on a branch)
- [ ] "Run workflow" button works

**Verification:**
- [ ] Actions tab shows a green run; the live URL shows the page

**Dependencies:** T1
**Files likely touched:** `.github/workflows/deploy.yml`, `astro.config.mjs` (`site`)
**Estimated scope:** S
**You'll learn:** GitHub Actions workflows, jobs and steps; how Pages deploys.

## Checkpoint 1
- [ ] Hello page live via Actions
- [ ] Review with human before proceeding

---

## Phase 2 — Content (no 3D)

### Task 3: English page: hero, about, footer on a gradient background

**Description:** Create `profile.ts` (typed, every text `{ en, tr }`, placeholders allowed) and `ui.ts` labels. Build the hero, about (photo, bio, skill chips, hobbies) and edge footer (contact links) as Astro components on a deep-space CSS gradient background. That background is also the no-WebGL fallback.

**Acceptance criteria:**
- [ ] Page renders all sections from `profile.ts`; photo optimised via `astro:assets`
- [ ] Semantic heading order; text contrast passes (Lighthouse a11y ≥ 95)
- [ ] Layout works from 360 px to wide desktop with no horizontal scroll

**Verification:**
- [ ] `npm run check && npm test && npm run build`
- [ ] Manual: desktop + phone-width devtools; keyboard Tab through links

**Dependencies:** T2
**Files likely touched:** `src/content/profile.ts`, `src/i18n/ui.ts`, `src/components/Hero.astro`, `src/components/About.astro`, `src/components/Footer.astro`, `src/pages/index.astro`, `src/styles/global.css`
**Estimated scope:** M

### Task 4: Experience timeline and CV button

**Description:** Add the vertical experience timeline under About, and the fixed bottom-right `CV ↓` button that downloads `public/cv.pdf`.

**Acceptance criteria:**
- [ ] Timeline renders entries (role, place, dates, sentence) from `profile.ts`; looks fine with 1 entry
- [ ] CV button visible at every scroll position, downloads `cv.pdf`, has an accessible label
- [ ] Button doesn't cover content on phone widths

**Verification:**
- [ ] Build passes; manual click-to-download on desktop and phone width

**Dependencies:** T3
**Files likely touched:** `src/components/Timeline.astro`, `src/components/CvButton.astro`, `public/cv.pdf`, `src/pages/index.astro`
**Estimated scope:** S

### Task 5: Turkish version and language toggle

**Description:** Enable Astro i18n routing (`en` default at `/`, `tr` at `/tr/`). Share one page layout across both; set `<html lang>`. Add the top-right `EN | TR` toggle, which keeps the current `#section`.

**Acceptance criteria:**
- [ ] `/` is English, `/tr/` is Turkish, each with the correct `lang` attribute
- [ ] Removing a `tr` value from `profile.ts` makes `npm run check` fail
- [ ] Toggling while on `#about` lands on `#about` in the other language

**Verification:**
- [ ] `npm run check && npm run build`; inspect `dist/` contains both pages
- [ ] Manual toggle test in both directions

**Dependencies:** T3
**Files likely touched:** `astro.config.mjs`, `src/layouts/Page.astro`, `src/pages/index.astro`, `src/pages/tr/index.astro`, `src/components/LangToggle.astro`, `src/i18n/ui.ts`
**Estimated scope:** M

## Checkpoint 2
- [ ] Both languages live; full CV content readable; keyboard-navigable
- [ ] Review with human before proceeding

---

## Phase 3 — Projects from GitHub

### Task 6: Fetch tagged repos at build time → plain project list

**Description:** Implement `fetchProjects()` (GitHub REST, public repos with topic `portfolio`, optional `GITHUB_TOKEN`) and pure `toProject()` (map + sort by `created_at`). Render a simple project list in a Star chart section, which T7 replaces. Dev-only fallback to `projects.sample.json`; CI failure fails the build; warn when > 15. Add the daily cron to the workflow and pass `GITHUB_TOKEN`.

**Acceptance criteria:**
- [ ] Unit tests cover mapping, sorting, missing description/homepage
- [ ] Offline `npm run dev` uses sample data; in CI a fetch failure fails the build
- [ ] Tagging a repo and pressing "Run workflow" adds it to the live list

**Verification:**
- [ ] `npm test && npm run build`; manual tag/untag on GitHub + workflow run

**Dependencies:** T3 (section), T2 (workflow)
**Files likely touched:** `src/lib/github.ts`, `src/lib/github.test.ts`, `src/data/projects.sample.json`, `src/components/ProjectList.astro`, `.github/workflows/deploy.yml`
**Estimated scope:** M
**You'll learn:** calling a REST API, cron schedules, pure functions + tests.

### Task 7: Journey constellation with star links and cards

**Description:** Pure `layoutConstellation(projects) → positions` (deterministic; appending never moves existing stars). Replace the list with HTML `<a>` stars plus an SVG line in creation order. Hover/focus card (name, description, language, stars, repo + live links); tap-to-open on touch; zero-repo placeholder star; line draws in on scroll (static under reduced motion).

**Acceptance criteria:**
- [ ] Unit tests: same input → same output; appending keeps prior positions; 0, 1, 4, 15 projects all lay out within bounds
- [ ] Every star reachable with Tab; card opens on focus and hover; tap-then-follow works on touch
- [ ] Stars and line stay aligned on window resize

**Verification:**
- [ ] `npm test && npm run build`
- [ ] Manual: mouse, keyboard, phone emulation, resize, reduced-motion toggle in devtools

**Dependencies:** T6
**Files likely touched:** `src/lib/constellation.ts`, `src/lib/constellation.test.ts`, `src/components/StarChart.astro`, `src/components/ProjectCard.astro`, `src/scripts/star-chart.ts`
**Estimated scope:** M

### Task 8: Turkish project description overrides

**Description:** Optional `project-overrides.ts` mapping `repoName → { tr }`; the Turkish page uses the override and otherwise falls back to the GitHub text.

**Acceptance criteria:**
- [ ] Unit test: override used on `tr`, ignored on `en`, fallback when missing
- [ ] `/tr/` shows an overridden description for one real repo

**Verification:**
- [ ] `npm test && npm run build`; inspect `/tr/`

**Dependencies:** T5, T7
**Files likely touched:** `src/content/project-overrides.ts`, `src/lib/github.ts`, `src/lib/github.test.ts`
**Estimated scope:** XS

### Task 9: Playwright smoke test in CI

**Description:** One Playwright spec against the built site (`astro preview`): both languages load; toggle keeps the section; Tab reaches a star and its card shows; CV link targets `cv.pdf`. Add it as a step in the workflow before deploy.

**Acceptance criteria:**
- [ ] `npm run test:e2e` passes locally against sample data
- [ ] The CI run includes the e2e step; a failing e2e blocks the deploy

**Verification:**
- [ ] Local run + green Actions run

**Dependencies:** T5, T7
**Files likely touched:** `playwright.config.ts`, `e2e/smoke.spec.ts`, `package.json`, `.github/workflows/deploy.yml`
**Estimated scope:** S

## Checkpoint 3
- [ ] Tag/untag flow works end to end; all tests green in CI
- [ ] Review with human before proceeding

---

## Phase 4 — The flight

### Task 10: Scene skeleton: canvas, director, camera flight, fallbacks

**Description:** Fixed `<canvas>` behind the content; Three.js lazy-loaded after first paint. A director computes per-section progress (pure, unit-tested) and calls chapters. An eased camera flies outward from a **plain glowing sphere** sun. WebGL detection keeps the CSS gradient fallback; reduced motion renders one still frame; DPR capped at 2; rendering pauses when the tab is hidden or idle.

**Acceptance criteria:**
- [ ] Scrolling smoothly moves the camera away from the sun; text stays readable on top
- [ ] WebGL disabled (devtools/flag) → gradient fallback, no console errors
- [ ] Reduced motion → still frame, no animation loop running

**Verification:**
- [ ] `npm test` (director progress tests) and `npm run build`
- [ ] Manual: Chrome Performance panel shows no long frames while scrolling on desktop; check on a real phone

**Dependencies:** T3
**Files likely touched:** `src/scene/index.ts`, `src/scene/director.ts`, `src/scene/director.test.ts`, `src/scene/chapters/sun.ts`, `src/components/SceneCanvas.astro`
**Estimated scope:** M
**You'll learn:** the Three.js render loop, cameras, scroll-linked animation, easing.

### Task 11: Sun surface details

**Description:** Upgrade the sun's shader in order: granulation → limb darkening → corona shell → sunspots. Each step is kept only if it looks right and holds frame rate.

**Acceptance criteria:**
- [ ] All four effects visible and animated subtly
- [ ] No measurable frame-rate drop vs T10 on desktop; acceptable on phone

**Verification:**
- [ ] Manual visual check desktop + phone; Performance panel comparison

**Dependencies:** T10
**Files likely touched:** `src/scene/chapters/sun.ts`, `src/scene/shaders/sun.frag.glsl`, `src/scene/shaders/corona.frag.glsl`
**Estimated scope:** M
**You'll learn:** fragment shaders, noise functions.

### Task 12: deepSpace chapter

**Description:** Points-based dust/star field with depth parallax and a few soft nebula layers, active through the About section.

**Acceptance criteria:**
- [ ] Rendered in a single points draw call (plus nebula layers)
- [ ] Clear sense of depth while scrolling through About; text remains readable

**Verification:**
- [ ] Manual visual + Performance panel; `renderer.info.render.calls` stays low

**Dependencies:** T10
**Files likely touched:** `src/scene/chapters/deepSpace.ts`, `src/scene/index.ts`
**Estimated scope:** S

### Task 13: starField chapter

**Description:** A sparser, calmer points sky behind the star chart, so the HTML project stars stand out.

**Acceptance criteria:**
- [ ] Smooth handover from deepSpace to starField while scrolling
- [ ] Project stars and cards clearly stand out against it

**Verification:**
- [ ] Manual visual check desktop + phone

**Dependencies:** T10 (T12 for the handover)
**Files likely touched:** `src/scene/chapters/starField.ts`, `src/scene/index.ts`
**Estimated scope:** S

## Checkpoint 4
- [ ] Full flight works on desktop and a real phone; fallbacks re-verified; all tests green
- [ ] Review with human before proceeding

---

## Phase 5 — Cinematic polish

### Task 14: Sunrise intro

**Description:** On first load per session, the sun rises over ~2–2.5 s, then name and tagline fade in. Skipped by any scroll, click or key; skipped under reduced motion; not replayed on reload or language switch.

**Acceptance criteria:**
- [ ] Plays once per session; any input skips to the end state
- [ ] Hero text is in the HTML from the start (visible with JS disabled)

**Verification:**
- [ ] Manual: first load, reload, language switch, reduced motion, JS disabled

**Dependencies:** T11
**Files likely touched:** `src/scene/intro.ts`, `src/scene/chapters/sun.ts`, `src/components/Hero.astro`
**Estimated scope:** S

### Task 15: Lightspeed streaks

**Description:** In transition zones between sections, stretch particles into streaks scaled by (capped) scroll velocity, with slight FOV widening and edge chromatic shift. Off under reduced motion.

**Acceptance criteria:**
- [ ] Slow scroll = drift, fast flick = streaks; effect confined to transition zones
- [ ] Streak length capped; nothing under reduced motion

**Verification:**
- [ ] Manual: trackpad, mouse wheel and phone swipe; Performance panel

**Dependencies:** T12, T13
**Files likely touched:** `src/scene/effects/lightspeed.ts`, `src/scene/chapters/deepSpace.ts`, `src/scene/chapters/starField.ts`, `src/scene/director.ts`
**Estimated scope:** M

### Task 16: Adaptive quality and performance pass

**Description:** Lower particle counts when frame rate drops; Lighthouse audit of both languages and fix what it finds.

**Acceptance criteria:**
- [ ] Throttled CPU (4× in devtools) still scrolls without obvious jank
- [ ] Lighthouse (mobile): Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95

**Verification:**
- [ ] Lighthouse reports for `/` and `/tr/`; full test suite green

**Dependencies:** T11–T15
**Files likely touched:** `src/scene/quality.ts`, `src/scene/index.ts`, plus whatever Lighthouse flags
**Estimated scope:** S–M

## Checkpoint 5 — Complete
- [ ] All spec success criteria met (spec §1)
- [ ] Ready to share

---

## Optional

### Task 17: Sun prominences / flares

**Description:** Animated plasma arcs looping off the sun's limb.

**Acceptance criteria:**
- [ ] Visible on the hero without frame-rate regression from T16

**Verification:**
- [ ] Manual visual + Performance panel

**Dependencies:** T16
**Files likely touched:** `src/scene/chapters/sun.ts`, `src/scene/shaders/prominence.*`
**Estimated scope:** M
