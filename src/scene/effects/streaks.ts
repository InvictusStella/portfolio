import * as THREE from 'three';
import { generateStars, type Bounds } from '../starfield';

// Lightspeed streaks: a layer of stars drawn as short lines. The head is the star; the
// GPU pushes the tail back along the travel direction, longer the faster you scroll.
// Hidden (zero cost) whenever there's no jump going on.

const vertexShader = /* glsl */ `
	attribute float tail;   // 0 = head (the star), 1 = end of the streak
	attribute vec3 color;
	uniform float uStrength; // 0..1
	uniform float uRadial;   // 1 = point out from the centre, 0 = vertical
	uniform float uDirY;     // +1 scrolling down, -1 scrolling up
	varying float vTail;
	varying vec3 vColor;

	void main() {
		vec4 view = modelViewMatrix * vec4(position, 1.0);
		vec2 radialDir = normalize(view.xy + vec2(1e-4));
		vec2 verticalDir = vec2(0.0, -uDirY); // the field rises as you scroll down, so tails trail below
		vec2 dir = normalize(mix(verticalDir, radialDir, uRadial));
		// Scaled by depth so streaks look about the same length on screen, near or far.
		float length = uStrength * (-view.z) * 0.09;
		view.xy += dir * length * tail;
		vTail = tail;
		vColor = color;
		gl_Position = projectionMatrix * view;
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uStrength;
	uniform float uOpacity;
	varying float vTail;
	varying vec3 vColor;

	void main() {
		// Bright blue-white head fading to a dim red tail: a cheap stand-in for
		// the colour fringing (chromatic aberration) of very fast motion.
		vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.45, 0.4), vTail);
		float alpha = (1.0 - vTail) * uStrength * uOpacity;
		gl_FragColor = vec4(vColor * tint * alpha, alpha);
	}
`;

export function createStreaks({ small, bounds }: { small: boolean; bounds: Bounds }) {
	const count = small ? 700 : 1400;
	const stars = generateStars(count, 77, bounds);

	// Two vertices per star (head and tail) at the same spot; the shader pulls the tail out.
	const positions = new Float32Array(count * 6);
	const colors = new Float32Array(count * 6);
	const tails = new Float32Array(count * 2);
	for (let i = 0; i < count; i++) {
		for (let end = 0; end < 2; end++) {
			const v = i * 2 + end;
			positions.set(stars.positions.slice(i * 3, i * 3 + 3), v * 3);
			colors.set(stars.colors.slice(i * 3, i * 3 + 3), v * 3);
			tails[v] = end;
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
	geometry.setAttribute('tail', new THREE.BufferAttribute(tails, 1));

	const uniforms = {
		uStrength: { value: 0 },
		uRadial: { value: 1 },
		uDirY: { value: 1 },
		uOpacity: { value: 1 },
	};
	const lines = new THREE.LineSegments(
		geometry,
		new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		}),
	);
	lines.frustumCulled = false; // tails are moved on the GPU, outside three.js's bounds
	lines.visible = false;

	return {
		object: lines,
		update(strength: number, radial: number, velocity: number, opacity: number) {
			lines.visible = strength > 0.01;
			uniforms.uStrength.value = strength;
			uniforms.uRadial.value = radial;
			uniforms.uDirY.value = velocity >= 0 ? 1 : -1;
			uniforms.uOpacity.value = opacity;
		},
	};
}
