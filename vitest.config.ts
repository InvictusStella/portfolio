/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig makes tests resolve imports the same way Astro does.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
