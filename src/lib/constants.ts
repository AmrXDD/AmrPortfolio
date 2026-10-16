import type { Lang } from "./locale";

export const SITE = {
  name: "Amr",
  brand: "Amr Studio",
  role: "Web Developer · Designer · Brand Identity",
  tagline:
    "Independent web developer and designer in Salmiya, Kuwait. Cinematic, motion first websites, web design consultation, and brand identity for studios and founders who care about the millisecond.",
  shortTagline:
    "Designing cinematic interfaces and shipping software that feels inevitable.",
  city: "Salmiya, Kuwait",
  region: "KW",
  // Public contact address: shown on the site and in the schema.org JSON-LD.
  email: "info@amrstudio.dev",
  // E.164 format, digits only, used for wa.me links (Egypt: +20 150 771 0012)
  whatsapp: "201507710012",
  url: "https://amrstudio.dev",
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
    "web design consultation",
    "brand identity design",
    "تصميم مواقع",
    "تطوير مواقع",
    "هوية بصرية",
  ],
} as const;

/** Arabic versions of the SITE copy used in metadata and the hero. */
export const SITE_AR = {
  role: "مطوّر مواقع · مصمّم · هوية بصرية",
  tagline:
    "مطوّر ومصمّم مواقع مستقل في السالمية، الكويت. مواقع سينمائية تقودها الحركة، واستشارات في تصميم المواقع، وهويات بصرية للاستوديوهات والمؤسسين الذين يهتمّون بأدقّ التفاصيل.",
  city: "السالمية، الكويت",
} as const;

