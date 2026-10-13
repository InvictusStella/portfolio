import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BOUNDS, createDeepSpace } from './chapters/deepSpace';
import { createSun, SUN_RADIUS } from './chapters/sun';
import {
	cameraDistanceForDiameter,
	chartCalm,
	damp,
	deepSpaceOpacity,
	departureProgress,
	shouldAnimate,
	sunOnScreen,
	sunlightOpacity,
	sunScale,
	sunScreenY,
	textOpacity,
} from './director';
import { createStreaks } from './effects/streaks';
import { INTRO_PLAYED_KEY, introState } from './intro';
import {
	BEGIN_SECONDS,
	crossedDown,
	RETURN_SECONDS,
	scrollDrive,
	travelScroll,
	WARP,
	WARP_ZONE,
	warpProgress,
	warpStateAt,
	type WarpState,
} from './warp';

const FOV = 45;
/** How quickly the scene catches up with the scroll position (higher = snappier). */
const EASE = 5;

export async function startScene(canvas: HTMLCanvasElement) {
	const root = document.documentElement;
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const hero = document.querySelector<HTMLElement>('.hero')!;
	const stage = hero.querySelector<HTMLElement>('.hero__stage')!;
	const cssSun = hero.querySelector<HTMLElement>('.hero__sun')!;
	const projects = document.getElementById('projects');

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	// Our shaders already output display-ready colours: don't convert them again.
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2000);

	// Bloom: the brightest parts (active regions, flares, prominences, bright stars) glare softly.
	// Only light above the threshold glows, so the sun's darker surface stays crisp.
	const composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));
	const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.45, 0.72);
	composer.addPass(bloom);
	const small = innerWidth < 640;
	// Its photos load in the background; draw again as each one arrives — but only once the
	// scene has drawn its first frame (a photo can arrive while start-up is still running).
	let started = false;
	const deepSpace = createDeepSpace({
		small,
		base: import.meta.env.BASE_URL,
		onLoad: () => {
			if (started) draw();
		},
	});
	scene.add(deepSpace.object);
	// Lightspeed streaks live inside the deep-space group, so they drift with it.
	const streaks = createStreaks({ small, bounds: BOUNDS });
	deepSpace.object.add(streaks.object);
	// The sun's face: a real SDO image, loaded before the first frame.
	const sunMap = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}textures/sun-sdo-304.webp`);
	sunMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
	const sun = createSun(sunMap);
	scene.add(sun.object);

	// Where the CSS sun is drawn (in px, as if the hero were at the top of the page).
	let start = { x: 0, y: 0, diameter: 1 };
	let startDistance = 10;
	let progress = 0;
	/** Page scroll in px, eased like the departure so the star field glides. */
	let scrolled = 0;
	// The warp. Either scroll-driven (leaving the sun: it advances by the clock or the scroll,
	// whichever is further) or timed (the "begin" and "Return to Sun" buttons).
	const IDLE: WarpState = { stretch: 0, fov: 0, flash: 0, done: true };
	let warp: { start: number; duration: number; scrollDriven: boolean } | null = null;
	let warpNow = IDLE;
	let lastDeparture = 0;
	// A button journey: the page glides to a destination in step with a timed warp.
	let travel: { from: number; to: number; start: number; duration: number; destination: HTMLElement } | null = null;

	function layout() {
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		renderer.setSize(width, height, false);
		composer.setPixelRatio(renderer.getPixelRatio());
		composer.setSize(width, height);
		deepSpace.setPixelRatio(renderer.getPixelRatio());
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		const sunBox = cssSun.getBoundingClientRect();
		const stageBox = stage.getBoundingClientRect();
		start = {
			x: sunBox.left + sunBox.width / 2,
			y: sunBox.top - stageBox.top + sunBox.height / 2,
			diameter: sunBox.width,
		};
		startDistance = cameraDistanceForDiameter(SUN_RADIUS, FOV, height, start.diameter);
	}

	function targetProgress() {
		const box = hero.getBoundingClientRect();
		return departureProgress(box.top, box.height, innerHeight);
	}

	/** Place camera and sun for a given departure progress, update the page, and render. */
	function draw() {
		const height = canvas.clientHeight;
		const width = canvas.clientWidth;

		// Flying away: the camera backs off so the sun appears sunScale() times its start size.
		// Where the projects section is at the eased scroll position (not the raw one).
		const projectsTop = projects ? projects.getBoundingClientRect().top + (scrollY - scrolled) : Infinity;
		// The view tightens, then widens sharply, during a warp.
		const fov = FOV + warpNow.fov;
		camera.fov = fov;
		camera.updateProjectionMatrix();

		const distance = startDistance / sunScale(progress);
		camera.position.set(0, 0, distance);

		// Convert the sun's wanted screen position into world units at that distance.
		const pixelsPerUnit = height / 2 / (distance * Math.tan((fov * Math.PI) / 360));
		// During the sunrise intro the sun starts below the screen (corona included) and rises.
		const below = height - start.y + start.diameter * 1.3;
		const screenY = sunScreenY(progress, start.y, start.diameter) + (1 - introRise) * below;
		sun.object.position.set((start.x - width / 2) / pixelsPerUnit, -(screenY - height / 2) / pixelsPerUnit, 0);
		sun.object.visible = sunOnScreen(progress, start.y, start.diameter);

		stage.style.setProperty('--departure-fade', String(textOpacity(progress)));
		// Once faded, the name and hint stop being selectable or clickable (see Hero.astro).
		stage.toggleAttribute('data-faded', textOpacity(progress) < 0.05);
		const pageProgress = scrollY / Math.max(1, root.scrollHeight - innerHeight);
		root.style.setProperty('--sunlight', String(sunlightOpacity(progress, pageProgress)));
		deepSpace.update(scrolled, deepSpaceOpacity(progress), chartCalm(projectsTop, height), performance.now() / 1000);
		streaks.update(warpNow.stretch, Math.max(0.6, deepSpaceOpacity(progress)));
		root.style.setProperty('--warp-flash', String(warpNow.flash));

		composer.render();
	}

	// Sunrise intro (first visit only; the page head decided, before first paint).
	let introRunning = root.classList.contains('intro');
	let introStart = performance.now();
	let introRise = introRunning ? 0 : 1;
	function finishIntro() {
		introRunning = false;
		introRise = 1;
		root.classList.remove('intro');
		stage.style.removeProperty('--intro-text');
	}
	function updateIntro(now: number) {
		if (!introRunning) return;
		const state = introState((now - introStart) / 1000);
		introRise = state.rise;
		stage.style.setProperty('--intro-text', String(state.text));
		if (state.done) finishIntro();
	}
	if (introRunning) {
		try {
			sessionStorage.setItem(INTRO_PLAYED_KEY, '1'); // once per visit, even if skipped
		} catch {}
		// Never make anyone wait: any input skips straight to the end.
		const skip = () => {
			if (introRunning) introStart = -Infinity;
		};
		for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown', 'scroll'])
			addEventListener(type, skip, { passive: true, once: true });
	}

	const animating = () =>
		introRunning ||
		shouldAnimate({ reducedMotion, hidden: document.hidden, sunOnScreen: sun.object.visible });
	// Stars twinkle wherever deep space is showing. A slow twinkle doesn't need 60 fps,
	// so frames drawn only for the twinkle run at half rate.
	const twinkling = () => !reducedMotion && !document.hidden && deepSpaceOpacity(progress) > 0.2;

	// The loop runs while the scene is catching up with the scroll, while the sun's surface
	// is animating on screen, or (at half rate) while stars twinkle.
	let frame = 0;
	let last = 0;
	let twinkleFrame = 0;
	function tick(now: number) {
		const dt = Math.min((now - last) / 1000, 0.1);
		last = now;
		// A button journey moves the page itself, in step with its warp.
		if (travel) {
			const u = (now - travel.start) / 1000 / travel.duration;
			scrollTo({ top: travelScroll(travel.from, travel.to, u), behavior: 'instant' });
			if (u >= 1) finishTravel();
		}
		const target = targetProgress();
		progress = damp(progress, target, EASE, dt);
		if (Math.abs(progress - target) < 1e-4) progress = target;
		scrolled = damp(scrolled, scrollY, EASE, dt);
		// Leaving the sun: start the warp when its zone is entered going down. It then advances by
		// the clock or the scroll, whichever is further, so it always ends before About arrives.
		if (!reducedMotion && !warp && crossedDown(lastDeparture, target, WARP_ZONE.start)) {
			warp = { start: now, duration: WARP.duration, scrollDriven: true };
		}
		lastDeparture = target;
		if (warp) {
			const byTime = (now - warp.start) / 1000 / warp.duration;
			const u = warp.scrollDriven ? warpProgress(byTime, scrollDrive(target, WARP_ZONE.start, WARP_ZONE.end)) : Math.min(1, byTime);
			warpNow = warpStateAt(u);
			if (warpNow.done) warp = null;
		} else {
			warpNow = IDLE;
		}
		if (Math.abs(scrolled - scrollY) < 0.5) scrolled = scrollY;
		updateIntro(now);
		sun.update(now / 1000);
		const settling = (progress !== target || scrolled !== scrollY) && !document.hidden;
		const busy = settling || animating() || warp !== null || travel !== null;
		const twinkle = twinkling();
		if (busy || (twinkle && ++twinkleFrame % 2 === 0)) draw();
		frame = busy || twinkle ? requestAnimationFrame(tick) : 0;
	}
	function wake() {
		if (reducedMotion || frame || document.hidden) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	/** Glide to `destination` over `seconds`, with a timed warp the whole way. */
	function startTravel(destination: HTMLElement, seconds: number) {
		const now = performance.now();
		const to = destination.getBoundingClientRect().top + scrollY;
		travel = { from: scrollY, to, start: now, duration: seconds, destination };
		warp = { start: now, duration: seconds, scrollDriven: false };
		wake();
	}
	function finishTravel() {
		if (!travel) return;
		// Like following a link: move keyboard focus to where we arrived.
		travel.destination.focus({ preventScroll: true });
		travel = null;
	}
	// Any input mid-journey hands control straight back (the warp still finishes on its own).
	for (const type of ['wheel', 'touchstart', 'keydown'] as const) {
		addEventListener(type, () => (travel = null), { passive: true });
	}
	// The page's buttons ask for a journey with this event (see TravelLink.astro).
	addEventListener('portfolio:travel', (event) => {
		const { to } = (event as CustomEvent<{ to: 'about' | 'top' }>).detail;
		const destination = document.getElementById(to);
		if (destination) startTravel(destination, to === 'top' ? RETURN_SECONDS : BEGIN_SECONDS);
	});

	layout();
	// Compile every shader (including hidden ones, like the streaks) without blocking the
	// page: the GPU driver works in the background while the page stays responsive.
	await renderer.compileAsync(scene, camera);
	introStart = performance.now(); // the intro starts when the sun can actually be drawn
	progress = reducedMotion ? 0 : targetProgress();
	// Start from where the page is, so loading mid-page never fires a warp.
	lastDeparture = targetProgress();
	scrolled = reducedMotion ? 0 : scrollY;
	sun.update(reducedMotion ? 30 : performance.now() / 1000);
	draw();
	started = true;
	wake();
	root.classList.add('scene-ready');

	addEventListener('scroll', wake, { passive: true });
	addEventListener('resize', () => {
		layout();
		draw();
		wake();
	});
	document.addEventListener('visibilitychange', wake);
}
