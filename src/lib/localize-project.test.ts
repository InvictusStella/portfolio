import { describe, expect, it } from 'vitest';
import type { Project } from './github';
import { localizeProject, type ProjectOverrides } from './localize-project';

const project: Project = {
  repo: 'sample_iot_platform',
  title: 'Sample Iot Platform',
  description: 'A backend for sensors.',
  stars: 0,
  createdAt: '2025-01-01',
  url: 'https://github.com/x/sample_iot_platform',
};

const overrides: ProjectOverrides = {
  sample_iot_platform: {
    title: 'Sample IoT Platform',
    description: { tr: 'Sensörler için bir backend.' },
  },
};

describe('localizeProject', () => {
  it('uses the Turkish description on the Turkish page', () => {
    expect(localizeProject(project, 'tr', overrides).description).toBe('Sensörler için bir backend.');
  });

  it('keeps the GitHub description on the English page', () => {
    expect(localizeProject(project, 'en', overrides).description).toBe('A backend for sensors.');
  });

  it('falls back to the GitHub description when there is no Turkish one', () => {
    expect(localizeProject(project, 'tr', {}).description).toBe('A backend for sensors.');
  });

  it('applies a title override in both languages', () => {
    expect(localizeProject(project, 'en', overrides).title).toBe('Sample IoT Platform');
    expect(localizeProject(project, 'tr', overrides).title).toBe('Sample IoT Platform');
  });

  it('changes nothing else', () => {
    const { title, description, ...rest } = localizeProject(project, 'tr', overrides);
    const { title: _t, description: _d, ...original } = project;
    expect(rest).toEqual(original);
  });
});
