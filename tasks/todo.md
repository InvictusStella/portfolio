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
- [x] Pushing to `main` deploys the Hello page to https://invictusstella.github.io/portfolio/
- [x] A failing test stops the deploy (verified once by intentionally breaking a test on a branch)
- [x] "Run workflow" button works

**Verification:**
- [x] Actions tab shows a green run; the live URL shows the page

**Dependencies:** T1
**Files likely touched:** `.github/workflows/deploy.yml`, `astro.config.mjs` (`site`)
**Estimated scope:** S
**You'll learn:** GitHub Actions workflows, jobs and steps; how Pages deploys.

## Checkpoint 1
- [x] Hello page live via Actions
- [ ] Review with human before proceeding

---

## Phase 2 — Content (no 3D)

### Task 3: English page: hero, about, footer on a gradient background

**Description:** Create `profile.ts` (typed, every text `{ en, tr }`, placeholders allowed) and `ui.ts` labels. Build the hero, about (photo, bio, skill chips, hobbies) and edge footer (contact links) as Astro components on a deep-space CSS gradient background. That background is also the no-WebGL fallback.

**Acceptance criteria:**
- [x] Page renders all sections from `profile.ts`; photo optimised via `astro:assets`
- [x] Semantic heading order; text contrast passes (Lighthouse a11y ≥ 95)
- [x] Layout works from 360 px to wide desktop with no horizontal scroll

**Verification:**
- [x] `npm run check && npm test && npm run build`
- [x] Manual: desktop + phone-width devtools; keyboard Tab through links

**Dependencies:** T2
**Files likely touched:** `src/content/profile.ts`, `src/i18n/ui.ts`, `src/components/Hero.astro`, `src/components/About.astro`, `src/components/Footer.astro`, `src/pages/index.astro`, `src/styles/global.css`
**Estimated scope:** M

### Task 4: Experience timeline and CV button

**Description:** Add the vertical experience timeline under About, and the fixed bottom-right `CV ↓` button that downloads `public/cv.pdf`.

**Acceptance criteria:**
- [x] Timeline renders entries (role, place, dates, sentence) from `profile.ts`; looks fine with 1 entry
- [x] CV button visible at every scroll position, downloads `cv.pdf`, has an accessible label
- [x] Button doesn't cover content on phone widths

**Verification:**
- [x] Build passes; manual click-to-download on desktop and phone width

**Dependencies:** T3
**Files likely touched:** `src/components/Timeline.astro`, `src/components/CvButton.astro`, `public/cv.pdf`, `src/pages/index.astro`
**Estimated scope:** S

### Task 5: Turkish version and language toggle

**Description:** Enable Astro i18n routing (`en` default at `/`, `tr` at `/tr/`). Share one page layout across both; set `<html lang>`. Add the top-right `EN | TR` toggle, which keeps the current `#section`.

**Acceptance criteria:**
- [x] `/` is English, `/tr/` is Turkish, each with the correct `lang` attribute
- [x] Removing a `tr` value from `profile.ts` makes `npm run check` fail
- [x] Toggling while on `#about` lands on `#about` in the other language

**Verification:**
- [x] `npm run check && npm run build`; inspect `dist/` contains both pages
- [x] Manual toggle test in both directions

**Dependencies:** T3
**Files likely touched:** `astro.config.mjs`, `src/layouts/Page.astro`, `src/pages/index.astro`, `src/pages/tr/index.astro`, `src/components/LangToggle.astro`, `src/i18n/ui.ts`
**Estimated scope:** M

## Checkpoint 2
- [x] Both languages live; full CV content readable; keyboard-navigable
- [x] Review with human before proceeding

---

## Phase 3 — The sun (moved ahead of projects: highest risk, and the centrepiece)

### Task 10: Scene skeleton: canvas, director, camera flight, fallbacks

**Description:** Fixed `<canvas>` behind the content; Three.js lazy-loaded after first paint. A director computes per-section progress (pure, unit-tested) and calls chapters. The hero becomes ~2 screens tall with a **pinned stage** (`position: sticky`); scrolling the extra screen is the **departure zone** (spec §5.4): name/tagline fade out over 0–30%, and an eased camera flies away from a **plain glowing sphere** sun, which stays whole and centred until it recedes. WebGL detection keeps the CSS gradient fallback; reduced motion or no WebGL → normal one-screen hero, one still frame; DPR capped at 2; rendering pauses when the tab is hidden or idle.

