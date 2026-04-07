export const freelancers = [
  {
    id: 1, initials: 'AR', color: '#E1F5EE', tcolor: '#085041',
    name: 'Alex Reyes', role: 'Brand & UI Designer', cat: 'Design',
    skills: ['Branding', 'UI Design', 'Figma', 'Logo', 'Illustration'],
    rate: '$85/hr', minBudget: 500, avail: true,
    email: 'alex@reyesdesign.co', portfolio: 'reyesdesign.co',
    bio: 'I help startups build strong visual identities. 5+ years with founders from seed to Series B. Brand clarity is my focus - making sure your visuals do real market work.'
  },
  {
    id: 2, initials: 'ST', color: '#EEEDFE', tcolor: '#3C3489',
    name: 'Sam Torres', role: 'Full-stack Developer', cat: 'Development',
    skills: ['React', 'Node.js', 'PostgreSQL', 'APIs', 'TypeScript'],
    rate: '$95/hr', minBudget: 1000, avail: true,
    email: 'sam@torresdev.io', portfolio: 'torresdev.io',
    bio: 'I build fast, scalable web apps. 7 years, 40+ projects shipped. Specializing in React + Node with a product mindset - I care about what ships, not just what compiles.'
  },
  {
    id: 3, initials: 'DK', color: '#FAEEDA', tcolor: '#633806',
    name: 'Dana Kim', role: 'Content & Copywriter', cat: 'Writing',
    skills: ['SEO Copy', 'Blog Writing', 'Email', 'Brand Voice', 'UX Copy'],
    rate: '$60/hr', minBudget: 300, avail: true,
    email: 'dana@danakimwrites.com', portfolio: 'danakimwrites.com',
    bio: 'Words that convert. I write for SaaS, e-commerce, and consumer brands. My copy is built on research first - I need to understand your customer before I write a single word.'
  },
  {
    id: 4, initials: 'LP', color: '#FAECE7', tcolor: '#712B13',
    name: 'Lena Park', role: 'Marketing Strategist', cat: 'Marketing',
    skills: ['Growth Strategy', 'Paid Ads', 'Funnels', 'Analytics', 'CRO'],
    rate: '$110/hr', minBudget: 800, avail: false,
    email: 'lena@lenapark.co', portfolio: 'lenapark.co',
    bio: 'Ex-agency head of growth. I help B2B and DTC brands build scalable acquisition systems. I do not run campaigns - I design the full-funnel strategy your team then executes.'
  },
  {
    id: 5, initials: 'RM', color: '#E6F1FB', tcolor: '#0C447C',
    name: 'Raj Menon', role: 'Mobile Developer', cat: 'Development',
    skills: ['iOS', 'Android', 'React Native', 'Swift', 'Expo'],
    rate: '$100/hr', minBudget: 1500, avail: true,
    email: 'raj@rajmenon.dev', portfolio: 'rajmenon.dev',
    bio: 'I build polished mobile apps for startups and scaleups. 12 published apps, 4.8+ App Store average. I work best when given the problem, not just the spec.'
  },
  {
    id: 6, initials: 'CM', color: '#FBEAF0', tcolor: '#72243E',
    name: 'Cleo Marsh', role: 'UX Researcher', cat: 'Design',
    skills: ['User Testing', 'Wireframes', 'Interviews', 'Journey Mapping', 'Miro'],
    rate: '$80/hr', minBudget: 400, avail: true,
    email: 'cleo@cleomarsh.com', portfolio: 'cleomarsh.com',
    bio: 'I turn user insights into product decisions. 6 years in UX for fintech and healthtech. I can run end-to-end research or slot into your existing design process.'
  }
];

export const defaultSkills = ['Branding', 'UI Design', 'Figma', 'Logo', 'Illustration'];

export const defaultTriggers = [
  { id: 'meet', checked: true, label: 'Client agrees to a meeting', sub: 'Highest priority - fire immediately' },
  { id: 'budget', checked: true, label: 'Client mentions a budget over $500', sub: 'Signals a serious lead' },
  { id: 'proposal', checked: true, label: 'Client asks for a proposal', sub: 'Late-stage intent signal' },
  { id: 'newchat', checked: false, label: 'Every new chat starts', sub: 'High volume - use with care' },
  { id: 'badfit', checked: true, label: 'Bot redirects a bad-fit lead', sub: 'So you can review the threshold' }
];

export const serviceCatalog = [
  { value: 'brand-identity', label: 'Brand identity', category: 'Design', skill: 'Branding' },
  { value: 'ui-ux', label: 'UI / UX design', category: 'Design', skill: 'UI Design' },
  { value: 'web-app', label: 'Web app development', category: 'Development', skill: 'React' },
  { value: 'mobile-app', label: 'Mobile app development', category: 'Development', skill: 'React Native' },
  { value: 'content-strategy', label: 'Content strategy', category: 'Writing', skill: 'SEO Copy' },
  { value: 'growth-marketing', label: 'Growth marketing', category: 'Marketing', skill: 'Growth Strategy' }
];

export const categorySkillMap = {
  Design: ['Branding', 'UI Design', 'Figma', 'Logo', 'Illustration', 'User Testing', 'Wireframes'],
  Development: ['React', 'Node.js', 'PostgreSQL', 'APIs', 'TypeScript', 'React Native', 'Swift', 'Expo'],
  Writing: ['SEO Copy', 'Blog Writing', 'Email', 'Brand Voice', 'UX Copy'],
  Marketing: ['Growth Strategy', 'Paid Ads', 'Funnels', 'Analytics', 'CRO'],
  Photography: ['Portraits', 'Retouching', 'Lighting', 'Editing']
};
