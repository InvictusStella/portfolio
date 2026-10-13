import * as THREE from 'three';
import { generateStars } from '../starfield';

// Deep space: thousands of stars at different depths plus a few soft nebula clouds.
// The whole field drifts upward as you scroll (like the sun rose); nearer stars move
// faster than far ones because of perspective — that's the parallax that reads as depth.
// It only moves when you scroll, so it costs nothing while you read.

/** World units the field rises per pixel scrolled (≈ a quarter of scroll speed mid-depth). */
export const RISE_PER_PX = 0.0105;

const BOUNDS = { x: [-45, 45], y: [-95, 28], z: [-75, -8] } as const;

const vertexShader = /* glsl */ `
	attribute float size;
	attribute vec3 color;
	uniform float uPixelRatio;
	varying vec3 vColor;

	void main() {
		vColor = color;
		vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
		// Further away = smaller on screen.
		gl_PointSize = size * uPixelRatio * (60.0 / -viewPosition.z);
		gl_Position = projectionMatrix * viewPosition;
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uOpacity;
	varying vec3 vColor;

	void main() {
		// A round, soft dot: bright centre fading to the edge of the point.
		float d = length(gl_PointCoord - 0.5) * 2.0;
		float glow = smoothstep(1.0, 0.0, d);
		glow *= glow;
		gl_FragColor = vec4(vColor * glow, glow * uOpacity);
	}
`;

function nebulaTexture(inner: string, outer: string): THREE.CanvasTexture {
	const size = 256;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d')!;
	const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	g.addColorStop(0, inner);
	g.addColorStop(0.45, outer);
	g.addColorStop(1, 'rgba(0, 0, 0, 0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, size, size);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

export function createDeepSpace({ small }: { small: boolean }) {
	const group = new THREE.Group();
	const opacity = { value: 0 };
	const pixelRatio = { value: 1 };

	const stars = generateStars(small ? 2500 : 5000, 2026, BOUNDS);
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(stars.positions, 3));
	geometry.setAttribute('color', new THREE.Float32BufferAttribute(stars.colors, 3));
	geometry.setAttribute('size', new THREE.Float32BufferAttribute(stars.sizes, 1));
	const points = new THREE.Points(
		geometry,
		new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: { uOpacity: opacity, uPixelRatio: pixelRatio },
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		}),
	);
	group.add(points);

	// A few faint nebula clouds far behind the stars, spread down the page.
	const clouds: { y: number; x: number; scale: number; inner: string; outer: string }[] = [
		{ x: 18, y: -18, scale: 70, inner: 'rgba(120, 70, 210, 0.55)', outer: 'rgba(70, 40, 150, 0.2)' },
		{ x: -24, y: -42, scale: 80, inner: 'rgba(40, 110, 210, 0.5)', outer: 'rgba(20, 60, 140, 0.18)' },
		{ x: 14, y: -70, scale: 75, inner: 'rgba(170, 60, 160, 0.45)', outer: 'rgba(90, 30, 110, 0.16)' },
	];
	const cloudMaterials = clouds.map(({ x, y, scale, inner, outer }) => {
		const material = new THREE.SpriteMaterial({
			map: nebulaTexture(inner, outer),
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			transparent: true,
			opacity: 0,
		});
		const sprite = new THREE.Sprite(material);
		sprite.position.set(x, y, -80);
		sprite.scale.setScalar(scale);
		group.add(sprite);
		return material;
	});

	return {
		object: group,
		setPixelRatio(ratio: number) {
			pixelRatio.value = ratio;
		},
		/** `scrolledPx`: how far the page is scrolled; `strength`: 0..1 fade. */
		update(scrolledPx: number, strength: number) {
			group.position.y = scrolledPx * RISE_PER_PX;
			opacity.value = strength;
			for (const m of cloudMaterials) m.opacity = 0.35 * strength;
		},
	};
}
