import type { Metadata, Viewport } from "next";
import {
  Alexandria,
  Amiri,
  IBM_Plex_Sans_Arabic,
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
  Michroma,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { SITE, SITE_AR } from "@/lib/constants";
import { visitorLocale } from "@/lib/locale-server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Nexium — the site's signature display/body face, used everywhere.
const nexium = localFont({
  src: "../../public/fonts/Nexium.otf",
  variable: "--font-nexium",
  display: "swap",
});

// Wide, geometric, futuristic display face for headlines.
const display = Michroma({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});

// Kept for the elegant italic accent words inside headlines.
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/*
 * Arabic faces. preload:false + the arabic subset means English visitors never
 * download them; the browser fetches them only when Arabic glyphs render.
 * Alexandria (geometric, wide) stands in for Michroma/Nexium in headlines,
 * IBM Plex Sans Arabic carries body + labels, Amiri takes the serif accents.
 */
const arabicSans = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-ar-sans",
  display: "swap",
  preload: false,
});

const arabicDisplay = Alexandria({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-ar-display",
  display: "swap",
  preload: false,
});

const arabicSerif = Amiri({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-ar-serif",
  display: "swap",
  preload: false,
});

const siteTitle = `${SITE.brand} · ${SITE.role}`;
const siteTitleAr = `${SITE.brand} · ${SITE_AR.role}`;

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await visitorLocale();
  if (lang !== "ar") return metadata;
  return {
    ...metadata,
    title: { default: siteTitleAr, template: `%s · ${SITE.brand}` },
    description: SITE_AR.tagline,
    openGraph: { ...metadata.openGraph, locale: "ar_AR", title: siteTitleAr, description: SITE_AR.tagline },
    twitter: { ...metadata.twitter, title: siteTitleAr, description: SITE_AR.tagline },
  };
}

const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: siteTitle,
    template: `%s · ${SITE.brand}`,
  },
  description: SITE.tagline,
  applicationName: SITE.brand,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.brand,
  keywords: [...SITE.keywords],
  category: "Design & Engineering",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_AR"],
    url: SITE.url,
    siteName: SITE.brand,
    title: siteTitle,
    description: SITE.tagline,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: SITE.tagline,
    creator: SITE.twitter,
    site: SITE.twitter,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand/amr-logo-dark-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/amr-logo-ig-profile-dark-1080.png", sizes: "1080x1080" }],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    "geo.region": SITE.region,
    "geo.placename": SITE.city,
    "geo.position": "29.3394;48.0764",
    ICBM: "29.3394, 48.0764",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// JSON-LD structured data — helps Google parse "who, what, where" cleanly
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE.url}/#person`,
      name: SITE.name,
      alternateName: SITE.brand,
      url: SITE.url,
      email: `mailto:${SITE.email}`,
      jobTitle: SITE.role,
      worksFor: { "@id": `${SITE.url}/#org` },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Salmiya",
        addressCountry: "KW",
      },
      sameAs: [`https://wa.me/${SITE.whatsapp}`],
      knowsAbout: [
        "Creative Development",
        "Frontend Architecture",
        "Motion Design",
        "Three.js",
        "Next.js",
        "Web Design",
        "Brand Identity Design",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#org`,
      name: SITE.brand,
      url: SITE.url,
      logo: `${SITE.url}/brand/amr-logo-dark-512.png`,
      founder: { "@id": `${SITE.url}/#person` },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Salmiya",
        addressCountry: "KW",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "Sales",
          email: SITE.email,
          telephone: `+${SITE.whatsapp}`,
          areaServed: "Worldwide",
          availableLanguage: ["en", "ar"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.brand,
      description: SITE.tagline,
      publisher: { "@id": `${SITE.url}/#org` },
      inLanguage: ["en", "ar"],
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, currency } = await visitorLocale();
  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${nexium.variable} ${inter.variable} ${display.variable} ${serif.variable} ${mono.variable} ${arabicSans.variable} ${arabicDisplay.variable} ${arabicSerif.variable}`}
    >
      <head>
        {/* Anti-FOUC: set the saved theme class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.add(t==='light'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <LanguageProvider initialLang={lang} currency={currency}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
