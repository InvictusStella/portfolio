import * as THREE from 'three';
import { simplexNoise3D } from '../shaders/noise';

// The sun: a churning surface (granulation, convection, sunspots, limb darkening),
// a flickering corona hugging its edge, and a soft glow. Flares come in T11b.

export const SUN_RADIUS = 1;

const surfaceVertex = /* glsl */ `
	varying vec3 vNormal;
	varying vec3 vViewDir;
	varying vec3 vPosition; // position on the sphere, used to sample noise without seams

	void main() {
		vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
		vNormal = normalize(normalMatrix * normal);
		vViewDir = normalize(-viewPosition.xyz);
		vPosition = position;
		gl_Position = projectionMatrix * viewPosition;
	}
`;

const surfaceFragment = /* glsl */ `
	uniform float uTime;
	varying vec3 vNormal;
	varying vec3 vViewDir;
	varying vec3 vPosition;

	${simplexNoise3D}

	void main() {
		// 1 at the centre of the disc (facing us), 0 at the edge.
		float mu = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);

		// Limb darkening: golden centre, deep orange-red edge.
		vec3 core = vec3(1.0, 0.80, 0.45);
		vec3 mid = vec3(1.0, 0.62, 0.24);
		vec3 edge = vec3(0.70, 0.22, 0.07);
		vec3 color = mix(edge, mid, smoothstep(0.0, 0.55, mu));
		color = mix(color, core, smoothstep(0.55, 1.0, mu));

		vec3 p = vPosition;

		// Large, slow convection swells.
		float convection = fbm(p * 2.2 + vec3(0.0, uTime * 0.02, uTime * 0.015));

		// Granulation: very fine boiling cells. Ridged noise (1 - |n|) gives bright cell
		// walls; a second, offset layer breaks up the regular pattern.
		float grainA = 1.0 - abs(snoise(p * 38.0 + vec3(uTime * 0.18, -uTime * 0.13, uTime * 0.11)));
		float grainB = snoise(p * 21.0 - vec3(uTime * 0.07, uTime * 0.05, -uTime * 0.09));
		float grain = grainA * grainA * (0.75 + 0.25 * grainB);

		// Brightness varies around 1; it darkens slightly more than it brightens,
		// so the text over the centre keeps its contrast.
		float brightness = 0.93 + 0.07 * grain + 0.07 * convection;

		// Sunspots: rare dark patches where very low-frequency noise peaks.
		// Like the real sun, spots only appear in two belts either side of the equator.
		float latitude = abs(normalize(p).y);
		float belts = smoothstep(0.12, 0.22, latitude) * (1.0 - smoothstep(0.45, 0.58, latitude));
		float spotField = snoise(p * 2.4 + vec3(uTime * 0.004, 7.3, -uTime * 0.003)) * belts;
		float spot = smoothstep(0.80, 0.90, spotField);
		float penumbra = smoothstep(0.72, 0.84, spotField) - spot;
		color *= brightness;
		color = mix(color, color * vec3(0.6, 0.38, 0.24), penumbra * 0.55);
		color = mix(color, vec3(0.32, 0.1, 0.04), spot * 0.7);

		gl_FragColor = vec4(color, 1.0);
	}
`;

const coronaVertex = /* glsl */ `
	varying vec2 vPoint; // position on the plane, in sun radii from the centre

	void main() {
		vPoint = position.xy;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const coronaFragment = /* glsl */ `
	uniform float uTime;
	varying vec2 vPoint;

	${simplexNoise3D}

	void main() {
		// Distance from the sun's centre in radii. The sun's own surface covers r < 1.
		float r = length(vPoint);
		vec2 dir = vPoint / max(r, 1e-4);

		// Bright right at the edge, fading smoothly to nothing: no hard outline.
		float falloff = exp(-(r - 1.0) * 5.0) * smoothstep(0.98, 1.02, r);

		// Streaks: noise stretched along the radial direction, drifting outward.
		float streaks = snoise(vec3(dir * 8.0, r * 1.2 - uTime * 0.12));
		float shimmer = 0.72 + 0.28 * streaks;

		float intensity = falloff * shimmer;
		vec3 color = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.75, 0.4), falloff);
		gl_FragColor = vec4(color * intensity, intensity);
	}
`;

/** Soft radial glow texture, drawn once on a 2D canvas. */
function glowTexture(): THREE.CanvasTexture {
	const size = 256;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d')!;
	const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	g.addColorStop(0, 'rgba(255, 190, 90, 0.9)');
	g.addColorStop(0.3, 'rgba(255, 150, 60, 0.45)');
	g.addColorStop(0.6, 'rgba(255, 110, 40, 0.12)');
	g.addColorStop(1, 'rgba(255, 90, 30, 0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, size, size);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

export function createSun() {
	const group = new THREE.Group();
	const time = { value: 0 };

	const glow = new THREE.Sprite(
		new THREE.SpriteMaterial({
			map: glowTexture(),
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			transparent: true,
		}),
	);
	glow.scale.setScalar(SUN_RADIUS * 4.2);
	group.add(glow);

	const surface = new THREE.Mesh(
		new THREE.SphereGeometry(SUN_RADIUS, 96, 96),
		new THREE.ShaderMaterial({
			vertexShader: surfaceVertex,
			fragmentShader: surfaceFragment,
			uniforms: { uTime: time },
		}),
	);
	group.add(surface);

	// A flat square facing the camera (the camera never turns), centred on the sun.
	// The sun's surface hides the middle; only the glow around the edge shows.
	const corona = new THREE.Mesh(
		new THREE.PlaneGeometry(SUN_RADIUS * 3.4, SUN_RADIUS * 3.4),
		new THREE.ShaderMaterial({
			vertexShader: coronaVertex,
			fragmentShader: coronaFragment,
			uniforms: { uTime: time },
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		}),
	);
	group.add(corona);

	return {
		object: group,
		/** Advance the animation to `seconds` since the scene started. */
		update(seconds: number) {
			time.value = seconds;
			// A slow turn, so features drift across the face.
			surface.rotation.y = seconds * 0.01;
		},
	};
}
