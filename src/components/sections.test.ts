import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';
import About from './About.astro';
import CvButton from './CvButton.astro';
import Footer from './Footer.astro';
import Hero from './Hero.astro';
import LangToggle from './LangToggle.astro';
import ProjectList from './ProjectList.astro';
import SceneCanvas from './SceneCanvas.astro';
import type { Profile } from '../content/profile';
import type { Project } from '../lib/github';

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
  experience: [
    {
      role: { en: 'Backend intern', tr: 'Backend stajyeri' },
      company: 'Engine Works',
      place: 'London',
      start: '2025-10',
      end: '2026-02',
      summary: { en: 'Built the analytical engine API.', tr: 'Analitik motor API’sini geliştirdim.' },
    },
    {
      role: { en: 'Software intern', tr: 'Yazılım stajyeri' },
      company: 'Loom Ltd',
      place: 'Manchester',
      start: '2024-07',
      end: '2024-08',
      summary: { en: 'Automated punch cards.', tr: 'Delikli kartları otomatikleştirdim.' },
    },
  ],
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

  it('hides the decorative sun from screen readers', async () => {
    const html = await container.renderToString(Hero, { props: { profile, lang: 'en' } });
    expect(html).toMatch(/class="[^"]*hero__sun[^"]*"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="[^"]*hero__sun/);
  });

  it('wraps sun and text in a stage that can be pinned during the departure', async () => {
    const html = await container.renderToString(Hero, { props: { profile, lang: 'en' } });
    expect(html).toMatch(/class="[^"]*hero__stage[^"]*"[\s\S]*hero__sun[\s\S]*<h1/);
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

describe('Experience timeline', () => {
  it('lists every entry in the given order, newest first', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'en' } });
    expect(html.indexOf('Engine Works')).toBeGreaterThan(-1);
    expect(html.indexOf('Engine Works')).toBeLessThan(html.indexOf('Loom Ltd'));
  });

  it('shows role, place, dates and summary for an entry', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'en' } });
    expect(html).toContain('Backend intern');
    expect(html).toContain('London');
    expect(html).toContain('Oct 2025 – Feb 2026');
    expect(html).toContain('Built the analytical engine API.');
  });

  it('uses the Turkish texts on the Turkish page', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'tr' } });
    expect(html).toContain('Backend stajyeri');
    expect(html).toContain('Eki 2025 – Şub 2026');
  });

  it('marks dates with machine-readable <time> elements', async () => {
    const html = await container.renderToString(About, { props: { profile, lang: 'en' } });
    expect(html).toMatch(/<time[^>]*datetime="2025-10"/);
  });
});

describe('CV button', () => {
  it('links to the CV PDF and asks the browser to download it', async () => {
    const html = await container.renderToString(CvButton, { props: { lang: 'en' } });
    expect(html).toMatch(/href="[^"]*cv\.pdf"/);
    expect(html).toMatch(/\sdownload(=|\s|>)/);
  });

  it('keeps the visible text inside the accessible label in both languages (voice control)', async () => {
    for (const lang of ['en', 'tr'] as const) {
      const html = await container.renderToString(CvButton, { props: { lang } });
      const label = html.match(/aria-label="([^"]*)"/)?.[1] ?? '';
      expect(label).toContain('CV');
    }
  });

  it('has an accessible label saying what it does', async () => {
    const html = await container.renderToString(CvButton, { props: { lang: 'en' } });
    expect(html).toContain('aria-label="Download CV (PDF)"');
  });
});

describe('Language toggle', () => {
  it('on the English page, links to the Turkish page', async () => {
    const html = await container.renderToString(LangToggle, { props: { lang: 'en' } });
    expect(html).toMatch(/<a[^>]*href="[^"]*\/tr\/"[^>]*hreflang="tr"|<a[^>]*hreflang="tr"[^>]*href="[^"]*\/tr\/"/);
  });

  it('on the Turkish page, links back to the English page', async () => {
    const html = await container.renderToString(LangToggle, { props: { lang: 'tr' } });
    expect(html).toMatch(/hreflang="en"/);
    expect(html).not.toMatch(/href="[^"]*\/tr\/"/);
  });

  it('marks the current language and does not link to it', async () => {
    const html = await container.renderToString(LangToggle, { props: { lang: 'en' } });
    expect(html).toMatch(/aria-current="true"[^>]*>\s*EN\s*</);
    expect(html).not.toMatch(/hreflang="en"/);
  });
});

describe('Scene canvas', () => {
  it('renders a decorative canvas hidden from screen readers', async () => {
    const html = await container.renderToString(SceneCanvas);
    expect(html).toMatch(/<canvas[^>]*class="[^"]*scene-canvas[^"]*"[^>]*aria-hidden="true"|<canvas[^>]*aria-hidden="true"[^>]*class="[^"]*scene-canvas/);
  });
});

describe('Project list', () => {
  const projects: Project[] = [
    { repo: 'first', title: 'First', description: 'The first one', language: 'Go', stars: 2, createdAt: '2024-01-01', url: 'https://github.com/x/first' },
    { repo: 'second', title: 'Second', stars: 0, createdAt: '2025-01-01', url: 'https://github.com/x/second', homepage: 'https://second.example.com' },
  ];

  it('shows every project in order, linking to its repo', async () => {
    const html = await container.renderToString(ProjectList, { props: { projects, lang: 'en' } });
    expect(html.indexOf('First')).toBeLessThan(html.indexOf('Second'));
    expect(html).toContain('href="https://github.com/x/first"');
  });

  it('shows description and language when present', async () => {
    const html = await container.renderToString(ProjectList, { props: { projects, lang: 'en' } });
    expect(html).toContain('The first one');
    expect(html).toContain('Go');
  });

  it('links to the live site only when there is one', async () => {
    const html = await container.renderToString(ProjectList, { props: { projects, lang: 'en' } });
    expect(html).toContain('href="https://second.example.com"');
    expect(html.match(/Live site/g)).toHaveLength(1);
  });

  it('says a first project is coming when nothing is tagged yet', async () => {
    const html = await container.renderToString(ProjectList, { props: { projects: [], lang: 'en' } });
    expect(html).toContain('First project coming soon');
  });

  it('uses Turkish labels on the Turkish page', async () => {
    const html = await container.renderToString(ProjectList, { props: { projects: [], lang: 'tr' } });
    expect(html).toContain('Projeler');
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
