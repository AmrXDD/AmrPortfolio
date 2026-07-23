# GRAPH_REPORT.md — Amr Studio portfolio (structural fallback)

> **Mode:** graphify-style **structural fallback** — native `graphifyy` (Python 3.10+) is not installed in this environment, so this graph is built from **real import edges** parsed out of `src/**.{ts,tsx}` by a Node extractor, not native semantic extraction.

> **Scope:** `src/`  ·  **Nodes:** 83 modules  ·  **Edges:** 161 import relationships  ·  Regenerate with `node graphify-out/build.mjs`.

## Subsystems

| Group | Modules | What lives here |
|---|---|---|
| `app-root` | 5 | Next.js App Router root — root layout, metadata, sitemap/robots/manifest/OG image |
| `route:site` | 2 | The public marketing site route group `(site)` — home page + its chrome layout |
| `route:admin` | 6 | Admin area — login form, dashboard, and the gated `/admin/contract` generator |
| `api` | 3 | Route handlers — contact form + admin login/logout endpoints |
| `sections` | 27 | Page sections composed into the home page (hero, showcase, process, contact, …) |
| `components` | 4 | Top-level chrome shared across the site (nav, preloader, top-controls, dock) |
| `ui` | 24 | Reusable UI + motion primitives (logo, magnetic, reveal, cursor, side-rays, …) |
| `webgl` | 4 | WebGL field backdrops (cosmic-field, space-field) and their mounts |
| `providers` | 2 | React context providers (theme, smooth-scroll) |
| `lib` | 6 | Shared non-UI logic (constants, i18n, supabase, admin-auth, helpers) |

## Most-imported modules (hubs)
The shared foundation — changes here ripple widest.

| Module | Imported by | Group | Kind |
|---|---|---|---|
| `src/lib/constants.ts` | 22 | lib | lib |
| `src/components/ui/eyebrow.tsx` | 17 | ui | component |
| `src/components/ui/reveal.tsx` | 14 | ui | client-component |
| `src/lib/cn.ts` | 14 | lib | lib |
| `src/lib/i18n.tsx` | 8 | lib | lib |
| `src/components/providers/theme-provider.tsx` | 6 | providers | client-component |
| `src/components/ui/logo.tsx` | 6 | ui | client-component |
| `src/components/ui/magnetic.tsx` | 5 | ui | client-component |
| `src/components/ui/scroll-reveal.tsx` | 4 | ui | client-component |
| `src/lib/admin-auth.ts` | 4 | lib | lib |
| `src/lib/use-mobile.ts` | 4 | lib | lib |
| `src/components/ui/border-glow.tsx` | 3 | ui | client-component |

## Largest composers (fan-out)
Modules that pull in the most — the assembly points.

| Module | Imports | Group | Kind |
|---|---|---|---|
| `src/app/(site)/page.tsx` | 18 | route:site | page |
| `src/app/(site)/layout.tsx` | 9 | route:site | layout |
| `src/components/sections/cta.tsx` | 8 | sections | client-component |
| `src/components/sections/hero/hero.tsx` | 7 | sections | client-component |
| `src/components/sections/sound-studio.tsx` | 6 | sections | client-component |
| `src/components/top-controls.tsx` | 6 | components | client-component |
| `src/components/nav.tsx` | 5 | components | client-component |
| `src/components/sections/testimonials.tsx` | 5 | sections | client-component |
| `src/components/sections/work-grid.tsx` | 5 | sections | client-component |
| `src/app/admin/page.tsx` | 4 | route:admin | page |

## Top external dependencies (by import sites)

| Package | Import sites |
|---|---|
| `react` | 48 |
| `next` | 27 |
| `framer-motion` | 25 |
| `lucide-react` | 6 |
| `three` | 5 |
| `@react-three/fiber` | 4 |
| `gsap` | 3 |
| `lenis` | 2 |
| `@gsap/react` | 2 |
| `@react-three/drei` | 2 |
| `react-icons` | 2 |
| `pdf-lib` | 1 |
| `@pdf-lib/fontkit` | 1 |
| `resend` | 1 |

## Modules with no internal importers (11)
Entry points, dynamically-loaded leaves, or dead ends. Not necessarily dead — dynamic `import()` and route files are legitimately "unimported".

- `src/components/nav.tsx`
- `src/components/sections/index-marquee.tsx`
- `src/components/sections/parallax-grid.tsx`
- `src/components/sections/showcase/floating-carousel.tsx`
- `src/components/sections/showcase/phone-scene.tsx`
- `src/components/sections/work-marquee.tsx`
- `src/components/ui/animated-chars.tsx`
- `src/components/ui/language-toggle.tsx`
- `src/components/ui/sandstorm.tsx`
- `src/components/webgl/cosmic-field-mount.tsx`
- `src/components/webgl/space-field-mount.tsx`


## Artifacts
- `graphify-out/GRAPH_REPORT.md` — this file (read first)
- `graphify-out/graph.html` — interactive force-directed view (open in a browser)
- `graphify-out/graph.json` — full node/edge data
- `graphify-out/build.mjs` — the extractor (reproducible refresh)
