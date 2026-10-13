# Portfolio Site — Design Spec

**Date:** 2026-10-13
**Owner:** InvictusStella
**Status:** Approved in brainstorming, awaiting written-spec review

## 1. Purpose

A personal portfolio site for a newly graduated software engineer. It is three things at once:

1. **A creative playground** — experimental, space-themed visuals (a continuous WebGL "flight" away from a sun).
2. **A clear CV** — a recruiter can find who I am, my skills, experience and CV quickly.
3. **A learning project** — I build and deploy it myself, end to end.

**Success looks like:**
- The site is live at `https://invictusstella.github.io` in English and Turkish.
- Tagging a GitHub repo `portfolio` makes it appear on the star chart within 24 hours, with no code change.
- A recruiter can download the CV in one click from anywhere on the page.
- The page is readable and usable with no WebGL, with reduced motion, and by keyboard.

**Out of scope (for now):** a backend, a CMS, a blog, a contact form, analytics, a custom domain, a Turkish CV, React.

## 2. Stack and hosting

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro** + **TypeScript** | Outputs static HTML (fits GitHub Pages); ships no JS unless asked. |
| 3D | **Three.js** (plain, no React) | Only one canvas and a few interactive bits; React would add a layer without solving a problem. |
| Hosting | **GitHub Pages**, repo `InvictusStella.github.io` | Free; that repo name serves at the root address. |
| CI/CD | **GitHub Actions** | Builds, tests and deploys; also refreshes project data on a schedule. |
| Tests | **Vitest** (unit), **Playwright** (one smoke test), `astro check` (types) | Proportionate to project size. |

**Rebuild triggers** (one workflow): push to `main`, daily cron, manual "Run workflow".

## 3. Page structure

A single continuous page. A fixed WebGL `<canvas>` sits behind all content; content is ordinary HTML that scrolls over it.

1. **Hero** — name, one-line tagline, "scroll ↓" hint, over the sun. Plays the sunrise intro (§5.3).
2. **About** — photo, about-me paragraph, skills (labelled chips, no percentage bars), hobbies, then an **experience timeline** (vertical line; each entry: role, place, dates, one sentence).
3. **Star chart** — short heading, then the **journey constellation** (§4).
4. **Edge footer** — contact links (GitHub, LinkedIn, email) and a one-line sign-off.

**Fixed UI (always visible):**
- `EN | TR` language toggle — top-right.
- `CV ↓` button — bottom-right, direct download of `public/cv.pdf` (English, used on both language versions).

**Accessibility baseline:** semantic heading order; every star is a focusable `<a>`; cards open on hover **and** keyboard focus; text blocks get a subtle dark backing where contrast needs it; `prefers-reduced-motion` is respected throughout (§5.5).

## 4. Star chart — journey constellation

- Shows **only public repos tagged `portfolio`** (intended maximum ~15, hand-picked).
- All projects form **one constellation**, joined by a single line **in order of repo creation date** (first → latest). No grouping by language or topic.
- Each star is an **HTML `<a>` element styled as a star** (not drawn in WebGL). Connecting lines are an **SVG overlay** in the same layer so they always align. The line draws itself when the chart scrolls into view.
- **Hover / focus card:** name, description, primary language, star count, links to the repo and (if set) the live homepage.
- **Touch:** first tap opens the card, second tap follows the link.
- **Stable layout:** positions come from a pure function `layoutConstellation(orderedProjects) → positions`. Same input ⇒ same output; appending a project must not move existing stars.

## 5. The 3D scene

### 5.1 Architecture: director + chapters

