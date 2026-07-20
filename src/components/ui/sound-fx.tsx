"use client";

import { useEffect, useRef } from "react";
import { CLICK_SOUND } from "@/lib/constants";

/**
 * SoundFX — the site-wide UI tick. Plays the SAME soft-click audio file used by
 * the OptionWheel (see CLICK_SOUND) as the cursor moves onto an interactive
 * element, with a slightly louder version on click. The file is decoded once
 * into a Web Audio buffer and re-triggered cheaply. Always on (independent of
 * the ambient-music toggle); the AudioContext is unlocked on first gesture.
 * Only prefers-reduced-motion mutes it.
 */
export function SoundFX() {
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ensureCtx = () => {
      if (!ctxRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) {
          try {
            ctxRef.current = new AC();
          } catch {
            /* ignore */
          }
        }
      }
      if (ctxRef.current?.state === "suspended") void ctxRef.current.resume();
      // lazy-load + decode the click buffer once the context exists
      if (ctxRef.current && !bufferRef.current) {
        fetch(CLICK_SOUND)
          .then((r) => r.arrayBuffer())
          .then((ab) => ctxRef.current!.decodeAudioData(ab))
          .then((buf) => (bufferRef.current = buf))
          .catch(() => {});
      }
    };

    const onGesture = () => {
      ensureCtx();
      if (ctxRef.current?.state === "running") {
        window.removeEventListener("pointerdown", onGesture);
        window.removeEventListener("keydown", onGesture);
      }
    };
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    window.addEventListener("ambient:start", ensureCtx);

    const play = (vol: number, rate = 1) => {
      const ctx = ctxRef.current;
      const buf = bufferRef.current;
      if (!ctx || ctx.state !== "running" || !buf) return;
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      src.buffer = buf;
      src.playbackRate.value = rate;
      g.gain.value = vol;
      src.connect(g).connect(ctx.destination);
      src.start();
    };

    const SEL = "a, button, [data-cursor], [data-tick]";
    let lastEl: Element | null = null;
    let lastAt = 0;
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(SEL);
      if (!el || el === lastEl) return; // one tick per element
      const now = performance.now();
      lastEl = el;
      if (now - lastAt < 35) return; // rate-limit fast sweeps
      lastAt = now;
      play(0.35, 1.08);
    };
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.(SEL)) return;
      play(0.6, 0.92);
    };

    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("click", onClick, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("ambient:start", ensureCtx);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("click", onClick);
      void ctxRef.current?.close?.();
    };
  }, []);

  return null;
}
