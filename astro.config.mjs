// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://invictusstella.github.io',
	// The repo is InvictusStella/portfolio, so GitHub Pages serves it under /portfolio/.
	base: '/portfolio/',
	vite: {
		build: {
			// Three.js is ~530 KB raw / ~130 KB gzipped, loaded lazily after the page shows.
			// That's within budget, so only warn if a chunk grows beyond it.
			chunkSizeWarningLimit: 600,
		},
	},
});
