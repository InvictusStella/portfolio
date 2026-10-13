// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://invictusstella.github.io',
	// The repo is InvictusStella/portfolio, so GitHub Pages serves it under /portfolio/.
	base: '/portfolio/',
});
