import * as THREE from 'three';

// T10 version: a plain glowing sphere. Surface detail comes in T11, flares in T11b.

export const SUN_RADIUS = 1;

const vertexShader = /* glsl */ `
	varying vec3 vNormal;
	varying vec3 vViewDir;

	void main() {
		vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
		vNormal = normalize(normalMatrix * normal);
		vViewDir = normalize(-viewPosition.xyz);
		gl_Position = projectionMatrix * viewPosition;
	}
`;

const fragmentShader = /* glsl */ `
	varying vec3 vNormal;
	varying vec3 vViewDir;

	void main() {
		// 1 at the centre of the disc (facing us), 0 at the edge.
		float mu = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);

		// Limb darkening: hot pale centre, deep orange-red edge.
		vec3 core = vec3(1.0, 0.96, 0.84);
		vec3 mid = vec3(1.0, 0.70, 0.30);
		vec3 edge = vec3(0.70, 0.22, 0.07);
		vec3 color = mix(edge, mid, smoothstep(0.0, 0.55, mu));
		color = mix(color, core, smoothstep(0.55, 1.0, mu));

		gl_FragColor = vec4(color, 1.0);
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

	const sphere = new THREE.Mesh(
		new THREE.SphereGeometry(SUN_RADIUS, 64, 64),
		new THREE.ShaderMaterial({ vertexShader, fragmentShader }),
	);
	group.add(sphere);

	return { object: group };
}
