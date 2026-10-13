// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://invictusstella.github.io',
	// The repo is InvictusStella/portfolio, so GitHub Pages serves it under /portfolio/.
	base: '/portfolio/',
	build: {
		// The CSS is small (~3.5 KB): inline it so it doesn't block the first paint.
		inlineStylesheets: 'always',
	},
	vite: {
		build: {
			// Three.js is ~530 KB raw / ~130 KB gzipped, loaded lazily after the page shows.
			// That's within budget, so only warn if a chunk grows beyond it.
			chunkSizeWarningLimit: 600,
		},
	},
});
