// Interface labels (not personal content — that lives in src/content/profile.ts).

export type Lang = 'en' | 'tr';

export const ui = {
  scrollHint: { en: 'Scroll to begin the journey', tr: 'Yolculuğa başlamak için kaydır' },
  aboutHeading: { en: 'About me', tr: 'Hakkımda' },
  photoAlt: { en: 'Photo of {name}', tr: '{name} fotoğrafı' },
  skillsHeading: { en: 'Skills', tr: 'Yetenekler' },
  hobbiesHeading: { en: 'Hobbies', tr: 'Hobiler' },
  experienceHeading: { en: 'Experience', tr: 'Deneyim' },
  downloadCv: { en: 'Download CV (PDF)', tr: 'Özgeçmişi indir (PDF)' },
  cvShort: { en: 'CV', tr: 'CV' },
  contactHeading: { en: 'Get in touch', tr: 'İletişim' },
  email: { en: 'Email', tr: 'E-posta' },
  signOff: { en: 'Thanks for flying by.', tr: 'Uğradığın için teşekkürler.' },
} satisfies Record<string, { en: string; tr: string }>;
