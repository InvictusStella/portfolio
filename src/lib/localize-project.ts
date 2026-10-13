import type { Lang } from '../i18n/ui';
import type { Project } from './github';

/**
 * Per-repo touch-ups GitHub can't hold: a nicer title, a Turkish description.
 */
export type ProjectOverrides = Record<
  string,
  {
    /**
     * Replaces the title made from the repo name (both languages), e.g. "IoT"
     * instead of "Iot".
     */
    title?: string;
    /** GitHub has one description per repo; this adds the Turkish one. */
    description?: { tr: string };
  }
>;

/** The project as shown on a page in `lang`, with any overrides applied. */
export function localizeProject(
  project: Project,
  lang: Lang,
  overrides: ProjectOverrides,
): Project {
  const override = overrides[project.repo];
  if (!override) return project;
  return {
    ...project,
    title: override.title ?? project.title,
    description:
      (lang === 'tr' && override.description?.tr) || project.description,
  };
}
