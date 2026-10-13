// Projects come from GitHub at build time: every public repo tagged with the
// `portfolio` topic becomes a star on the chart.

export const GITHUB_USER = 'InvictusStella';
export const PORTFOLIO_TOPIC = 'portfolio';

/** The fields we read from GitHub's "list repositories" response. */
export type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  created_at: string;
  homepage: string | null;
  html_url: string;
  topics: string[];
  fork: boolean;
};

/** A project as the site uses it. */
export type Project = {
  /** The repo's name on GitHub, e.g. "cpu_emu". */
  repo: string;
  /** A readable title, e.g. "Cpu Emu". */
  title: string;
  description?: string;
  language?: string;
  stars: number;
  createdAt: string;
  homepage?: string;
  url: string;
};

/** "SignLanguageRecognition" / "cpu_emu" / "Aegis-Predictive-Sentry" → words with capitals. */
export function prettifyName(name: string): string {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // ACRONYMWord boundary
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/** Tagged repos only, in the order they were built (first → latest). */
export function toProjects(repos: GitHubRepo[]): Project[] {
  return repos
    .filter((r) => r.topics.includes(PORTFOLIO_TOPIC))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((r) => ({
      repo: r.name,
      title: prettifyName(r.name),
      description: r.description || undefined,
      language: r.language || undefined,
      stars: r.stargazers_count,
      createdAt: r.created_at,
      homepage: r.homepage || undefined,
      url: r.html_url,
    }));
}

type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{ ok: boolean; status: number; statusText: string; json(): Promise<unknown> }>;

/** Every public repo of `user`, following pages of 100 until the last one. */
export async function fetchRepos(
  user: string,
  { token, fetch: fetchFn = fetch as unknown as FetchLike }: { token?: string; fetch?: FetchLike } = {},
): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const all: GitHubRepo[] = [];
  for (let page = 1; ; page++) {
    const url = `https://api.github.com/users/${user}/repos?type=owner&per_page=100&page=${page}`;
    const response = await fetchFn(url, { headers });
    if (!response.ok) throw new Error(`GitHub API ${response.status} ${response.statusText} for ${url}`);
    const repos = (await response.json()) as GitHubRepo[];
    all.push(...repos);
    if (repos.length < 100) return all;
  }
}
