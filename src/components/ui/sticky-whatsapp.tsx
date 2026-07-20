"use client";

import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { waLink } from "@/lib/constants";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path d="M16.001 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.65 6.31L3 29l6.86-1.62A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm0 23.5c-1.96 0-3.86-.52-5.52-1.5l-.39-.23-4.07.96.97-3.96-.25-.41A10.46 10.46 0 0 1 5.5 16C5.5 10.2 10.2 5.5 16 5.5S26.5 10.2 26.5 16 21.8 26.5 16 26.5Zm5.78-7.86c-.32-.16-1.88-.93-2.17-1.04-.29-.11-.5-.16-.71.16-.21.32-.81 1.04-.99 1.25-.18.21-.36.24-.68.08-.32-.16-1.34-.5-2.55-1.58-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.5.14-.65.14-.14.32-.36.48-.54.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.54-.71-.55-.18-.01-.39-.01-.6-.01s-.55.08-.84.4c-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.32 1.34.51 1.8.66.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.37.18-1.51-.08-.13-.29-.21-.61-.37Z"/>
    </svg>
  );
}

export function StickyWhatsApp() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setShow(y > 600);
  });

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.85 }}
          transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
          className="fixed bottom-[76px] right-4 z-[60] flex flex-col items-end gap-2 md:bottom-7 md:right-7"
        >
          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                className="mb-1 max-w-[260px] rounded-2xl border border-line bg-ink/90 p-4 text-[13px] leading-relaxed text-bone/90 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">
                    Online · Salmiya
                  </span>
                </div>
                <p className="mt-3">
                  Replying in minutes. Tell me what you&apos;re building.
                </p>
                <a
                  href={waLink("Hey Amr, saw your portfolio. Want to talk about a project.")}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="link"
                  data-cursor-label="WhatsApp"
                  className="mt-3 inline-flex items-center gap-2 text-mono text-[11px] uppercase tracking-[0.18em] text-accent"
                >
                  Open chat →
                </a>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <a
            href={waLink("Hey Amr, saw your portfolio. Want to talk about a project.")}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            data-cursor-label="WhatsApp"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-bone/20 bg-ink/60 text-bone shadow-[0_20px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-bone hover:bg-bone hover:text-ink md:h-16 md:w-16"
            aria-label="Chat on WhatsApp"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-20" />
            <WhatsAppGlyph className="relative h-7 w-7 md:h-8 md:w-8" />
          </a>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
