import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { Cursor } from "@/components/ui/cursor";
import { TopControls } from "@/components/top-controls";
import { SiteDock } from "@/components/site-dock";
import { StickyWhatsApp } from "@/components/ui/sticky-whatsapp";
import { Preloader } from "@/components/preloader";
import { AmbientPlayer } from "@/components/ui/ambient-player";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { SoundFX } from "@/components/ui/sound-fx";
import { ScrollThread } from "@/components/ui/scroll-thread";

/*
 * Layout for the marketing site only. All the cinematic chrome — preloader,
 * custom cursor, top controls, dock, WhatsApp, ambient audio, grain — lives
 * here, so utility routes like /admin (outside this group) render clean.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Film grain overlay (scoped to the site, not /admin) */}
      <div className="grain" aria-hidden />
      <Preloader />
      {/* the comet thread, drawn down the page as you scroll (behind content) */}
      <ScrollThread />
      <SmoothScroll>
        <Cursor />
        <TopControls />
        <ScrollProgress />
        <main className="relative z-10">{children}</main>
        {/* Sideways rail on desktop, magnifying dock on phones */}
        <SiteDock />
        <StickyWhatsApp />
      </SmoothScroll>
      {/* Minimalist ambient-audio control (bottom-left) */}
      <AmbientPlayer />
      {/* UI tick sounds on hover/click */}
      <SoundFX />
    </>
  );
}