**Acceptance criteria:**
- [x] Sun stays pinned and whole through the departure zone; scrolling smoothly moves the camera away from it; text stays readable on top
- [x] Unit tests cover departure-zone progress (0 at hero top, 1 when About arrives; text fade over 0–0.3)
- [x] WebGL disabled (devtools/flag) → gradient fallback, no console errors
- [x] Reduced motion → still frame, no animation loop running

**Verification:**
- [x] `npm test` (director progress tests) and `npm run build`
- [x] Manual: Chrome Performance panel shows no long frames while scrolling on desktop
- [ ] Manual: check on a real phone (needs you)

**Dependencies:** T3
**Files likely touched:** `src/scene/index.ts`, `src/scene/director.ts`, `src/scene/director.test.ts`, `src/scene/chapters/sun.ts`, `src/components/SceneCanvas.astro`
**Estimated scope:** M
**You'll learn:** the Three.js render loop, cameras, scroll-linked animation, easing.

### Task 11: Sun surface details

**Description:** Upgrade the sun's shader in order: granulation → limb darkening → corona shell → sunspots. Each step is kept only if it looks right and holds frame rate.

**Acceptance criteria:**
- [x] All four effects visible and animated subtly
- [x] No measurable frame-rate drop vs T10 on desktop; acceptable on phone

**Verification:**
- [x] Manual visual check desktop; main-thread cost checked (animates only while the sun is on screen)
- [ ] Manual: check on a real phone (needs you)

**Dependencies:** T10
**Files likely touched:** `src/scene/chapters/sun.ts`, `src/scene/shaders/sun.frag.glsl`, `src/scene/shaders/corona.frag.glsl`
**Estimated scope:** M
**You'll learn:** fragment shaders, noise functions.

### Task 11b: Sun prominences and flares

**Description:** Make the sun feel alive: glowing plasma arcs looping off the limb that slowly rise and fade, plus occasional brighter flare bursts. Required — the sun is the site's centrepiece (spec §5.2).

**Acceptance criteria:**
- [x] Several prominences visible around the limb at any time, each animating over seconds (rise, arc, fade)
- [x] Occasional flare bursts; never so bright or frequent that the hero text loses contrast
- [x] No measurable frame-rate drop vs T11 on desktop; acceptable on phone

**Verification:**
- [x] Manual visual check desktop; main-thread cost checked; tagline contrast re-measured (>= 5.1:1)
- [ ] Manual: check on a real phone (needs you)

**Dependencies:** T11
**Files likely touched:** `src/scene/chapters/sun.ts`, `src/scene/shaders/prominence.vert.glsl`, `src/scene/shaders/prominence.frag.glsl`
**Estimated scope:** M

## Checkpoint 3 — The sun
- [ ] The sun is alive (surface, corona, flares), pinned through the departure zone, and stays whole; fallbacks verified on desktop and a real phone
- [ ] Review with human before proceeding

---

## Phase 4 — Projects from GitHub

### Task 6: Fetch tagged repos at build time → plain project list

**Description:** Implement `fetchProjects()` (GitHub REST, public repos with topic `portfolio`, optional `GITHUB_TOKEN`) and pure `toProject()` (map + sort by `created_at`). Render a simple project list in a Star chart section, which T7 replaces. Dev-only fallback to `projects.sample.json`; CI failure fails the build; warn when > 15. Add the daily cron to the workflow and pass `GITHUB_TOKEN`.

**Acceptance criteria:**
- [x] Unit tests cover mapping, sorting, missing description/homepage
- [x] Offline `npm run dev` uses sample data; in CI a fetch failure fails the build
- [ ] Tagging a repo and pressing "Run workflow" adds it to the live list (needs you to tag a repo)

**Verification:**
- [x] `npm test && npm run build`
- [ ] Manual tag/untag on GitHub + workflow run (needs you)

**Dependencies:** T3 (section), T2 (workflow)
**Files likely touched:** `src/lib/github.ts`, `src/lib/github.test.ts`, `src/data/projects.sample.json`, `src/components/ProjectList.astro`, `.github/workflows/deploy.yml`
**Estimated scope:** M
**You'll learn:** calling a REST API, cron schedules, pure functions + tests.

### Task 7: Journey constellation with star links and cards

**Description:** Pure `layoutConstellation(projects) → positions` (deterministic; appending never moves existing stars). Replace the list with HTML `<a>` stars plus an SVG line in creation order. Hover/focus card (name, description, language, stars, repo + live links); tap-to-open on touch; zero-repo placeholder star; line draws in on scroll (static under reduced motion).

