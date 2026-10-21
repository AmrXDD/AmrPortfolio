"use client";

import { ArrowUpRight } from "lucide-react";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { Magnetic } from "./magnetic";
import { cn } from "@/lib/cn";

/*
 * The site's buttons: a pill with a round chip on its trailing end.
 *  - On hover each letter rolls up and its twin rolls in (the twin is a
 *    text-shadow, so the DOM keeps one readable copy for screen readers);
 *  - the border lights up as the logo's ring (cyan → violet → ember) and
 *    runs round the pill like a fuse; a soft glow follows the pointer;
 *  - the arrow leaves the chip and a fresh one slides in; a press sinks it.
 * Looks: "ember" (the main ask, with a slow sheen now and then), "solid",
 * "ghost". It is all CSS on hover/focus/press (globals.css, "Buttons"), so it
 * costs nothing at rest or on a phone.
 */

type Variant = "ember" | "solid" | "ghost";

type Common = {
  children: string;
  variant?: Variant;
  size?: "md" | "sm";
  /** the chip's icon (an arrow by default); null for no chip */
  icon?: ReactNode | null;
  /** something before the label, e.g. a live dot */
  lead?: ReactNode;
  className?: string;
  cursorLabel?: string;
  magnetic?: boolean;
  onPointerEnter?: () => void;
};

type LinkProps = Common & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

type ButtonProps = Common & {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

// Latin labels roll letter by letter; Arabic rolls as one (splitting would
// break its joined letterforms)
const SPLIT = /^[\x20-\x7E]+$/;

function Label({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="btn-label">
        {SPLIT.test(text) ? (
          [...text].map((ch, i) => (
            <span key={i} className="btn-ch" style={{ ["--i" as string]: i }}>
              {ch === " " ? " " : ch}
            </span>
          ))
        ) : (
          <span className="btn-ch">{text}</span>
        )}
      </span>
    </>
  );
}

function Chip({ icon }: { icon: ReactNode }) {
  return (
    <span aria-hidden className="btn-chip">
      <span className="grid place-items-center">{icon}</span>
      <span className="grid place-items-center">{icon}</span>
    </span>
  );
}

// the glow follows a mouse (touch has no hover to follow)
const follow = (e: PointerEvent<HTMLElement>) => {
  if (e.pointerType !== "mouse") return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

export function Btn(props: LinkProps | ButtonProps) {
  const { children, variant = "solid", size = "md", lead, className, cursorLabel, magnetic = true, onPointerEnter } = props;
  const icon = props.icon === undefined ? <ArrowUpRight size={size === "sm" ? 14 : 17} strokeWidth={2} className="rtl:-scale-x-100" /> : props.icon;
  const cls = cn("btn", `btn--${variant}`, size === "sm" && "btn-sm", !icon && "btn-noicon", className);
  const inner = (
    <>
      {variant === "ember" ? <span aria-hidden className="btn-sheen" /> : null}
      {lead}
      <Label text={children} />
      {icon ? <Chip icon={icon} /> : null}
    </>
  );

  const el =
    props.href !== undefined ? (
      <a
        href={props.href}
        target={props.target}
        rel={props.rel}
        onClick={props.onClick}
        onPointerMove={follow}
        onPointerEnter={onPointerEnter}
        data-cursor="link"
        data-cursor-label={cursorLabel}
        className={cls}
      >
        {inner}
      </a>
    ) : (
      <button
        type={props.type ?? "button"}
        disabled={props.disabled}
        onClick={props.onClick}
        onPointerMove={follow}
        onPointerEnter={onPointerEnter}
        data-cursor="link"
        data-cursor-label={cursorLabel}
        className={cls}
      >
        {inner}
      </button>
    );

  return magnetic ? <Magnetic strength={0.2}>{el}</Magnetic> : el;
}
