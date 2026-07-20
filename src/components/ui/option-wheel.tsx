"use client";

/*
 * OptionWheel — a curved, draggable vertical selector (adapted from reactbits).
 * Items sit on a rotating cylinder; the centred item is "selected". Dragging,
 * wheel-scroll, or arrow keys rotate it. Plays a click on each selection change.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type OptionWheelProps = {
  items: string[];
  defaultSelected?: number;
  textColor?: string;
  activeColor?: string;
  side?: "left" | "right" | "center";
  fontSize?: number; // rem
  spacing?: number; // angle multiplier
  curve?: number;
  tilt?: number; // deg
  blur?: number; // px at the edges
  fade?: number; // 0..1 edge fade
  smoothing?: number; // ms
  inset?: number; // px horizontal inset
  loop?: boolean;
  draggable?: boolean;
  soundUrl?: string;
  soundVolume?: number;
  onChange?: (index: number, item: string) => void;
  className?: string;
};

const ANGLE_PER = 22; // base degrees between items

export function OptionWheel({
  items,
  defaultSelected = 0,
  textColor = "#a6a6a6",
  activeColor = "#ffffff",
  side = "center",
  fontSize = 2.4,
  spacing = 1.2,
  tilt = 0,
  blur = 2,
  fade = 0.25,
  smoothing = 200,
  inset = 0,
  loop = false,
  draggable = true,
  soundUrl,
  soundVolume = 0.5,
  onChange,
  className = "",
}: OptionWheelProps) {
  const angleStep = ANGLE_PER * spacing;
  const [selected, setSelected] = useState(defaultSelected);
  const posRef = useRef(defaultSelected); // continuous position
  const targetRef = useRef(defaultSelected);
  const rafRef = useRef<number | null>(null);
  const [, force] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastIndexRef = useRef(defaultSelected);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (soundUrl && typeof Audio !== "undefined") {
      const a = new Audio(soundUrl);
      a.volume = soundVolume;
      audioRef.current = a;
    }
  }, [soundUrl, soundVolume]);

  const playClick = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      void a.play();
    } catch {
      /* ignore */
    }
  }, []);

  const clamp = useCallback(
    (v: number) => {
      if (loop) return v;
      return Math.max(0, Math.min(items.length - 1, v));
    },
    [items.length, loop]
  );

  // rAF smoothing toward target — only re-renders while actually moving, so an
  // idle wheel costs zero React renders.
  useEffect(() => {
    const tick = () => {
      const delta = targetRef.current - posRef.current;
      const moving = Math.abs(delta) > 0.0005;
      if (draggingRef.current) {
        force((n) => (n + 1) % 1000000);
      } else if (moving) {
        const k = 1 - Math.exp(-16 / Math.max(30, smoothing));
        posRef.current += delta * k;
        const idx = clamp(Math.round(posRef.current));
        if (idx !== lastIndexRef.current) {
          lastIndexRef.current = idx;
          setSelected(((idx % items.length) + items.length) % items.length);
          playClick();
          onChange?.(idx, items[((idx % items.length) + items.length) % items.length]);
        }
        force((n) => (n + 1) % 1000000);
      } else if (posRef.current !== targetRef.current) {
        posRef.current = targetRef.current;
        force((n) => (n + 1) % 1000000);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [smoothing, clamp, items, onChange, playClick]);

  const setTarget = useCallback(
    (v: number) => {
      targetRef.current = clamp(v);
    },
    [clamp]
  );

  // wheel scroll — native, non-passive listener spins the wheel.
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      targetRef.current = clamp(targetRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [clamp]);

  // Fully freeze the page (Lenis) while the pointer is over the wheel, so the
  // scroll is captured by the box and never leaks to the page. Belt-and-braces
  // beyond data-lenis-prevent, which Lenis doesn't always honour here.
  const lenis = () => (window as unknown as { __lenis?: { stop?: () => void; start?: () => void } }).__lenis;
  const lockScroll = useCallback(() => lenis()?.stop?.(), []);
  const unlockScroll = useCallback(() => lenis()?.start?.(), []);
  useEffect(() => () => lenis()?.start?.(), []); // always release on unmount

  // drag
  const dragState = useRef<{ y: number; start: number } | null>(null);
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!draggable) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragState.current = { y: e.clientY, start: posRef.current };
      draggingRef.current = true;
    },
    [draggable]
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;
      const dy = e.clientY - dragState.current.y;
      const rowPx = fontSize * 16 * 1.4;
      targetRef.current = clamp(dragState.current.start - dy / rowPx);
      posRef.current = targetRef.current;
    },
    [clamp, fontSize]
  );
  const onPointerUp = useCallback(() => {
    if (!dragState.current) return;
    dragState.current = null;
    draggingRef.current = false;
    setTarget(Math.round(posRef.current));
  }, [setTarget]);

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp") { e.preventDefault(); setTarget(targetRef.current - 1); }
      if (e.key === "ArrowDown") { e.preventDefault(); setTarget(targetRef.current + 1); }
    },
    [setTarget]
  );

  const pos = posRef.current;
  const align = side === "left" ? "flex-start" : side === "right" ? "flex-end" : "center";

  const rows = useMemo(() => {
    return items.map((item, i) => {
      const offset = i - pos; // 0 = centred
      const angle = offset * angleStep;
      const abs = Math.abs(offset);
      if (abs > 4.2) return null;
      const opacity = Math.max(0, 1 - abs * fade);
      const b = Math.min(blur, abs * blur * 0.6);
      const isActive = Math.round(pos) === i;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: align,
            paddingInline: inset,
            transform: `translateY(-50%) rotateX(${-angle}deg) translateZ(${fontSize * 3.4}rem)`,
            transformOrigin: "center",
            opacity,
            filter: b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none",
            color: isActive ? activeColor : textColor,
            fontSize: `${fontSize}rem`,
            fontWeight: isActive ? 600 : 400,
            lineHeight: 1,
            whiteSpace: "nowrap",
            transition: "color 200ms ease",
            pointerEvents: "none",
          }}
        >
          {item}
        </div>
      );
    });
  }, [items, pos, angleStep, fade, blur, align, inset, fontSize, activeColor, textColor]);

  return (
    <div
      ref={hostRef}
      role="listbox"
      aria-label="Option wheel"
      aria-activedescendant={`opt-${selected}`}
      tabIndex={0}
      onMouseEnter={lockScroll}
      onMouseLeave={unlockScroll}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKey}
      data-cursor="drag"
      data-cursor-label="Scroll"
      data-lenis-prevent
      className={`relative h-[22rem] w-full touch-none select-none outline-none ${className}`}
      style={{
        perspective: "1000px",
        cursor: draggable ? "grab" : "default",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `rotateZ(${tilt}deg)`,
        }}
      >
        {rows}
      </div>
    </div>
  );
}

export default OptionWheel;