**Acceptance criteria:**
- [x] Unit tests: same input → same output; appending keeps prior positions; 0, 1, 4, 15 projects all lay out within bounds
- [x] Every star reachable with Tab; card opens on focus and hover; tap-then-follow works on touch
- [x] Stars and line stay aligned on window resize

**Verification:**
- [x] `npm test && npm run build`
- [x] Manual: mouse, keyboard, phone emulation, resize, reduced-motion toggle in devtools

**Dependencies:** T6
**Files likely touched:** `src/lib/constellation.ts`, `src/lib/constellation.test.ts`, `src/components/StarChart.astro`, `src/components/ProjectCard.astro`, `src/scripts/star-chart.ts`
**Estimated scope:** M

### Task 8: Turkish project description overrides

**Description:** Optional `project-overrides.ts` mapping `repoName → { tr }`; the Turkish page uses the override and otherwise falls back to the GitHub text.

**Acceptance criteria:**
- [x] Unit test: override used on `tr`, ignored on `en`, fallback when missing
- [x] `/tr/` shows an overridden description (verified with sample data; no real repos tagged yet)

**Verification:**
- [x] `npm test && npm run build`; inspect `/tr/`

**Dependencies:** T5, T7
**Files likely touched:** `src/content/project-overrides.ts`, `src/lib/github.ts`, `src/lib/github.test.ts`
**Estimated scope:** XS

### Task 9: Playwright smoke test in CI

**Description:** One Playwright spec against the built site (`astro preview`): both languages load; toggle keeps the section; Tab reaches a star and its card shows; CV link targets `cv.pdf`. Add it as a step in the workflow before deploy.

**Acceptance criteria:**
- [x] `npm run test:e2e` passes locally against sample data
- [x] The CI run includes the e2e step; a failing e2e blocks the deploy

**Verification:**
- [x] Local run + green Actions run

**Dependencies:** T5, T7
**Files likely touched:** `playwright.config.ts`, `e2e/smoke.spec.ts`, `package.json`, `.github/workflows/deploy.yml`
**Estimated scope:** S

## Checkpoint 4
- [ ] Tag/untag flow works end to end; all tests green in CI
- [ ] Review with human before proceeding

---

## Phase 5 — The rest of the flight

### Task 12: deepSpace chapter

**Description:** Points-based dust/star field with depth parallax and a few soft nebula layers, active through the About section.

**Acceptance criteria:**
- [x] Rendered in a single points draw call (plus nebula layers)
- [x] Clear sense of depth while scrolling through About; text remains readable

**Verification:**
- [x] Manual visual + Performance panel; `renderer.info.render.calls` stays low

**Dependencies:** T10
**Files likely touched:** `src/scene/chapters/deepSpace.ts`, `src/scene/index.ts`
**Estimated scope:** S

### Task 13: starField chapter

**Description:** A sparser, calmer points sky behind the star chart, so the HTML project stars stand out.

**Acceptance criteria:**
- [x] Smooth handover from deepSpace to starField while scrolling
- [x] Project stars and cards clearly stand out against it

**Verification:**
- [x] Manual visual check desktop + phone

**Dependencies:** T10 (T12 for the handover)
**Files likely touched:** `src/scene/chapters/starField.ts`, `src/scene/index.ts`
**Estimated scope:** S

## Checkpoint 5
- [ ] Full flight sun → deep space → star chart works on desktop and a real phone; fallbacks re-verified; all tests green
- [ ] Review with human before proceeding

---

## Phase 6 — Cinematic polish

### Task 14: Sunrise intro

**Description:** On first load per session, the sun rises over ~2–2.5 s, then name and tagline fade in. Skipped by any scroll, click or key; skipped under reduced motion; not replayed on reload or language switch.

**Acceptance criteria:**
- [x] Plays once per session; any input skips to the end state
- [x] Hero text is in the HTML from the start (visible with JS disabled)

**Verification:**
- [x] Manual: first load, reload, language switch, reduced motion, JS disabled

**Dependencies:** T11
**Files likely touched:** `src/scene/intro.ts`, `src/scene/chapters/sun.ts`, `src/components/Hero.astro`
**Estimated scope:** S

### Task 15: Lightspeed streaks

**Description:** Two lightspeed jumps (spec §5.4): a **big** one through the hero's departure zone (30–100%) into About, and a **small** one between About and the star chart. Particles stretch into streaks scaled by (capped) scroll velocity, with slight FOV widening and edge chromatic shift. Off under reduced motion.

