import * as THREE from 'three';
import { FLARE_COUNT, flareState } from '../activity';
import { simplexNoise3D } from '../shaders/noise';
import { createProminences } from './prominences';

// The sun: its face is a real NASA SDO image (AIA 304 Å), repainted with the
// site's palette and kept alive by a slow warp, moving granulation and
// flickering active regions; plus a flickering corona, prominences and flares,
// and a soft glow.

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
	uniform sampler2D uMap;      // real SDO/AIA 304 Å image of the sun, as brightness
	uniform float uDiscRadius;   // the disc's radius in the texture, as a fraction of its width
	uniform float uFlareAngle[${FLARE_COUNT}];    // where on the edge (radians, 0 = right, π/2 = top)
	uniform float uFlareStrength[${FLARE_COUNT}]; // 0..1
	varying vec3 vNormal;
	varying vec3 vViewDir;
	varying vec3 vPosition;

	${simplexNoise3D}

	// Repaint the image's brightness with the site's palette: deep red in the dark
	// lanes, orange across the surface, yellow-white glare in the active regions.
	vec3 palette(float x) {
		vec3 c = mix(vec3(0.3, 0.05, 0.01), vec3(0.92, 0.32, 0.05), smoothstep(0.0, 0.35, x));
		c = mix(c, vec3(1.0, 0.56, 0.12), smoothstep(0.3, 0.6, x));
		c = mix(c, vec3(1.0, 0.8, 0.42), smoothstep(0.58, 0.82, x));
		return mix(c, vec3(1.0, 0.96, 0.85), smoothstep(0.82, 1.0, x));
	}

	void main() {
		vec3 n = normalize(vNormal);
		// 1 at the centre of the disc (facing us), 0 at the edge.
		float mu = clamp(dot(n, normalize(vViewDir)), 0.0, 1.0);
		vec3 p = vPosition;

		// The camera always faces the sun, so the view-space normal's x/y is exactly
		// where this point sits on the face-on photo.
		vec2 uv = 0.5 + n.xy * uDiscRadius;

		// "Boiling": a slow, gentle warp of the photo so it never looks still.
		vec2 warp = vec2(
			snoise(p * 4.0 + vec3(0.0, 0.0, uTime * 0.05)),
			snoise(p * 4.0 + vec3(17.0, 3.0, uTime * 0.05))
		);
		uv += warp * 0.0035;
		float x = texture2D(uMap, uv).r;

		// Fine moving granulation on top of the photo's own texture.
		float grain = 1.0 - abs(snoise(p * 42.0 + vec3(uTime * 0.2, -uTime * 0.15, uTime * 0.12)));
		x *= 0.94 + 0.08 * grain * grain;

		// Active regions flicker: the brightest parts brighten and dim over a few
		// seconds.
		float activeRegion = smoothstep(0.62, 0.9, x); // ("active" is a reserved word in GLSL)
		x += activeRegion * 0.14 * snoise(vec3(uv * 18.0, uTime * 0.5));

		vec3 color = palette(clamp(x, 0.0, 1.0));
		// A touch of limb darkening keeps the sphere reading as round.
		color *= mix(0.7, 1.0, smoothstep(0.0, 0.35, mu));

		// Flares: a brief white-hot flash near the edge.
		for (int i = 0; i < ${FLARE_COUNT}; i++) {
			vec3 target = normalize(vec3(cos(uFlareAngle[i]) * 0.92, sin(uFlareAngle[i]) * 0.92, 0.39));
			float d = distance(n, target);
			float ragged = 0.75 + 0.25 * snoise(n * 12.0 + uTime * 0.8);
			float flash = uFlareStrength[i] * exp(-d * d / 0.012) * ragged;
			color += vec3(1.0, 0.92, 0.75) * flash;
		}

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
	uniform float uFlareAngle[${FLARE_COUNT}];
	uniform float uFlareStrength[${FLARE_COUNT}];
	varying vec2 vPoint;

	${simplexNoise3D}

	void main() {
		// Distance from the sun's centre in radii. The sun's own surface covers r <
		// 1.
		float r = length(vPoint);
		vec2 dir = vPoint / max(r, 1e-4);

		// Bright right at the edge, fading smoothly to nothing: no hard outline.
		float falloff = exp(-(r - 1.0) * 5.0) * smoothstep(0.98, 1.02, r);

		// Streaks: noise stretched along the radial direction, drifting outward.
		float streaks = snoise(vec3(dir * 8.0, r * 1.2 - uTime * 0.12));
		float shimmer = 0.72 + 0.28 * streaks;

		// A flare also lights up the corona above it, reaching further out than
		// usual.
		float angle = atan(vPoint.y, vPoint.x);
		float burst = 0.0;
		for (int i = 0; i < ${FLARE_COUNT}; i++) {
			float diff = atan(sin(angle - uFlareAngle[i]), cos(angle - uFlareAngle[i]));
			burst += uFlareStrength[i] * exp(-diff * diff / 0.03) * exp(-(r - 1.0) * 2.5);
		}
		burst *= smoothstep(0.98, 1.02, r);

		float intensity = falloff * shimmer + burst * (0.7 + 0.3 * streaks);
		vec3 color = mix(vec3(0.9, 0.22, 0.04), vec3(1.0, 0.5, 0.16), falloff);
		gl_FragColor = vec4(color * intensity, intensity);
	}
`;

/** Soft radial glow texture, drawn once on a 2D canvas. */
function glowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, 'rgba(255, 140, 50, 0.9)');
  g.addColorStop(0.3, 'rgba(240, 80, 25, 0.45)');
  g.addColorStop(0.6, 'rgba(200, 50, 15, 0.12)');
  g.addColorStop(1, 'rgba(180, 40, 10, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/** Where the solar disc sits in the prepared texture (see docs/credits.md). */
const SDO_DISC_RADIUS = 0.4465;

export function createSun(surfaceMap: THREE.Texture) {
  const group = new THREE.Group();
  const time = { value: 0 };
  // Shared by the surface and corona shaders; updated from the activity
  // schedule.
  const flareAngle = { value: new Array<number>(FLARE_COUNT).fill(0) };
  const flareStrength = { value: new Array<number>(FLARE_COUNT).fill(0) };

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
      uniforms: {
        uTime: time,
        uMap: { value: surfaceMap },
        uDiscRadius: { value: SDO_DISC_RADIUS },
        uFlareAngle: flareAngle,
        uFlareStrength: flareStrength,
      },
    }),
  );
  group.add(surface);

  // A flat square facing the camera (the camera never turns), centred on the
  // sun. The sun's surface hides the middle; only the glow around the edge
  // shows.
  const corona = new THREE.Mesh(
    new THREE.PlaneGeometry(SUN_RADIUS * 3.4, SUN_RADIUS * 3.4),
    new THREE.ShaderMaterial({
      vertexShader: coronaVertex,
      fragmentShader: coronaFragment,
      uniforms: {
        uTime: time,
        uFlareAngle: flareAngle,
        uFlareStrength: flareStrength,
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  group.add(corona);

  const prominences = createProminences(time);
  group.add(prominences.object);

  return {
    object: group,
    /** Advance the animation to `seconds` since the scene started. */
    update(seconds: number) {
      time.value = seconds;
      // A slow turn, so features drift across the face.
      surface.rotation.y = seconds * 0.01;
      prominences.update(seconds);
      for (let i = 0; i < FLARE_COUNT; i++) {
        const flare = flareState(i, seconds);
        flareAngle.value[i] = flare.angle;
        flareStrength.value[i] = flare.strength;
      }
    },
  };
}
