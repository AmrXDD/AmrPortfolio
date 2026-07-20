"use client";

import { Magnetic } from "./magnetic";
import { waLink, SITE } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { ArrowUpRight } from "lucide-react";

export function WhatsAppCTA({
  message,
  label = "Start a conversation",
  variant = "solid",
  className,
}: {
  message?: string;
  label?: string;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  return (
    <Magnetic strength={0.25}>
      <a
        href={waLink(message)}
        target="_blank"
        rel="noreferrer"
        data-cursor="link"
        data-cursor-label="Whatsapp"
        className={cn(
          variant === "solid" ? "btn-solid" : "btn-ghost",
          "group relative overflow-hidden",
          className
        )}
      >
        <span className="relative z-10">{label}</span>
        <ArrowUpRight
          size={14}
          className="relative z-10 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px"
        />
      </a>
    </Magnetic>
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
      className={cn("link-underline text-mono text-xs uppercase tracking-[0.18em]", className)}
    >
      {label}
    </a>
  );
}
