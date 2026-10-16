"use client";

import { Dock, type DockItemData } from "@/components/ui/dock";
import { SideNav } from "@/components/ui/side-nav";
import { useLang } from "@/lib/i18n";
import { useIsMobile } from "@/lib/use-mobile";
import {
  VscHome,
  VscArchive,
  VscTools,
  VscMegaphone,
  VscListOrdered,
  VscMail,
} from "react-icons/vsc";

export function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const w = window as unknown as {
    __lenis?: { scrollTo: (t: Element, o?: unknown) => void };
    __navLock?: boolean;
  };
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const offset = isMobile ? -72 : -88;
  const duration = 1.4;
  // Lock the auto-scroll so it can't hijack this dock navigation mid-flight.
  w.__navLock = true;
  const release = () => {
    w.__navLock = false;
  };
  if (w.__lenis) {
    w.__lenis.scrollTo(target, {
      offset,
      duration,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      onComplete: () => setTimeout(release, 120),
    });
    // safety net in case onComplete never fires
    setTimeout(release, duration * 1000 + 400);
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(release, 900);
  }
  history.pushState(null, "", `#${id}`);
}

const SECTIONS = [
  { id: "top", key: "nav.home", Icon: VscHome },
  { id: "work", key: "nav.work", Icon: VscArchive },
  { id: "craft", key: "nav.craft", Icon: VscTools },
  { id: "process", key: "nav.process", Icon: VscListOrdered },
  { id: "services", key: "nav.services", Icon: VscMegaphone },
  { id: "contact", key: "nav.contact", Icon: VscMail },
] as const;

/* Desktop: the sideways rail on the trailing edge. Phones keep the bottom
   dock — a side rail would sit on top of the content at that width. */
export function SiteDock() {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <SideNav
        items={SECTIONS.map((s) => ({ id: s.id, label: t(s.key), icon: <s.Icon size={17} /> }))}
        onNavigate={scrollToId}
        ariaLabel={lang === "ar" ? "التنقّل في الموقع" : "Site navigation"}
        topLabel={lang === "ar" ? "العودة إلى الأعلى" : "Back to top"}
      />
    );
  }

  const items: DockItemData[] = SECTIONS.map((s) => ({
    icon: <s.Icon size={18} />,
    label: t(s.key),
    onClick: () => scrollToId(s.id),
  }));

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
      <Dock items={items} panelHeight={54} baseItemSize={38} magnification={52} distance={110} />
    </div>
  );
}
