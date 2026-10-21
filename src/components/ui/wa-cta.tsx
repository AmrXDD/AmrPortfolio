"use client";

import { Btn } from "./btn";
import { waLink, SITE } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function WhatsAppCTA({
  message,
  label = "Start a conversation",
  variant = "solid",
  className,
}: {
  message?: string;
  label?: string;
  variant?: "ember" | "solid" | "ghost";
  className?: string;
}) {
  return (
    <Btn href={waLink(message)} target="_blank" rel="noreferrer" variant={variant} cursorLabel="WhatsApp" className={className}>
      {label}
    </Btn>
  );
}

export function EmailCTA({
  label = SITE.email,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={`mailto:${SITE.email}`}
      data-cursor="link"
      data-cursor-label="Email"
      dir="ltr"
      className={cn("link-underline text-mono text-xs uppercase tracking-[0.18em]", className)}
    >
      {label}
    </a>
  );
}
