import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';
import About from './About.astro';
import Footer from './Footer.astro';
import Hero from './Hero.astro';
import type { Profile } from '../content/profile';

// A small fixture, so these tests don't break whenever the real bio changes.
const profile: Profile = {
  name: 'Ada Lovelace',
  initials: 'AL',
  tagline: { en: 'Engineer of engines', tr: 'Motor mühendisi' },
  bio: { en: 'I write programs for machines.', tr: 'Makineler için program yazarım.' },
  skillGroups: [
    { label: { en: 'Languages', tr: 'Diller' }, skills: ['Go', 'Python'] },
    { label: { en: 'Cloud', tr: 'Bulut' }, skills: ['Azure'] },
  ],
  hobbies: [{ en: 'Astronomy', tr: 'Astronomi' }],
  contact: {
    email: 'ada@example.com',
    github: 'https://github.com/ada',
  },
};

let container: AstroContainer;
beforeEach(async () => {
  container = await AstroContainer.create();
});

describe('Hero', () => {
  it('shows the name as the page heading', async () => {
    const html = await container.renderToString(Hero, { props: { profile, lang: 'en' } });
    expect(html).toMatch(/<h1[^>]*>\s*Ada Lovelace\s*<\/h1>/);
  });

  it('shows the tagline in the requested language', async () => {
    const html = await container.renderToString(Hero, { props: { profile, lang: 'en' } });
    expect(html).toContain('Engineer of engines');
    expect(html).not.toContain('Motor mühendisi');
  });
});

describe('About', () => {
  it('shows the bio', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'en' } });
    expect(html).toContain('I write programs for machines.');
  });

  it('shows every skill group with its skills', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'en' } });
    for (const label of ['Languages', 'Cloud']) expect(html).toContain(label);
    for (const skill of ['Go', 'Python', 'Azure']) expect(html).toContain(`>${skill}<`);
  });

  it('shows hobbies', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'en' } });
    expect(html).toContain('Astronomy');
  });

  it('shows an initials placeholder when there is no photo', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'en' } });
    expect(html).toMatch(/class="[^"]*avatar[^"]*"[^>]*>[\s\S]*?AL/);
  });

  it('uses h2 for the section heading, keeping heading order below the h1', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'en' } });
    expect(html).toMatch(/<h2[^>]*>/);
    expect(html).not.toMatch(/<h1[^>]*>/);
  });
});

describe('Footer', () => {
  it('links to email and GitHub', async () => {
    const html = await container.renderToString(Footer, { props: { profile, lang: 'en' } });
    expect(html).toContain('href="mailto:ada@example.com"');
    expect(html).toContain('href="https://github.com/ada"');
  });

  it('omits LinkedIn when no URL is set', async () => {
    const html = await container.renderToString(Footer, { props: { profile, lang: 'en' } });
    expect(html).not.toContain('LinkedIn');
  });

  it('shows LinkedIn when a URL is set', async () => {
    const withLinkedIn: Profile = {
      ...profile,
      contact: { ...profile.contact, linkedin: 'https://www.linkedin.com/in/ada' },
    };
    const html = await container.renderToString(Footer, { props: { profile: withLinkedIn, lang: 'en' } });
    expect(html).toContain('href="https://www.linkedin.com/in/ada"');
  });
});
