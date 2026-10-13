// Everything hand-written on the site lives here. Every visible text has an
// English and a Turkish version; TypeScript fails the build if one is missing.

export type Localized = { en: string; tr: string };

export type SkillGroup = { label: Localized; skills: string[] };

export type Experience = {
  role: Localized;
  company: string;
  place: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM"; leave out for a current role. */
  end?: string;
  /** One sentence. */
  summary: Localized;
};

export type Profile = {
  name: string;
  /** Shown in the avatar until a photo is added. */
  initials: string;
  tagline: Localized;
  bio: Localized;
  skillGroups: SkillGroup[];
  hobbies: Localized[];
  /** Newest first. */
  experience: Experience[];
  contact: {
    email: string;
    github: string;
    linkedin?: string;
  };
};

export const profile: Profile = {
  name: 'Muhammed Kaan Uman',
  initials: 'KU',
  tagline: {
    en: "Let's build the future together.",
    tr: 'Geleceği birlikte inşa edelim.',
  },
  bio: {
    en:
      'Software engineer with a Computer Science foundation and hands-on production experience across ' +
      'backend systems, cloud infrastructure and machine learning integration. I have built and deployed ' +
      'microservices in Go and Python on Azure, and applied ML in projects spanning computer vision and IoT. ' +
      "I'm drawn to problems at the intersection of systems and intelligence — distributed backends, " +
      'data-driven applications, and embedded and interactive systems.',
    tr:
      'Bilgisayar mühendisliği temeline ve backend sistemleri, bulut altyapısı ve makine öğrenmesi ' +
      'entegrasyonu alanlarında gerçek üretim deneyimine sahip bir yazılım mühendisiyim. Azure üzerinde Go ' +
      've Python ile mikroservisler geliştirip yayına aldım; bilgisayarlı görü ve IoT projelerinde makine ' +
      'öğrenmesi uyguladım. Sistemlerle zekânın kesiştiği problemler ilgimi çekiyor — dağıtık backendler, ' +
      'veri odaklı uygulamalar, gömülü ve etkileşimli sistemler.',
  },
  skillGroups: [
    { label: { en: 'Languages', tr: 'Diller' }, skills: ['Go', 'Python', 'C#', 'Java', 'C++'] },
    {
      label: { en: 'Backend', tr: 'Backend' },
      skills: ['REST APIs', 'Microservices', 'Distributed systems', 'gRPC', 'OAuth / JWT'],
    },
    {
      label: { en: 'Databases', tr: 'Veritabanları' },
      skills: ['PostgreSQL', 'Cosmos DB', 'Azure SQL', 'MongoDB'],
    },
    {
      label: { en: 'Cloud & infra', tr: 'Bulut ve altyapı' },
      skills: ['Azure Container Apps', 'Azure App Service', 'Azure Functions', 'Azure Monitor', 'Docker'],
    },
    {
      label: { en: 'AI & ML', tr: 'Yapay zekâ ve ML' },
      skills: ['Gemini API', 'LLM integration', 'TensorFlow / Keras', 'MediaPipe', 'OpenCV', 'Claude', 'AI Assisted Development'],
    },
    { label: { en: 'Tools', tr: 'Araçlar' }, skills: ['Git', 'Postman', 'Ollama'] },
  ],
  hobbies: [{ en: 'Space & astronomy', tr: 'Uzay ve astronomi' }, {en: 'Bodybuilding', tr: 'Vücut Geliştirme'},
    {en: 'Video Games', tr:'Video Oyunları'}
  ],
  experience: [
    {
      role: { en: 'Backend Development Intern', tr: 'Backend Geliştirme Stajyeri' },
      company: 'Revlo AI',
      place: 'Antalya',
      start: '2025-10',
      end: '2026-02',
      summary: {
        en:
          'Extended production Go microservices on Azure, designed Cosmos DB and Azure SQL schemas, and ' +
          'standardised Gemini API integration so new AI features shipped faster.',
        tr:
          'Azure üzerindeki Go mikroservislerini geliştirdim, Cosmos DB ve Azure SQL şemaları tasarladım ve ' +
          'Gemini API entegrasyonunu standartlaştırarak yeni yapay zekâ özelliklerinin daha hızlı yayına ' +
          'çıkmasını sağladım.',
      },
    },
    {
      role: { en: 'Software Engineering Intern', tr: 'Yazılım Mühendisliği Stajyeri' },
      company: 'Talya Bilişim',
      place: 'Antalya',
      start: '2024-07',
      end: '2024-08',
      summary: {
        en: 'Built REST API endpoints in .NET and C# for a B2B enterprise application and containerised services with Docker.',
        tr: 'B2B kurumsal bir uygulama için .NET ve C# ile REST API uç noktaları geliştirdim ve servisleri Docker ile konteynerleştirdim.',
      },
    },
  ],
  contact: {
    email: 'kaanuman_07@hotmail.com',
    github: 'https://github.com/InvictusStella',
    linkedin: 'https://www.linkedin.com/in/kaan-uman', // add the URL to show the link
  },
};
