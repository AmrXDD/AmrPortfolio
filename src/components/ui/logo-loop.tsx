"use client";

/*
 * LogoLoop — seamless infinite marquee of logos (adapted from reactbits.dev).
 * Copies the track until it overflows twice, then translates with rAF so the
 * loop is truly seamless. Supports hover-slow, scale-on-hover and edge fade.
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/cn";

export type LogoItem =
  | {
      node: ReactNode;
      title?: string;
      href?: string;
      ariaLabel?: string;
    }
  | {
      src: string;
      alt?: string;
      title?: string;
      href?: string;
      srcSet?: string;
      sizes?: string;
      width?: number;
      height?: number;
    };

type LogoLoopProps = {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right";
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };

const toCssLength = (v?: number | string) =>
  typeof v === "number" ? `${v}px` : (v ?? undefined);

function useResizeObserver(
  cb: () => void,
  refs: React.RefObject<Element | null>[],
  deps: unknown[]
) {
  useEffect(() => {
    const handle = () => cb();
    handle();
    window.addEventListener("resize", handle);
    const observers = refs.map((r) => {
      if (!r.current) return null;
      const ro = new ResizeObserver(handle);
      ro.observe(r.current);
      return ro;
    });
    return () => {
      window.removeEventListener("resize", handle);
      observers.forEach((o) => o?.disconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function LogoLoop({
  logos,
  speed = 100,
  direction = "left",
  width = "100%",
  logoHeight = 40,
  gap = 40,
  pauseOnHover = false,
  hoverSpeed,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  ariaLabel = "Partner logos",
  className,
  style,
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
  const [hovered, setHovered] = useState(false);

  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const updateDimensions = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const sequenceWidth = seqRef.current?.getBoundingClientRect?.().width ?? 0;
    if (sequenceWidth > 0) {
      setSeqWidth(Math.ceil(sequenceWidth));
      const copiesNeeded =
        Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
    }
  }, []);

  useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight]);

  useEffect(() => {
    const targetVelocity =
      (hovered && hoverSpeed !== undefined ? hoverSpeed : speed) *
      (direction === "left" ? 1 : -1);
    const shouldPause = pauseOnHover && hovered;

    let velocity = 0;

    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.max(0, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const target = shouldPause ? 0 : targetVelocity;
      const ease = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
      velocity += (target - velocity) * ease;

      if (seqWidth > 0) {
        let next = offsetRef.current + velocity * dt;
        next = ((next % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = next;
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${-next}px,0,0)`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [seqWidth, speed, hoverSpeed, hovered, direction, pauseOnHover]);

  const cssVars = useMemo(
    () =>
      ({
        "--logoloop-gap": `${gap}px`,
        "--logoloop-logoHeight": `${logoHeight}px`,
        ...(fadeOutColor ? { "--logoloop-fadeColor": fadeOutColor } : {}),
      }) as CSSProperties,
    [gap, logoHeight, fadeOutColor]
  );

  const renderLogo = (item: LogoItem, key: string) => {
    const isNode = "node" in item;
    const content = isNode ? (
      <span
        className={cn(
          "inline-flex items-center justify-center text-bone/70 transition-[color,transform] duration-300 [&>svg]:h-[var(--logoloop-logoHeight)] [&>svg]:w-auto",
          scaleOnHover && "hover:text-bone hover:[transform:scale(1.12)]"
        )}
        aria-hidden={!!item.href && !item.ariaLabel}
      >
        {item.node}
      </span>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.src}
        alt={item.alt ?? ""}
        title={item.title}
        height={logoHeight}
        className={cn(
          "h-[var(--logoloop-logoHeight)] w-auto object-contain transition-transform duration-300",
          scaleOnHover && "hover:[transform:scale(1.12)]"
        )}
        draggable={false}
      />
    );

    const inner = item.href ? (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer noopener"
        data-cursor="link"
        aria-label={("ariaLabel" in item && item.ariaLabel) || item.title || "logo link"}
        className="inline-flex items-center no-underline"
      >
        {content}
      </a>
    ) : (
      content
    );

    return (
      <li
        key={key}
        className="flex flex-none items-center [margin-inline-end:var(--logoloop-gap)]"
        role="listitem"
      >
        {inner}
      </li>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-x-hidden", className)}
      style={{ width: toCssLength(width), ...cssVars, ...style }}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {fadeOut ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[clamp(24px,8%,120px)]"
            style={{
              background:
                "linear-gradient(to right, var(--logoloop-fadeColor, rgb(var(--ink-rgb))), rgba(0,0,0,0))",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[clamp(24px,8%,120px)]"
            style={{
              background:
                "linear-gradient(to left, var(--logoloop-fadeColor, rgb(var(--ink-rgb))), rgba(0,0,0,0))",
            }}
          />
        </>
      ) : null}

      <div ref={trackRef} className="flex w-max will-change-transform">
        {Array.from({ length: copyCount }, (_, ci) => (
          <ul
            key={ci}
            ref={ci === 0 ? seqRef : undefined}
            className="flex items-center"
            role="list"
            aria-hidden={ci > 0}
          >
            {logos.map((item, li) => renderLogo(item, `${ci}-${li}`))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default LogoLoop;