export const waLink = (msg?: string) =>
  `https://wa.me/${SITE.whatsapp}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

// Shared soft click used by the OptionWheel and the site-wide UI tick (SoundFX).
export const CLICK_SOUND = "/assets/sounds/click-soft.wav";

export const NAV_LINKS = [
  { label: "Index", key: "nav.home", href: "#top" },
  { label: "Work", key: "nav.work", href: "#work" },
  { label: "Craft", key: "nav.craft", href: "#craft" },
  { label: "Process", key: "nav.process", href: "#process" },
  { label: "Contact", key: "nav.contact", href: "#contact" },
] as const;

/** Fields of a project that are written in a language (the rest are shared). */
type ProjectCopy = {
  title: string;
  client: string;
  role: string;
  category: string;
  summary: string;
  challenge: string;
  approach: string;
  outcome: string;
};

export type Project = ProjectCopy & {
  slug: string;
  year: string;
  status: "Live" | "In Development" | "Shipped" | "Featured";
  url: string;
  index: string;
  image?: string;
  stack: string[];
  /** Only figures that can be backed up with the client's own data. */
  metrics?: { label: string; value: string }[];
  palette: { bg: string; ink: string; accent: string };
  ar: ProjectCopy;
};

/*
 * Results copy is deliberately qualitative: no conversion rates, bounce rates
 * or win rates unless the client has signed off on the figure in writing.
 */
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
      "A site that presents Scenarios as a creative studio rather than a contractor, and gives them something to send ahead of every pitch.",
    stack: ["Next.js 15", "TypeScript", "Tailwind", "Framer Motion", "Lenis", "Vercel"],
    palette: { bg: "#0A0A0A", ink: "#EFEAE2", accent: "#FF4D1F" },
    ar: {
      title: "Scenarios · مساحات تُكتب كالسيناريو",
      client: "Scenarios Design",
      role: "الهوية · هندسة الواجهات",
      category: "تجهيزات داخلية · مقاولات عامة",
      summary:
        "موقع تحريري بطابع بروتالي لاستوديو كويتي متخصص في التجهيزات الداخلية والمقاولات العامة. التجربة الرقمية المكافئة لدخول مساحة مكتملة.",
      challenge:
        "عادةً ما تقدّم شركات المقاولات نفسها ككتالوجات: معارض صور وأسعار وشهادات. كان على Scenarios أن تبدو كبيت إبداعي: واثقة ومتّزنة ومبنية كسيناريو من ستة فصول.",
      approach:
        "بنيت الموقع حول استعارة الاستوديو نفسه: كل مشروع سيناريو وكل صفحة مشهد. خط عريض بحجم كبير، ومساحات بيضاء سخية، ونقطة لونية جمرية، وحركة مضبوطة على إيقاع إشارات المسرح.",
      outcome:
        "موقع يقدّم Scenarios كاستوديو إبداعي لا كمقاول، ويمنحهم ما يرسلونه قبل كل عرض لعميل جديد.",
    },
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
      "A precision engineered presence for a Kuwait based medical equipment distributor, bringing its brand partners, product lines and technical support into one calm, exact catalogue.",
    challenge:
      "Medical distribution sites are usually flat directories. Quipmed needed to feel as serious as the equipment it sources: calm, exact, and quietly authoritative.",
    approach:
      "A clinical green on ink system. Floating credibility badges, an anatomical hero, and a system of micro interactions that signal precision at every hover.",
    outcome:
      "A site built for the clinicians and procurement managers who buy from Quipmed: clear enough to scan in a minute, detailed enough to trust.",
    stack: ["Next.js", "TypeScript", "Tailwind", "Framer Motion", "i18n"],
    palette: { bg: "#0F1310", ink: "#EFEAE2", accent: "#7DD3A8" },
    ar: {
      title: "Quipmed · ريادة في الابتكار الطبي",
      client: "Quipmed",
      role: "هندسة الواجهات",
      category: "طبي · توزيع",
      summary:
        "حضور رقمي مصمّم بدقة لموزّع معدّات طبية في الكويت، يجمع شركاءه من العلامات التجارية وخطوط منتجاته ودعمه الفني في كتالوج واحد هادئ ودقيق.",
      challenge:
        "مواقع التوزيع الطبي غالبًا ما تكون أدلّة جامدة. احتاجت Quipmed إلى حضور بجدّية المعدّات التي توفّرها: هادئ ودقيق وموثوق دون ضجيج.",
      approach:
        "نظام لوني أخضر سريري على خلفية داكنة، وشارات موثوقية عائمة، وواجهة رئيسية تشريحية، وتفاعلات دقيقة توحي بالإتقان مع كل تمرير.",
      outcome:
        "موقع مصمّم للأطباء ومسؤولي المشتريات الذين يتعاملون مع Quipmed: واضح بما يكفي لتصفّحه في دقيقة، ومفصّل بما يكفي ليُعتمد عليه.",
    },
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
      "A bilingual holistic wellness program built on functional medicine, NLP, and metabolic health, presented like a science magazine, not a clinic.",
    challenge:
      "Wellness brands in the region either feel medical and clinical or fluffy and Instagram like. LivFunctional needed the rare third register: rigorous, warm, and unapologetically modern.",
    approach:
      "An off white editorial palette, generous serif headlines, and a live glucose visualization that explains the science as you read. Bilingual EN/AR from the first commit, RTL correct everywhere.",
    outcome:
      "A bilingual consultation funnel that walks a cold visitor from the science to a booked consultation, in Arabic or English.",
    stack: ["Next.js", "Tailwind", "Framer Motion", "i18n / RTL", "Stripe"],
    palette: { bg: "#EFEAE2", ink: "#0F1310", accent: "#1F6F4A" },
    ar: {
      title: "LivFunctional · شفاء متجذّر في العلم",
      client: "LivFunctional",
      role: "تطوير إبداعي · الهوية",
      category: "العافية · الطب الوظيفي",
      summary:
        "برنامج عافية شامل ثنائي اللغة قائم على الطب الوظيفي والبرمجة اللغوية العصبية وصحة الأيض، يُقدَّم كمجلة علمية لا كعيادة.",
      challenge:
        "علامات العافية في المنطقة إمّا طبية وجافة أو خفيفة بطابع إنستغرام. احتاجت LivFunctional إلى نبرة ثالثة نادرة: رصينة ودافئة وعصرية بلا تردّد.",
      approach:
        "لوحة ألوان تحريرية بيضاء دافئة، وعناوين كبيرة بخط مُذيَّل، ورسم حيّ لمستوى الجلوكوز يشرح العلم أثناء القراءة. ثنائي اللغة من أول سطر برمجي، واتجاه من اليمين إلى اليسار صحيح في كل مكان.",
      outcome:
        "مسار استشارات ثنائي اللغة يأخذ الزائر الجديد من العلم إلى حجز استشارة، بالعربية أو الإنجليزية.",
    },
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
      "A clinical grade aligner studio in Kuwait City, with digital scans, treatment simulation, and a plan you can watch unfold tooth by tooth. Currently in build.",
    challenge:
      "Aligner brands either feel cosmetic or feel hospital. Smartee needed to feel like aerospace: precise, calm, and quietly futuristic. A clinical product with the visual confidence of a tech launch.",
    approach:
      "Concentric radial lattices, scientific telemetry chips, and a deep crimson palette that reads premium without reading dental.",
    outcome:
      "Currently in private beta with the founding clinical team, ahead of the public launch.",
    stack: ["Next.js 15", "React Server Components", "TS", "Framer Motion", "Three.js"],
    palette: { bg: "#1A0608", ink: "#EFEAE2", accent: "#E0303A" },
    ar: {
      title: "Smartee · ابتسامة الغد، بدقة الملّيمتر",
      client: "Smartee Kuwait",
      role: "مصمّم ومهندس مؤسس",
      category: "تقويم الأسنان · تقنية سريرية",
      summary:
        "استوديو تقويم شفّاف بمعايير سريرية في مدينة الكويت، بمسح رقمي ومحاكاة للعلاج وخطة تتابعها سنًّا بعد سن. قيد البناء حاليًا.",
      challenge:
        "علامات التقويم الشفّاف إمّا تجميلية أو بطابع المستشفى. احتاجت Smartee إلى إحساس صناعة الطيران: دقيق وهادئ ومستقبلي بهدوء. منتج سريري بثقة إطلاق تقني.",
      approach:
        "شبكات شعاعية متّحدة المركز، وشرائح بيانات علمية، ولوحة لونية قرمزية عميقة توحي بالفخامة دون أن تبدو طبية.",
      outcome:
        "في مرحلة تجريبية خاصة حاليًا مع الفريق السريري المؤسس، قبيل الإطلاق العام.",
    },
  },
];

/** A project with its copy swapped to the given language. */
export function localizeProject(p: Project, lang: Lang): Project {
  return lang === "ar" ? { ...p, ...p.ar } : p;
}

export const STATUS_LABEL: Record<Project["status"], { en: string; ar: string }> = {
  Live: { en: "Live", ar: "مباشر" },
  "In Development": { en: "In Development", ar: "قيد التطوير" },
  Shipped: { en: "Shipped", ar: "مُطلق" },
  Featured: { en: "Featured", ar: "مميّز" },
};

export const TESTIMONIALS = [
  {
    quote:
      "Amr doesn’t ship features, he ships moments. The work feels considered down to the millisecond, and clients notice within thirty seconds.",
    author: "Studio Founder",
    role: "Scenarios Design",
    ar: {
      quote:
        "عمرو لا يسلّم ميزات، بل يسلّم لحظات. العمل مدروس حتى أجزاء الثانية، والعملاء يلاحظون ذلك خلال ثلاثين ثانية.",
      author: "مؤسس الاستوديو",
      role: "Scenarios Design",
    },
  },
  {
    quote:
      "He took a vague brief and returned a product that closed our first enterprise pilot. The motion alone moved the needle.",
    author: "Head of Product",
    role: "Healthcare SaaS · Kuwait",
    ar: {
      quote:
        "أخذ موجزًا غامضًا وأعاد منتجًا أغلقنا به أول تجربة لعميل مؤسسي. الحركة وحدها صنعت الفرق.",
      author: "رئيس قسم المنتج",
      role: "برمجيات رعاية صحية · الكويت",
    },
  },
  {
    quote:
      "Frontend craft at the level you usually only see in studios with twenty engineers. He’s one.",
    author: "Engineering Director",
    role: "Regional Startup",
    ar: {
      quote: "إتقان في الواجهات بمستوى لا تراه عادةً إلا في استوديوهات من عشرين مهندسًا. وهو شخص واحد.",
      author: "مدير الهندسة",
      role: "شركة ناشئة إقليمية",
    },
  },
  {
    quote: "Most portfolios are static. His site is the proof.",
    author: "Creative Director",
    role: "Brand Studio",
    ar: {
      quote: "معظم ملفات الأعمال جامدة. موقعه هو الدليل.",
      author: "مدير إبداعي",
      role: "استوديو هوية",
    },
  },
];

/* Services: web development, web design & consultation, brand identity —
   plus the two crafts that run through all three. */
export const CAPABILITIES = [
  {
    title: "Web Development",
    items: ["Next.js / React Server Components", "TypeScript", "Edge runtimes", "Vercel / Cloudflare"],
    ar: { title: "تطوير المواقع", items: ["Next.js / React Server Components", "TypeScript", "بيئات Edge", "Vercel / Cloudflare"] },
  },
  {
    title: "Web Design",
    items: ["Editorial layouts", "Design systems & tokens", "Responsive by default", "Accessibility baked in"],
    ar: { title: "تصميم المواقع", items: ["تخطيطات تحريرية", "أنظمة تصميم ومتغيّرات", "متجاوب افتراضيًا", "إتاحة مدمجة من البداية"] },
  },
  {
    title: "Consultation",
    items: ["Website & UX audits", "Stack & architecture advice", "Performance & SEO review", "Launch planning"],
    ar: { title: "الاستشارات", items: ["تدقيق المواقع وتجربة المستخدم", "اختيار التقنيات والبنية", "مراجعة الأداء وتحسين الظهور", "تخطيط الإطلاق"] },
  },
  {
    title: "Brand Identity Design",
    items: ["Logo & mark systems", "Typography & colour", "Brand guidelines", "Motion identity"],
    ar: { title: "تصميم الهوية البصرية", items: ["الشعار وأنظمة العلامة", "الخطوط والألوان", "دليل الهوية", "هوية متحرّكة"] },
  },
  {
    title: "Motion & 3D",
    items: ["Framer Motion", "GSAP / ScrollTrigger", "Three.js / R3F", "Shaders (GLSL)"],
    ar: { title: "الحركة والأبعاد الثلاثية", items: ["Framer Motion", "GSAP / ScrollTrigger", "Three.js / R3F", "Shaders (GLSL)"] },
  },
  {
    title: "Bilingual / RTL",
    items: ["Arabic + English from day one", "RTL correct motion", "Locale aware UX", "Arabic type pairing"],
    ar: { title: "ثنائي اللغة / RTL", items: ["العربية والإنجليزية من اليوم الأول", "حركة صحيحة من اليمين لليسار", "تجربة تراعي اللغة والمنطقة", "تنسيق الخطوط العربية"] },
  },
];

export const PROCESS = [
  {
    no: "01",
    title: "Listen",
    body: "Strategy before pixels. I interrogate the brief until the real problem surfaces, usually it’s not the one in the doc.",
    ar: { title: "الإصغاء", body: "الاستراتيجية قبل البكسل. أسائل الموجز حتى تظهر المشكلة الحقيقية، وغالبًا ليست تلك المكتوبة في المستند." },
  },
  {
    no: "02",
    title: "Frame",
    body: "A single hero metaphor. One idea the whole product can hang from. If it doesn’t survive five minutes of pressure, it dies.",
    ar: { title: "التأطير", body: "استعارة رئيسية واحدة. فكرة واحدة يُبنى عليها المنتج كله. إن لم تصمد خمس دقائق تحت الضغط، تُستبعد." },
  },
  {
    no: "03",
    title: "Compose",
    body: "Editorial layouts, opinionated motion, system level thinking. Every screen earns its place.",
    ar: { title: "التكوين", body: "تخطيطات تحريرية، وحركة ذات رأي، وتفكير على مستوى النظام. كل شاشة تستحق مكانها." },
  },
  {
    no: "04",
    title: "Ship",
    body: "Production grade engineering on day one. No throwaway prototypes, the demo is the product.",
    ar: { title: "الإطلاق", body: "هندسة بجودة الإنتاج من اليوم الأول. لا نماذج تُرمى، العرض التجريبي هو المنتج." },
  },
  {
    no: "05",
    title: "Tune",
    body: "Frame rate is a feature. Latency is a feature. Every page is tuned to stay smooth on everyday hardware, not just a studio machine.",
    ar: { title: "الضبط", body: "معدّل الإطارات ميزة. سرعة الاستجابة ميزة. كل صفحة مضبوطة لتبقى سلسة على الأجهزة العادية، لا على أجهزة الاستوديو فقط." },
  },
];