**Acceptance criteria:**
- [x] Hero → About jump is clearly bigger (longer, stronger streaks) than About → Star chart
- [x] Slow scroll = drift, fast flick = streaks; effect confined to the two jump zones
- [x] Streak length capped; nothing under reduced motion

**Verification:**
- [x] Manual: simulated fast/slow scrolls in Chrome (both zones)
- [ ] Manual: trackpad, mouse wheel and a real phone swipe (needs you)

**Dependencies:** T12, T13
**Files likely touched:** `src/scene/effects/lightspeed.ts`, `src/scene/chapters/deepSpace.ts`, `src/scene/chapters/starField.ts`, `src/scene/director.ts`
**Estimated scope:** M

### Task 16: Adaptive quality and performance pass

**Description:** Lower particle counts when frame rate drops; Lighthouse audit of both languages and fix what it finds.

**Acceptance criteria:**
- [ ] Throttled CPU (4× in devtools) still scrolls without obvious jank — DEFERRED with adaptive quality: owner prefers realism over performance limits; decide in the polish discussion
- [x] Lighthouse (mobile): Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 (measured: / 95–97 · 100 · 100 · 100; /tr/ 99 · 100 · 100 · 100)

**Verification:**
- [x] Lighthouse reports for `/` and `/tr/`; full test suite green

**Dependencies:** T11, T11b, T12–T15
**Files likely touched:** `src/scene/quality.ts`, `src/scene/index.ts`, plus whatever Lighthouse flags
**Estimated scope:** S–M

## Checkpoint 6 — Complete
- [ ] All spec success criteria met (spec §1)
- [ ] Ready to share

---

## Phase 7 — Realism polish (spec §12)

### Task P1: Star chart as Scorpius
**Acceptance criteria:**
- [x] Projects take Scorpius's 15 main stars in order (stinger → claws), positioned from real coordinates
- [x] Figure segments appear only when both stars exist; the claws branch from Dschubba
- [x] Appending never moves stars; more than 15 projects still lay out (seeded extras near the figure)
**Verification:** unit tests (layout, segments); visual check at 4, 11 and 15 projects
**Files:** `src/lib/constellation.ts` (+test), `src/components/StarChart.astro`

### Task P2: Sun surface from a real SDO image
**Acceptance criteria:**
- [x] A licence-checked SDO image textures the sun's face; credited (P7)
- [x] Animated: slow flow distortion, flickering active regions; never looks like a still photo
- [x] Hero text ≥ 4.5:1 contrast (re-measured)
**Files:** `public/textures/`, `src/scene/chapters/sun.ts`, `src/components/Hero.astro`

### Task P3: Bloom
**Acceptance criteria:**
- [x] Bright regions, flares and stars glare softly; text unaffected (it's HTML)
**Files:** `src/scene/index.ts`

### Task P4: Prominences v2
**Acceptance criteria:**
- [x] At least three kinds: evolving loops with flowing plasma, eruptive arcs that lift off and dissolve, short jets
- [x] Shapes change over time (no static arcs); still nothing within 25° of horizontal
**Files:** `src/scene/activity.ts` (+test), `src/scene/chapters/prominences.ts`

### Task P5: Real photography for space
**Acceptance criteria:**
- [x] Licence-checked deep-sky star field and 2–3 nebula photos as parallax depth layers; credited
- [x] Procedural stars brighter, the brightest with diffraction spikes, subtle twinkle
- [x] About text contrast re-measured
**Files:** `public/textures/`, `src/scene/chapters/deepSpace.ts`

### Task P6: Warp jumps, triggered
**Acceptance criteria:**
- [x] Crossing the departure point (down) plays a ~1.6 s warp; entering the chart plays a ~0.9 s one — at any scroll speed
- [x] Anticipation stretch → outward blue-white streak burst → flash → settle (Star Wars / Mass Effect feel)
- [x] Off with reduced motion; trigger and timing logic unit-tested
**Files:** `src/scene/warp.ts` (+test), `src/scene/effects/streaks.ts`, `src/scene/index.ts`

### Task P7: Credits
**Acceptance criteria:**
- [x] Footer credits line in both languages; `docs/credits.md` lists each file's source URL and licence

### Task P8: Re-check
**Acceptance criteria:**
- [x] Hero and About contrast ≥ 4.5:1 (hero 5.0–6.3:1, About 4.9–8.3:1, hint ≥ 10.6:1)
- [x] Lighthouse accessibility/best practices/SEO 100 on / and /tr/ (performance 73–79: the accepted cost of realism; LCP is mostly the first-visit sunrise intro)
- [ ] Owner checks on a real phone (needs you)
