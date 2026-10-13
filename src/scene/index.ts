import * as THREE from 'three';
import { createDeepSpace } from './chapters/deepSpace';
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
import { INTRO_PLAYED_KEY, introState } from './intro';

const FOV = 45;
/** How quickly the scene catches up with the scroll position (higher = snappier). */
const EASE = 5;

export function startScene(canvas: HTMLCanvasElement) {
	const root = document.documentElement;
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const hero = document.querySelector<HTMLElement>('.hero')!;
	const stage = hero.querySelector<HTMLElement>('.hero__stage')!;
	const cssSun = hero.querySelector<HTMLElement>('.hero__sun')!;
	const projects = document.getElementById('projects');

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2000);
	const deepSpace = createDeepSpace({ small: innerWidth < 640 });
	scene.add(deepSpace.object);
	const sun = createSun();
	scene.add(sun.object);

	// Where the CSS sun is drawn (in px, as if the hero were at the top of the page).
	let start = { x: 0, y: 0, diameter: 1 };
	let startDistance = 10;
	let progress = 0;
	/** Page scroll in px, eased like the departure so the star field glides. */
	let scrolled = 0;

	function layout() {
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		renderer.setSize(width, height, false);
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
		const distance = startDistance / sunScale(progress);
		camera.position.set(0, 0, distance);

		// Convert the sun's wanted screen position into world units at that distance.
		const pixelsPerUnit = height / 2 / (distance * Math.tan((FOV * Math.PI) / 360));
		// During the sunrise intro the sun starts below the screen (corona included) and rises.
		const below = height - start.y + start.diameter * 1.3;
		const screenY = sunScreenY(progress, start.y, start.diameter) + (1 - introRise) * below;
		sun.object.position.set((start.x - width / 2) / pixelsPerUnit, -(screenY - height / 2) / pixelsPerUnit, 0);
		sun.object.visible = sunOnScreen(progress, start.y, start.diameter);

		stage.style.setProperty('--departure-fade', String(textOpacity(progress)));
		const pageProgress = scrollY / Math.max(1, root.scrollHeight - innerHeight);
		root.style.setProperty('--sunlight', String(sunlightOpacity(progress, pageProgress)));
		// Where the projects section is at the eased scroll position (not the raw one).
		const projectsTop = projects ? projects.getBoundingClientRect().top + (scrollY - scrolled) : Infinity;
		deepSpace.update(scrolled, deepSpaceOpacity(progress), chartCalm(projectsTop, height));

		renderer.render(scene, camera);
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

	// The loop runs while the scene is catching up with the scroll, or while the sun's
	// surface is animating on screen. Otherwise nothing is drawn until the next scroll.
	let frame = 0;
	let last = 0;
	function tick(now: number) {
		const dt = Math.min((now - last) / 1000, 0.1);
		last = now;
		const target = targetProgress();
		progress = damp(progress, target, EASE, dt);
		if (Math.abs(progress - target) < 1e-4) progress = target;
		scrolled = damp(scrolled, scrollY, EASE, dt);
		if (Math.abs(scrolled - scrollY) < 0.5) scrolled = scrollY;
		updateIntro(now);
		sun.update(now / 1000);
		draw();
		const settling = (progress !== target || scrolled !== scrollY) && !document.hidden;
		frame = settling || animating() ? requestAnimationFrame(tick) : 0;
	}
	function wake() {
		if (reducedMotion || frame || document.hidden) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	layout();
	progress = reducedMotion ? 0 : targetProgress();
	scrolled = reducedMotion ? 0 : scrollY;
	sun.update(reducedMotion ? 30 : performance.now() / 1000);
	draw();
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
