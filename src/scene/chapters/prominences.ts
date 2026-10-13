import * as THREE from 'three';
import { PROMINENCE_COUNT, prominenceState } from '../activity';
import { simplexNoise3D } from '../shaders/noise';

// Prominences: glowing plasma off the sun's edge, in three kinds (loops, eruptions, jets;
// see activity.ts). Each is a flat strip whose shape the GPU computes from a few numbers,
// and keeps changing over time, so moving or reshaping one never rebuilds geometry.

const vertexShader = /* glsl */ `
	uniform float uTime;
	uniform float uAngle;     // centre of the arc around the edge (radians)
	uniform float uWidth;     // half the angle between its two feet
	uniform float uHeight;    // peak height above the surface, in sun radii
	uniform float uThickness; // strip thickness, in sun radii
	uniform float uWobble;    // how much the shape writhes (eruptions most, jets least)
	uniform float uDetach;    // 0 = anchored → 1 = feet let go and the arc lifts away
	uniform float uSeed;

	varying float vAlong;  // 0 at one foot, 1 at the other
	varying float vAcross; // -1 .. 1 across the strip

	${simplexNoise3D}

	vec2 arcPoint(float t) {
		float a = uAngle + uWidth * (2.0 * t - 1.0);
		float lift = sin(3.14159265 * t);
		// An uneven, slowly changing profile, so no two arcs (or moments) look alike.
		float profile = 1.0 + 0.15 * sin(t * 6.0 + uSeed * 6.2831) + 0.12 * snoise(vec3(t * 2.0, uTime * 0.12, uSeed * 5.0));
		// Detaching eruptions lift away from the surface as a whole.
		float base = 1.0 + uDetach * uHeight * 0.45;
		float r = base + uHeight * lift * profile;
		return vec2(cos(a), sin(a)) * r;
	}

	void main() {
		float t = uv.x;
		float side = uv.y * 2.0 - 1.0;
		float lift = sin(3.14159265 * t);

		vec2 here = arcPoint(t);
		vec2 tangent = normalize(arcPoint(min(t + 0.01, 1.0)) - arcPoint(max(t - 0.01, 0.0)));
		vec2 normal = vec2(-tangent.y, tangent.x);

		// Writhing: the body sways sideways, more at the top of the loop than at the feet.
		float sway = snoise(vec3(t * 3.0, uTime * 0.35, uSeed * 9.0));
		here += normal * sway * 0.12 * uHeight * uWobble * lift;

		// Twisting: the strip pinches and swells along its length, and that pattern drifts.
		float twist = 0.75 + 0.35 * snoise(vec3(t * 4.0, uTime * 0.5, uSeed * 3.0));
		float thickness = uThickness * (0.35 + 0.65 * lift) * twist;

		vAlong = t;
		vAcross = side;
		vec3 position = vec3(here + normal * side * thickness, 0.0);
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uTime;
	uniform float uLife;
	uniform float uDetach;
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

		// Plasma flowing from foot to foot, with bright knots you can watch slide along.
		float flow = 0.7 + 0.3 * snoise(vec3(vAlong * 6.0 - uTime * 0.5, x, uSeed * 7.0));
		float knots = smoothstep(0.5, 0.9, snoise(vec3(vAlong * 7.0 - uTime * 0.9, x * 0.8, uSeed * 13.0)));

		// Feet are anchored in the bright surface, so they glow a little more — unless the
		// arc is erupting, in which case they fade as it lets go.
		float edge = min(vAlong, 1.0 - vAlong);
		float feet = mix(1.0 + 0.4 * (1.0 - sin(3.14159265 * vAlong)), smoothstep(0.0, 0.3, edge), uDetach);

		float intensity = (halo * 0.55 + core * (1.0 + 0.9 * knots)) * strands * flow * feet * uLife * 1.25;
		// Hydrogen red-orange, hotter (yellower) in the core and the knots.
		vec3 color = mix(vec3(0.95, 0.22, 0.08), vec3(1.0, 0.62, 0.3), clamp(core * strands + knots * 0.4, 0.0, 1.0));
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
			uWobble: { value: 1 },
			uDetach: { value: 0 },
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
				uniforms.uDetach.value = p.detach;
				// Jets are thin and steady; eruptions swell and writhe as they rise.
				uniforms.uThickness.value = p.kind === 'jet' ? 0.05 : p.kind === 'eruptive' ? 0.13 + 0.1 * p.detach : 0.14;
				uniforms.uWobble.value = p.kind === 'jet' ? 0.5 : p.kind === 'eruptive' ? 1.8 : 1;
				mesh.visible = p.life > 0.001;
			});
		},
	};
}
