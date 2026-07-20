import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, Michroma } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { SITE } from "@/lib/constants";

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

const siteTitle = `${SITE.brand} · ${SITE.role}`;

export const metadata: Metadata = {
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
        "Brand Engineering",
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
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${nexium.variable} ${inter.variable} ${display.variable} ${serif.variable} ${mono.variable}`}>
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
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
