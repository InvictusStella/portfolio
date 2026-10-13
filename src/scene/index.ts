import * as THREE from 'three';
import { createSun, SUN_RADIUS } from './chapters/sun';
import { cameraDistanceForDiameter, damp, departureProgress, textOpacity } from './director';

const FOV = 45;
/** At the end of the departure the camera is this many times further away than at the start. */
const RECEDE = 25;
/** How quickly the camera catches up with the scroll position (higher = snappier). */
const EASE = 5;

export function startScene(canvas: HTMLCanvasElement) {
	const root = document.documentElement;
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const hero = document.querySelector<HTMLElement>('.hero')!;
	const stage = hero.querySelector<HTMLElement>('.hero__stage')!;
	const cssSun = hero.querySelector<HTMLElement>('.hero__sun')!;

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2000);
	const sun = createSun();
	scene.add(sun.object);

	let startDistance = 10;
	let distance = startDistance;

	/** Size the renderer and place the 3D sun exactly where the CSS sun is drawn. */
	function layout() {
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		// Measure relative to the stage, so this works even if the page loads mid-scroll.
		const sunBox = cssSun.getBoundingClientRect();
		const stageBox = stage.getBoundingClientRect();
		const centerX = sunBox.left + sunBox.width / 2;
		const centerY = sunBox.top - stageBox.top + sunBox.height / 2;

		const previousStart = startDistance;
		startDistance = cameraDistanceForDiameter(SUN_RADIUS, FOV, height, sunBox.width);
		distance *= startDistance / previousStart;

		const pixelsPerUnit = height / 2 / (startDistance * Math.tan((FOV * Math.PI) / 360));
		sun.object.position.set((centerX - width / 2) / pixelsPerUnit, -(centerY - height / 2) / pixelsPerUnit, 0);
	}

	function targetDistance() {
		const box = hero.getBoundingClientRect();
		const progress = departureProgress(box.top, box.height, innerHeight);
		stage.style.setProperty('--departure-fade', String(textOpacity(progress)));
		// Ease in: the sun lingers at first, then falls away fast (the jump).
		return startDistance * (1 + RECEDE * progress * progress);
	}

	function draw() {
		camera.position.set(0, 0, distance);
		renderer.render(scene, camera);
	}

	// Render on demand: the loop runs only while the camera is still catching up.
	let frame = 0;
	let last = 0;
	function tick(now: number) {
		const dt = Math.min((now - last) / 1000, 0.1);
		last = now;
		const target = targetDistance();
		distance = damp(distance, target, EASE, dt);
		draw();
		frame = Math.abs(distance - target) > startDistance * 1e-4 && !document.hidden ? requestAnimationFrame(tick) : 0;
	}
	function wake() {
		if (reducedMotion || frame || document.hidden) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	layout();
	distance = reducedMotion ? startDistance : targetDistance();
	draw();
	root.classList.add('scene-ready');

	addEventListener('scroll', wake, { passive: true });
	addEventListener('resize', () => {
		layout();
		draw();
		wake();
	});
	document.addEventListener('visibilitychange', wake);
}