- One Three.js scene, one camera, one fixed canvas.
- A **director** observes the page sections and computes, **per section**, a progress value 0 → 1 (per-section, not whole-page %, so content length changes don't desync animation).
- **Chapters** are independent modules, each owning its objects and reacting to the progress of the sections it is bound to:

| Chapter | Draws | Technique |
|---|---|---|
| `sun` | The sun (hero) | Sphere + noise fragment shader; glow sprite; no bloom post-processing. |
| `deepSpace` | Dust/stars with depth, faint nebula (about) | One instanced/points draw call; a few soft nebula layers; parallax from camera motion. |
| `starField` | Dim, calm sky behind the constellation | Same points technique, sparser. |

- The **camera flies outward** from the sun as you scroll; movement is **eased** (damped toward the target), not stepped.
- Chapters are swappable: a future redesign may keep `sun` and replace the rest with separate cross-faded scenes without touching the director.

### 5.2 Sun detail (in order)

1. Surface granulation (animated noise).
2. Limb darkening (edges darker/redder).
3. Corona (slightly larger rim-glow shell, slowly shifting).
4. Sunspots (a few slow dark patches).
5. *(Later, optional task)* Prominences / flares.

Build order within the task: plain glowing sphere first, then add 1–4.

### 5.3 Sunrise intro

- On first load the camera starts low and the sun rises into view over ~2–2.5 s; then name and tagline fade in.
- Skipped instantly by any scroll, click or key press.
- Plays **once per visit** (session storage) — not replayed on language switch or reload.
- Skipped entirely under reduced motion.
- Content is present in the HTML from the start; the intro only animates its reveal.

### 5.4 Lightspeed transitions

- In the transition zones between sections, the existing particles are **stretched into streaks** along the travel direction, scaled by **scroll velocity**; slight FOV widening and a faint chromatic shift at the edges.
- Streak length is **capped**, and the effect is limited to transition zones (motion-sickness guard).
- Disabled under reduced motion.

### 5.5 Performance and fallbacks

- Text and layout render first; Three.js (~150 KB gz) loads after.
- Device pixel ratio capped (≤ 2).
- Rendering pauses when the tab is hidden or nothing is animating.
- Adaptive quality: particle count drops if frame rate falls.
- **No WebGL:** CSS gradient background; all content and interactions still work.
- **Reduced motion:** a single still frame of the scene; no intro, flight or streaks.

## 6. Internationalisation (EN / TR)

- Two static versions via Astro i18n routing: **English at `/`** (default), **Turkish at `/tr/`**.
- `<html lang>` set correctly per page. No automatic redirect by browser language.
- The toggle preserves the current section (e.g. `#projects` → `/tr/#projects`).
- **Hand-written content** lives in `src/content/profile.ts` with every text as `{ en, tr }`. The types require both, so a missing translation fails the build.
- **UI labels** ("Projects", "Download CV", "Live site", …) live in a small dictionary file, also `{ en, tr }`.
- **Project descriptions** come from GitHub (single language) and show as-is in both versions. An optional overrides file maps `repoName → { tr }` for Turkish descriptions; missing entries fall back to the GitHub text.

## 7. Content and assets

| What | Where |
|---|---|
| Name, tagline, bio, skills, hobbies, experience, contact links | `src/content/profile.ts` |
| UI label translations | `src/i18n/ui.ts` |
| Optional Turkish project descriptions | `src/content/project-overrides.ts` |
| Photo | `src/assets/me.jpg` (optimised by Astro) |
| CV | `public/cv.pdf` |
| Dev-only sample projects | `src/data/projects.sample.json` |

## 8. Data flow (build time only)

```
GitHub REST API ─► fetchProjects() ─► toProject() ─► layoutConstellation() ─► HTML stars + SVG line
(public repos,      (raw repos)        (our shape,      (ordered list →
 topic: portfolio)                      sorted by        stable x,y)
                                        created_at)
```

- Fields used: name, description, primary language, stargazers count, created_at, homepage, html_url, topics.
- In CI the request is authenticated with the workflow's built-in `GITHUB_TOKEN` (no secrets to manage). Locally an optional `GITHUB_TOKEN` env var may be set.
- Each step is a **pure function**, unit-tested in isolation.

## 9. Error handling

| Situation | Behaviour |
|---|---|
| GitHub API fails during a CI build | **Build fails**; Pages keeps serving the last good deploy; the failed run is visible in the Actions tab. |
| Local dev with no network / fetch fails | Fall back to `projects.sample.json` (dev only, never in CI). |
| Repo has no description | Card shows language and links only. |
| Repo has no homepage | "Live site" link hidden. |
| Zero tagged repos | A single placeholder star: "First project coming soon." |
| More than 15 tagged repos | Works; build log prints a warning. |
| Missing Turkish string | Type error → build fails. |

## 10. Testing and verification

- **Unit (Vitest):** repo → project mapping; constellation layout (deterministic; appending doesn't move existing stars); Turkish override fallback.
- **Types:** `astro check`.
- **E2E smoke (Playwright, against the built site):** both languages load; toggle keeps the section; Tab reaches a star and opens its card; CV link targets `cv.pdf`.
- **Manual (per visual task):** checklist on desktop and phone; Lighthouse performance check.
- **Pipeline:** every push runs type check → tests → build → deploy. Any failure stops the deploy.

## 11. Future (explicitly not now)

- Sun prominences / flares (optional task after the core is done).
- Replace non-hero chapters with separate cross-faded scenes.
- Turkish CV (`cv-tr.pdf`) chosen by page language.
- Custom domain.
