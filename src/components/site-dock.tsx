"use client";

import { Dock, type DockItemData } from "@/components/ui/dock";
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

function scrollToId(id: string) {
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

export function SiteDock() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const sz = isMobile ? 38 : 46;

  const items: DockItemData[] = [
    { icon: <VscHome size={18} />, label: t("nav.home"), onClick: () => scrollToId("top") },
    { icon: <VscArchive size={18} />, label: t("nav.work"), onClick: () => scrollToId("work") },
    { icon: <VscTools size={18} />, label: t("nav.craft"), onClick: () => scrollToId("craft") },
    { icon: <VscMegaphone size={18} />, label: t("nav.services"), onClick: () => scrollToId("services") },
    { icon: <VscListOrdered size={18} />, label: t("nav.process"), onClick: () => scrollToId("process") },
    { icon: <VscMail size={18} />, label: t("nav.contact"), onClick: () => scrollToId("contact") },
  ];

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 md:bottom-6">
      <Dock items={items} panelHeight={isMobile ? 54 : 64} baseItemSize={sz} magnification={isMobile ? 52 : 68} distance={isMobile ? 110 : 160} />
    </div>
  );
}
