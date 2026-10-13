import * as THREE from 'three';
import { generateStars, type Bounds } from '../starfield';

// Warp streaks (Star Wars hyperspace / Mass Effect relay jump): a layer of
// stars drawn as lines. During a warp the head stays at the star and the GPU
// pulls the tail back toward the centre of the screen, so the stars seem to
// rush outward past you. Streaks further from the centre are longer, which is
// what makes it read as a tunnel. Hidden (zero cost) otherwise.

const vertexShader = /* glsl */ `
	attribute float tail;   // 0 = head (the star), 1 = end of the streak
	attribute vec3 color;
	uniform float uStretch; // 0..1, from the warp timeline
	varying float vTail;
	varying vec3 vColor;

	void main() {
		vec4 view = modelViewMatrix * vec4(position, 1.0);
		// Where this star appears relative to the screen centre
		// (perspective-correct).
		vec2 screenDir = view.xy / -view.z;
		float fromCentre = length(screenDir);
		vec2 inward = -normalize(screenDir + vec2(1e-5));
		// Longer the further out, in screen terms; converted back to this star's
		// depth.
		float length = uStretch * (0.08 + fromCentre * 0.9) * -view.z;
		view.xy += inward * length * tail;
		vTail = tail;
		vColor = color;
		gl_Position = projectionMatrix * view;
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uStretch;
	uniform float uOpacity;
	varying float vTail;
	varying vec3 vColor;

	void main() {
		// White-hot head fading into a blue tail.
		vec3 tint = mix(vec3(1.0, 1.0, 1.0), vec3(0.35, 0.6, 1.0), vTail);
		float alpha = (1.0 - vTail * 0.85) * smoothstep(0.0, 0.25, uStretch) * uOpacity;
		gl_FragColor = vec4(mix(vColor, vec3(1.0), 0.5) * tint * alpha, alpha);
	}
`;

export function createStreaks({
  small,
  bounds,
}: {
  small: boolean;
  bounds: Bounds;
}) {
  const count = small ? 900 : 1800;
  const stars = generateStars(count, 77, bounds);

  // Two vertices per star (head and tail) at the same spot; the shader pulls
  // the tail out.
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

  const uniforms = { uStretch: { value: 0 }, uOpacity: { value: 1 } };
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
    update(stretch: number, opacity: number) {
      lines.visible = stretch > 0.005;
      uniforms.uStretch.value = stretch;
      uniforms.uOpacity.value = opacity;
    },
  };
}
