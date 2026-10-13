import { describe, expect, it } from 'vitest';

// Proves the test runner works with TypeScript and Astro's Vite config.
// Delete once real tests exist (Task 6).
describe('test setup', () => {
  it('runs TypeScript tests', () => {
    const greeting: string = 'hello';
    expect(greeting).toBe('hello');
  });
});
