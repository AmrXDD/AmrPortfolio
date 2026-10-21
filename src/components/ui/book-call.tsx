"use client";

import { CalendarDays } from "lucide-react";
import { Btn } from "./btn";
import { CAL_URL, openBooking, warmBooking } from "@/lib/cal";
import { useLang } from "@/lib/i18n";

/**
 * "Book a call": opens the Cal.com booking (cal.com/amrstudios) as a modal
 * over the page. It is a real link underneath, so without the embed (or with
 * a modifier-click) it opens Cal.com in a new tab.
 */
export function BookCall({
  variant = "ember",
  size = "md",
  label,
  className,
  magnetic,
}: {
  variant?: "ember" | "solid" | "ghost";
  size?: "md" | "sm";
  label?: string;
  className?: string;
  magnetic?: boolean;
}) {
  const ar = useLang().lang === "ar";
  return (
    <Btn
      href={CAL_URL}
      target="_blank"
      rel="noreferrer"
      variant={variant}
      size={size}
      className={className}
      magnetic={magnetic}
      cursorLabel={ar ? "احجز" : "Book"}
      icon={<CalendarDays size={size === "sm" ? 14 : 16} strokeWidth={1.8} />}
      onPointerEnter={warmBooking}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (openBooking()) e.preventDefault();
      }}
    >
      {label ?? (ar ? "احجز مكالمة" : "Book a call")}
    </Btn>
  );
}
