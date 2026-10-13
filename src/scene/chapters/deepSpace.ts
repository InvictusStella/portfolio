import * as THREE from 'three';
import { generateStars } from '../starfield';

// Deep space, in layers (furthest first):
//   1. A real photo of the Milky Way around the Galactic Centre (ESO/S. Brunier).
//   2. Two real nebula photos from the Webb telescope (Southern Ring, Ring Nebula).
//   3. Thousands of procedural stars: the brightest with diffraction spikes, all twinkling.
// The whole field drifts upward as you scroll (like the sun rose). Because of perspective,
// near layers slide faster than far ones — the parallax that makes photos read as depth.
// Photos are blended additively: their black background adds nothing.

/** World units the field rises per pixel scrolled (≈ a quarter of scroll speed mid-depth). */
export const RISE_PER_PX = 0.0105;

export const BOUNDS = { x: [-45, 45], y: [-95, 28], z: [-75, -8] } as const;

const starVertex = /* glsl */ `
	attribute float size;
	attribute vec3 color;
	uniform float uPixelRatio;
	uniform float uTime;
	varying vec3 vColor;
	varying float vBright;   // 0 = ordinary star, 1 = bright star with diffraction spikes
	varying float vTwinkle;

	void main() {
		vColor = color;
		vBright = smoothstep(1.6, 3.0, size);
		// Each star twinkles at its own speed and phase (derived from where it is).
		float phase = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
		vTwinkle = 0.78 + 0.22 * sin(uTime * (1.2 + phase * 2.5) + phase * 6.2832);

		vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
		// Further away = smaller; bright stars get a bigger point to fit their spikes.
		gl_PointSize = size * uPixelRatio * (85.0 / -viewPosition.z) * (1.0 + vBright * 2.5);
		gl_Position = projectionMatrix * viewPosition;
	}
`;

const starFragment = /* glsl */ `
	uniform float uOpacity;
	varying vec3 vColor;
	varying float vBright;
	varying float vTwinkle;

	void main() {
		vec2 p = gl_PointCoord - 0.5;
		// The round core stays the same size even when the point was enlarged for spikes.
		float d = length(p) * 2.0 * (1.0 + vBright * 2.5);
		float core = smoothstep(1.0, 0.0, d);
		core *= core;
		// Four-point diffraction spikes, like telescope photos (bright stars only).
		float spikes =
			exp(-abs(p.x) * 70.0) * smoothstep(0.5, 0.0, abs(p.y)) +
			exp(-abs(p.y) * 70.0) * smoothstep(0.5, 0.0, abs(p.x));
		float light = (core * 1.5 + spikes * 0.7 * vBright) * vTwinkle * uOpacity;
		gl_FragColor = vec4(vColor * light, light);
	}
`;

const photoVertex = /* glsl */ `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const photoFragment = /* glsl */ `
	uniform sampler2D uMap;
	uniform float uOpacity;
	uniform float uBlack;   // "black point": haze below this is removed so only the object glows
	uniform float uRound;   // 1 = soft circular fade (nebulae), 0 = soft rectangular edges (backdrop)
	varying vec2 vUv;

	void main() {
		vec3 c = texture2D(uMap, vUv).rgb;
		c = max(c - uBlack, 0.0) / (1.0 - uBlack);
		float circle = 1.0 - smoothstep(0.55, 1.0, length(vUv - 0.5) * 2.0);
		vec2 e = smoothstep(0.0, 0.12, vUv) * smoothstep(1.0, 0.88, vUv);
		float mask = mix(e.x * e.y, circle, uRound);
		gl_FragColor = vec4(c * mask * uOpacity, 1.0);
	}
`;

type Photo = { file: string; x: number; y: number; z: number; size: number; black: number; round: number; brightness: number };

const PHOTOS: Photo[] = [
	// Far backdrop: covers the whole scroll range; the Milky Way band crosses mid-page.
	{ file: 'milky-way-eso.webp', x: 0, y: -28, z: -110, size: 200, black: 0.04, round: 0, brightness: 0.55 },
	// Both nebulae sit on the right: the text column is on the left, and parallax would
	// otherwise drag a left-hand nebula through the text as you scroll.
	// Behind About.
	{ file: 'southern-ring-webb.webp', x: 24, y: -24, z: -70, size: 34, black: 0.08, round: 1, brightness: 0.6 },
	// Lower down, beside the star chart.
	{ file: 'ring-nebula-webb.webp', x: 30, y: -54, z: -70, size: 30, black: 0.1, round: 1, brightness: 0.7 },
];

export function createDeepSpace({ small, base, onLoad }: { small: boolean; base: string; onLoad: () => void }) {
	const group = new THREE.Group();
	const opacity = { value: 0 };
	const pixelRatio = { value: 1 };
	const time = { value: 0 };

	// Photos load in the background; each fades in once it has arrived.
	const loader = new THREE.TextureLoader();
	const photos = PHOTOS.map((photo) => {
		const uniforms = {
			uMap: { value: null as THREE.Texture | null },
			uOpacity: { value: 0 },
			uBlack: { value: photo.black },
			uRound: { value: photo.round },
		};
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(photo.size, photo.size),
			new THREE.ShaderMaterial({
				vertexShader: photoVertex,
				fragmentShader: photoFragment,
				uniforms,
				transparent: true,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			}),
		);
		mesh.position.set(photo.x, photo.y, photo.z);
		mesh.visible = false;
		group.add(mesh);
		loader.load(`${base}textures/${photo.file}`, (texture) => {
			uniforms.uMap.value = texture;
			mesh.visible = true;
			onLoad();
		});
		return { photo, uniforms };
	});

	const stars = generateStars(small ? 2500 : 5000, 2026, BOUNDS);
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(stars.positions, 3));
	geometry.setAttribute('color', new THREE.Float32BufferAttribute(stars.colors, 3));
	geometry.setAttribute('size', new THREE.Float32BufferAttribute(stars.sizes, 1));
	const points = new THREE.Points(
		geometry,
		new THREE.ShaderMaterial({
			vertexShader: starVertex,
			fragmentShader: starFragment,
			uniforms: { uOpacity: opacity, uPixelRatio: pixelRatio, uTime: time },
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		}),
	);
	group.add(points);

	return {
		object: group,
		setPixelRatio(ratio: number) {
			pixelRatio.value = ratio;
		},
		/**
		 * `scrolledPx`: how far the page is scrolled; `strength`: 0..1 fade-in;
		 * `calm`: 0..1 — behind the star chart the sky settles (dimmer stars and photos)
		 * so the project stars stand out; `seconds`: clock for the twinkle.
		 */
		update(scrolledPx: number, strength: number, calm: number, seconds: number) {
			group.position.y = scrolledPx * RISE_PER_PX;
			time.value = seconds;
			opacity.value = strength * (1 - 0.5 * calm);
			// On narrow screens text spans the full width, so photos are always behind some of it: dimmer there.
			const dim = small ? 0.6 : 1;
			for (const { photo, uniforms } of photos) uniforms.uOpacity.value = photo.brightness * dim * strength * (1 - 0.45 * calm);
		},
	};
}
