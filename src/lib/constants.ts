export const SITE = {
  name: "Amr",
  brand: "Amr Studio",
  role: "Creative Developer · Digital Experience Designer",
  tagline:
    "Independent creative developer in Salmiya, Kuwait. Cinematic interfaces, motion first websites, and product engineering for studios and founders who care about the millisecond.",
  shortTagline:
    "Designing cinematic interfaces and shipping software that feels inevitable.",
  city: "Salmiya, Kuwait",
  region: "KW",
  email: "lowmoch@gmail.com",
  // E.164 format, digits only, used for wa.me links
  whatsapp: "96560318366",
  // Production URL, swap for your custom domain when you have one
  url: "https://amrstudio.vercel.app",
  twitter: "@amrstudio",
  keywords: [
    "creative developer",
    "Kuwait web design",
    "Salmiya developer",
    "Next.js developer Kuwait",
    "motion design",
    "Framer Motion",
    "Three.js",
    "WebGL",
    "Lenis smooth scroll",
    "portfolio Kuwait",
    "frontend architect",
    "cinematic web design",
    "Awwwards",
    "Amr Studio",
  ],
} as const;

export const waLink = (msg?: string) =>
  `https://wa.me/${SITE.whatsapp}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

// Shared soft click used by the OptionWheel and the site-wide UI tick (SoundFX).
export const CLICK_SOUND = "/assets/sounds/click-soft.wav";

export const NAV_LINKS = [
  { label: "Index", href: "#index" },
  { label: "Work", href: "#work" },
  { label: "Craft", href: "#craft" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
] as const;

export type Project = {
  slug: string;
  title: string;
  client: string;
  year: string;
  role: string;
  status: "Live" | "In Development" | "Shipped" | "Featured";
  url: string;
  category: string;
  index: string;
  image?: string;
  summary: string;
  challenge: string;
  approach: string;
  outcome: string;
  stack: string[];
  metrics?: { label: string; value: string }[];
  palette: { bg: string; ink: string; accent: string };
};

export const PROJECTS: Project[] = [
  {
    slug: "scenarios",
    title: "Scenarios · Spaces, Scripted into Reality",
    client: "Scenarios Design",
    year: "2025",
    role: "Brand · Frontend Architect",
    status: "Featured",
    url: "https://scenariosd.vercel.app",
    category: "Fit out · General Contracting",
    index: "01",
    image: "/projects/scenarios.png",
    summary:
      "An editorial, brutalist site for a Kuwait based fit out and general contracting studio. The web equivalent of walking into a finished space.",
    challenge:
      "Contracting studios usually present themselves as catalogues: galleries, price points, certifications. Scenarios needed to read like a creative house: confident, restrained, and structured like a six act script.",
    approach:
      "I built the site around the studio’s own metaphor, every project is a script, every page a scene. Oversized serif type, generous whitespace, an ember accent dot, and motion timed to the rhythm of a stage cue.",
    outcome:
      "A site that moved Scenarios from contractor to creative studio in the buyer’s mind, and won them their first international RFP within a month of launch.",
    stack: ["Next.js 15", "TypeScript", "Tailwind", "Framer Motion", "Lenis", "Vercel"],
    metrics: [
      { label: "RFP win rate", value: "+62%" },
      { label: "Avg session", value: "4:18" },
      { label: "Lighthouse perf", value: "98" },
    ],
    palette: { bg: "#0A0A0A", ink: "#EFEAE2", accent: "#FF4D1F" },
  },
  {
    slug: "quipmed",
    title: "Quipmed · Leading Medical Innovation",
    client: "Quipmed",
    year: "2024",
    role: "Frontend Architect",
    status: "Live",
    url: "https://quipmed.co",
    category: "Medical · Distribution",
    index: "02",
    image: "/projects/quipmed.png",
    summary:
      "A precision engineered presence for a Kuwait based medical equipment distributor, with 25+ brand partners, 170+ product lines, and 24/7 technical support.",
    challenge:
      "Medical distribution sites are usually flat directories. Quipmed needed to feel as serious as the equipment it sources: calm, exact, and quietly authoritative.",
    approach:
      "A clinical green on ink system. Floating credibility badges (ISO, brand partners, 24/7), an anatomical hero, and a system of micro interactions that signal precision at every hover.",
    outcome:
      "A site clinicians and procurement managers actually trust. Bounce rate down 38%, partner inquiries up sharply within the first quarter.",
    stack: ["Next.js", "TypeScript", "Tailwind", "Framer Motion", "i18n"],
    palette: { bg: "#0F1310", ink: "#EFEAE2", accent: "#7DD3A8" },
  },
  {
    slug: "livfunctional",
    title: "LivFunctional · Healing, Rooted in Science",
    client: "LivFunctional",
    year: "2024",
    role: "Creative Developer · Brand",
    status: "Shipped",
    url: "https://livfunctional.com",
    category: "Wellness · Functional Medicine",
    index: "03",
    image: "/projects/livfunctional.png",
    summary:
      "The first bilingual holistic wellness program in the Middle East. Built on functional medicine, NLP, and metabolic health, presented like a science magazine, not a clinic.",
    challenge:
      "Wellness brands in the region either feel medical and clinical or fluffy and Instagram like. LivFunctional needed the rare third register: rigorous, warm, and unapologetically modern.",
    approach:
      "An off white editorial palette, generous serif headlines, and a live glucose visualization that proves the science in real time. Bilingual EN/AR from the first commit, RTL correct everywhere.",
    outcome:
      "A consultation funnel that converts at 4.1% from cold traffic, a number wellness clinics in the region rarely see.",
    stack: ["Next.js", "Tailwind", "Framer Motion", "i18n / RTL", "Stripe"],
    palette: { bg: "#EFEAE2", ink: "#0F1310", accent: "#1F6F4A" },
  },
  {
    slug: "smartee",
    title: "Smartee · Tomorrow’s Smile, by the Millimeter",
    client: "Smartee Kuwait",
    year: "2026",
    role: "Founding Designer · Engineer",
    status: "In Development",
    url: "https://smartee.vercel.app",
    category: "Orthodontic · Clinical Tech",
    index: "04",
    image: "/projects/smartee.png",
    summary:
      "A clinical grade aligner studio in Kuwait City, with three minute scans, real time simulation, and a treatment plan you can watch unfold tooth by tooth. Currently in build.",
    challenge:
      "Aligner brands either feel cosmetic or feel hospital. Smartee needed to feel like aerospace: precise, calm, and quietly futuristic. A clinical product with the visual confidence of a tech launch.",
    approach:
      "Concentric radial lattices, scientific telemetry chips (0.04mm scan, 0.12N pressure, 47° arch correction), and a deep crimson palette that reads premium without reading dental.",
    outcome:
      "Currently in private beta with the founding clinical team. Public launch and first patient cohort scheduled for Q3 2026.",
    stack: ["Next.js 15", "React Server Components", "TS", "Framer Motion", "Three.js"],
    palette: { bg: "#1A0608", ink: "#EFEAE2", accent: "#E0303A" },
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "Amr doesn’t ship features, he ships moments. The work feels considered down to the millisecond, and clients notice within thirty seconds.",
    author: "Studio Founder",
    role: "Scenarios Design",
  },
  {
    quote:
      "He took a vague brief and returned a product that closed our first enterprise pilot. The motion alone moved the needle.",
    author: "Head of Product",
    role: "Healthcare SaaS · Kuwait",
  },
  {
    quote:
      "Frontend craft at the level you usually only see in studios with twenty engineers. He’s one.",
    author: "Engineering Director",
    role: "Regional Startup",
  },
  {
    quote:
      "Most portfolios are static. His site is the proof.",
    author: "Creative Director",
    role: "Brand Studio",
  },
];

export const CAPABILITIES = [
  { title: "Product Engineering", items: ["Next.js 15 / RSC", "TypeScript", "Edge runtimes", "Vercel / Cloudflare"] },
  { title: "Motion & Interaction", items: ["Framer Motion", "GSAP / ScrollTrigger", "Lenis", "Choreography systems"] },
  { title: "3D & Immersive", items: ["Three.js / R3F", "Shaders (GLSL)", "WebGL", "Spatial UI"] },
  { title: "Design Systems", items: ["Tokens & theming", "shadcn/ui", "Tailwind architecture", "A11y baked in"] },
  { title: "Bilingual / RTL", items: ["Arabic + English from day one", "RTL correct motion", "Locale aware UX", "Type pairing"] },
  { title: "Brand Direction", items: ["Editorial systems", "Typography", "Motion identity", "Cinematic storytelling"] },
  { title: "Social Media Marketing", items: ["Content & campaign strategy", "Paid social · Meta / TikTok", "Creative & short form video", "Analytics & growth (SMMA)"] },
];

export const PROCESS = [
  {
    no: "01",
    title: "Listen",
    body: "Strategy before pixels. I interrogate the brief until the real problem surfaces, usually it’s not the one in the doc.",
  },
  {
    no: "02",
    title: "Frame",
    body: "A single hero metaphor. One idea the whole product can hang from. If it doesn’t survive five minutes of pressure, it dies.",
  },
  {
    no: "03",
    title: "Compose",
    body: "Editorial layouts, opinionated motion, system level thinking. Every screen earns its place.",
  },
  {
    no: "04",
    title: "Ship",
    body: "Production grade engineering on day one. No throwaway prototypes, the demo is the product.",
  },
  {
    no: "05",
    title: "Tune",
    body: "Frame rate is a feature. Latency is a feature. The site you’re on right now is tuned to 60fps on a five year old laptop.",
  },
];
