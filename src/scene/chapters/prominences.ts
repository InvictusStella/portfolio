import * as THREE from 'three';
import { PROMINENCE_COUNT, prominenceState } from '../activity';
import { simplexNoise3D } from '../shaders/noise';

// Prominences: glowing plasma arcs looping off the sun's edge. Each arc is a flat strip
// whose shape is computed on the GPU from a few numbers (where, how wide, how tall), so
// moving an arc somewhere new just means changing those numbers.

const vertexShader = /* glsl */ `
	uniform float uAngle;     // centre of the arc around the edge (radians)
	uniform float uWidth;     // half the angle between its two feet
	uniform float uHeight;    // peak height above the surface, in sun radii
	uniform float uThickness; // strip thickness, in sun radii
	uniform float uSeed;

	varying float vAlong;  // 0 at one foot, 1 at the other
	varying float vAcross; // -1 .. 1 across the strip

	vec2 arcPoint(float t) {
		float a = uAngle + uWidth * (2.0 * t - 1.0);
		float lift = sin(3.14159265 * t);
		// A gentle wobble so arcs aren't perfect semicircles.
		float r = 1.0 + uHeight * lift * (1.0 + 0.15 * sin(t * 6.0 + uSeed * 6.2831));
		return vec2(cos(a), sin(a)) * r;
	}

	void main() {
		float t = uv.x;
		float side = uv.y * 2.0 - 1.0;

		vec2 here = arcPoint(t);
		vec2 tangent = normalize(arcPoint(min(t + 0.01, 1.0)) - arcPoint(max(t - 0.01, 0.0)));
		vec2 normal = vec2(-tangent.y, tangent.x);
		// Thinner at the feet, fuller at the top of the loop.
		float thickness = uThickness * (0.35 + 0.65 * sin(3.14159265 * t));

		vAlong = t;
		vAcross = side;
		vec3 position = vec3(here + normal * side * thickness, 0.0);
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uTime;
	uniform float uLife;
	uniform float uSeed;

	varying float vAlong;
	varying float vAcross;

	${simplexNoise3D}

	void main() {
		// A soft glowing halo across the whole strip, with a brighter core in the middle.
		float x = vAcross;
		float halo = 1.0 - x * x;
		float core = exp(-x * x * 5.0);

		// Several strands running along the loop, drifting and twisting slowly.
		float strands = snoise(vec3(x * 3.2, vAlong * 2.0 - uTime * 0.15, uSeed * 10.0 + uTime * 0.05));
		strands = 0.6 + 0.4 * strands;

		// Plasma flowing from foot to foot.
		float flow = 0.7 + 0.3 * snoise(vec3(vAlong * 6.0 - uTime * 0.5, x, uSeed * 7.0));

		// Feet are anchored in the bright surface, so they glow a little more.
		float feet = 1.0 + 0.4 * (1.0 - sin(3.14159265 * vAlong));

		float intensity = (halo * 0.55 + core * 1.0) * strands * flow * feet * uLife * 1.25;
		// Hydrogen red-orange, hotter (yellower) in the core.
		vec3 color = mix(vec3(0.95, 0.22, 0.08), vec3(1.0, 0.6, 0.3), core * strands);
		gl_FragColor = vec4(color * intensity, intensity);
	}
`;

export function createProminences(time: { value: number }) {
	const group = new THREE.Group();
	// A strip: 64 steps along the arc, 4 across it.
	const geometry = new THREE.PlaneGeometry(1, 1, 64, 4);

	const arcs = Array.from({ length: PROMINENCE_COUNT }, () => {
		const uniforms = {
			uTime: time,
			uAngle: { value: 0 },
			uWidth: { value: 0.2 },
			uHeight: { value: 0 },
			uThickness: { value: 0.14 },
			uLife: { value: 0 },
			uSeed: { value: 0 },
		};
		const mesh = new THREE.Mesh(
			geometry,
			new THREE.ShaderMaterial({
				vertexShader,
				fragmentShader,
				uniforms,
				transparent: true,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
				side: THREE.DoubleSide,
			}),
		);
		// The arc's shape comes from the shader, so three.js can't know its real bounds.
		mesh.frustumCulled = false;
		group.add(mesh);
		return { mesh, uniforms };
	});

	return {
		object: group,
		update(seconds: number) {
			arcs.forEach(({ mesh, uniforms }, slot) => {
				const p = prominenceState(slot, seconds);
				uniforms.uAngle.value = p.angle;
				uniforms.uWidth.value = p.width;
				uniforms.uHeight.value = p.height;
				uniforms.uLife.value = p.life;
				uniforms.uSeed.value = p.seed;
				mesh.visible = p.life > 0.001;
			});
		},
	};
}
