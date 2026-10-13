// Loads the projects once per build. Used by the page layout.
//
// - In CI (GitHub Actions sets CI=true) a GitHub failure fails the build, so the live
//   site keeps its last good version instead of deploying an empty star chart.
// - Locally, a failure (e.g. offline) falls back to sample data so you can keep working.
// - `PROJECTS=sample npm run dev` forces the sample data, handy while your real repos
//   aren't tagged yet.

import sample from '../data/projects.sample.json';
import { fetchRepos, GITHUB_USER, toProjects, type GitHubRepo, type Project } from './github';

const MAX_PROJECTS = 15;
let cached: Promise<Project[]> | undefined;

async function load(): Promise<Project[]> {
  if (process.env.PROJECTS === 'sample') return toProjects(sample as GitHubRepo[]);
  try {
    const projects = toProjects(await fetchRepos(GITHUB_USER, { token: process.env.GITHUB_TOKEN }));
    if (projects.length > MAX_PROJECTS) {
      console.warn(`[projects] ${projects.length} repos are tagged "portfolio" (the plan is at most ${MAX_PROJECTS}).`);
    }
    return projects;
  } catch (error) {
    if (process.env.CI) throw error;
    console.warn(`[projects] Couldn't reach GitHub (${(error as Error).message}); using sample projects.`);
    return toProjects(sample as GitHubRepo[]);
  }
}

/** Both language pages call this; GitHub is only asked once per build. */
export function loadProjects(): Promise<Project[]> {
  cached ??= load();
  return cached;
}
