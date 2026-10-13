import { describe, expect, it } from 'vitest';
import { fetchRepos, prettifyName, toProjects, type GitHubRepo } from './github';

// Only the fields we read; the real API returns many more.
const repo = (overrides: Partial<GitHubRepo>): GitHubRepo => ({
  name: 'example',
  description: 'An example',
  language: 'TypeScript',
  stargazers_count: 0,
  created_at: '2025-01-01T00:00:00Z',
  homepage: null,
  html_url: 'https://github.com/someone/example',
  topics: ['portfolio'],
  fork: false,
  ...overrides,
});

describe('prettifyName', () => {
  it('splits CamelCase into words', () => {
    expect(prettifyName('SignLanguageRecognitionAndTranslation')).toBe('Sign Language Recognition And Translation');
  });

  it('turns dashes and underscores into spaces and capitalises', () => {
    expect(prettifyName('cpu_emu')).toBe('Cpu Emu');
    expect(prettifyName('Aegis-Predictive-Sentry')).toBe('Aegis Predictive Sentry');
  });

  it('keeps acronyms together', () => {
    expect(prettifyName('WebProgrammingCSE206')).toBe('Web Programming CSE206');
  });
});

describe('toProjects', () => {
  it('keeps only repos tagged "portfolio"', () => {
    const projects = toProjects([repo({ name: 'shown' }), repo({ name: 'hidden', topics: ['other'] })]);
    expect(projects.map((p) => p.repo)).toEqual(['shown']);
  });

  it('orders projects from first built to latest', () => {
    const projects = toProjects([
      repo({ name: 'newer', created_at: '2026-03-01T00:00:00Z' }),
      repo({ name: 'older', created_at: '2024-03-01T00:00:00Z' }),
    ]);
    expect(projects.map((p) => p.repo)).toEqual(['older', 'newer']);
  });

  it('maps the fields the site uses', () => {
    const [p] = toProjects([
      repo({
        name: 'cpu_emu',
        description: 'A CPU emulator',
        language: 'Java',
        stargazers_count: 3,
        homepage: 'https://emu.example.com',
        html_url: 'https://github.com/someone/cpu_emu',
      }),
    ]);
    expect(p).toEqual({
      repo: 'cpu_emu',
      title: 'Cpu Emu',
      description: 'A CPU emulator',
      language: 'Java',
      stars: 3,
      createdAt: '2025-01-01T00:00:00Z',
      homepage: 'https://emu.example.com',
      url: 'https://github.com/someone/cpu_emu',
    });
  });

  it('treats missing or empty description, language and homepage as absent', () => {
    const [p] = toProjects([repo({ description: null, language: null, homepage: '' })]);
    expect(p.description).toBeUndefined();
    expect(p.language).toBeUndefined();
    expect(p.homepage).toBeUndefined();
  });

  it('returns an empty list when nothing is tagged', () => {
    expect(toProjects([repo({ topics: [] })])).toEqual([]);
  });
});

describe('fetchRepos', () => {
  // A fake fetch that serves pages from memory, so tests never touch the network.
  const fakeFetch = (pages: GitHubRepo[][], status = 200) => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fn = async (url: string, init?: { headers?: Record<string, string> }) => {
      calls.push({ url, headers: init?.headers ?? {} });
      const page = Number(new URL(url).searchParams.get('page'));
      return {
        ok: status === 200,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        json: async () => pages[page - 1] ?? [],
      };
    };
    return { fn, calls };
  };

  it('reads every page until an empty one', async () => {
    const full = Array.from({ length: 100 }, (_, i) => repo({ name: `r${i}` }));
    const { fn, calls } = fakeFetch([full, [repo({ name: 'last' })]]);
    const repos = await fetchRepos('someone', { fetch: fn });
    expect(repos).toHaveLength(101);
    expect(calls).toHaveLength(2); // a short page means there are no more
  });

  it('sends the token when one is given', async () => {
    const { fn, calls } = fakeFetch([[repo({})]]);
    await fetchRepos('someone', { fetch: fn, token: 'abc' });
    expect(calls[0].headers.Authorization).toBe('Bearer abc');
  });

  it('throws a clear error when GitHub answers with an error', async () => {
    const { fn } = fakeFetch([], 503);
    await expect(fetchRepos('someone', { fetch: fn })).rejects.toThrow(/GitHub API 503/);
  });
});
