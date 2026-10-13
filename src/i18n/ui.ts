// Interface labels (not personal content — that lives in
// src/content/profile.ts).

export type Lang = 'en' | 'tr';

export const ui = {
  scrollHint: {
    en: 'Scroll to begin the journey',
    tr: 'Yolculuğa başlamak için kaydır',
  },
  aboutHeading: { en: 'About me', tr: 'Hakkımda' },
  photoAlt: { en: 'Photo of {name}', tr: '{name} fotoğrafı' },
  skillsHeading: { en: 'Skills', tr: 'Yetenekler' },
  hobbiesHeading: { en: 'Hobbies', tr: 'Hobiler' },
  experienceHeading: { en: 'Experience', tr: 'Deneyim' },
  downloadCv: { en: 'Download CV (PDF)', tr: 'CV’yi indir (PDF)' },
  cvShort: { en: 'CV', tr: 'CV' },
  projectsHeading: { en: 'Projects', tr: 'Projeler' },
  projectsComingSoon: {
    en: 'First project coming soon.',
    tr: 'İlk proje yakında.',
  },
  chartCaption: {
    en: 'Each project lights up the next star of Scorpius, from the stinger to the claws.',
    tr: 'Her proje Akrep takımyıldızının bir sonraki yıldızını yakar: iğneden kıskaçlara.',
  },
  latestProject: { en: 'Latest', tr: 'En yeni' },
  viewCode: { en: 'Code', tr: 'Kod' },
  liveSite: { en: 'Live site', tr: 'Canlı site' },
  contactHeading: { en: 'Get in touch', tr: 'İletişim' },
  email: { en: 'Email', tr: 'E-posta' },
  signOff: { en: 'Thanks for flying by.', tr: 'Uğradığın için teşekkürler.' },
  returnToSun: { en: 'Return to Sun', tr: 'Güneşe dön' },
} satisfies Record<string, { en: string; tr: string }>;
