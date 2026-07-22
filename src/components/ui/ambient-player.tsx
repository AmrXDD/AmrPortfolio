"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const BARS = [0, 1, 2, 3];
const VOLUME = 0.3; // ambient bed level — present but not intrusive
const LOOP_END = 105; // seconds — only use 0:00 → 1:45 of the track, then loop

/**
 * AmbientPlayer — a premium, minimalist background-audio controller.
 *
 * • Autoplay-safe: defaults to PAUSED and waits for an explicit user click
 *   (browsers block unsolicited audio).
 * • Loops a seamless track at a very low volume (0.12) so it stays atmospheric.
 * • The toggle holds a 4-line equalizer: while playing, a GSAP loop animates the
 *   bars with a random scaleY (yoyo, repeat -1, fresh randoms each cycle); when
 *   paused, the loop is killed and the bars ease back to a flat resting state.
 */
export function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const barsRef = useRef<HTMLSpanElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(true);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
      window.dispatchEvent(new CustomEvent("sound:toggle", { detail: { on: false } }));
      return;
    }
    // turning on — enable UI tick sounds regardless of whether the music exists
    window.dispatchEvent(new CustomEvent("sound:toggle", { detail: { on: true } }));
    try {
      a.volume = VOLUME;
      a.muted = false;
      await a.play();
      setIsPlaying(true);
      setReady(true);
    } catch {
      // No track yet / autoplay blocked — fail gracefully, stay paused.
      setIsPlaying(false);
      setReady(false);
    }
  };

  // The preloader's "Enter with sound" choice fires this — the click there is a
  // valid user gesture, so playback is allowed.
  useEffect(() => {
    const onStart = (e: Event) => {
      const on = (e as CustomEvent).detail?.on;
      const a = audioRef.current;
      if (!on || !a) return;
      a.volume = VOLUME;
      a.muted = false;
      a.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          setReady(false);
        });
    };
    window.addEventListener("ambient:start", onStart);
    return () => window.removeEventListener("ambient:start", onStart);
  }, []);

  // Loop only the first 1:45 of the track: reset to the start once we hit LOOP_END.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (a.currentTime >= LOOP_END) a.currentTime = 0;
    };
    a.addEventListener("timeupdate", onTime);
    return () => a.removeEventListener("timeupdate", onTime);
  }, []);

  useGSAP(
    () => {
      const bars = barsRef.current?.querySelectorAll("span");
      if (!bars || !bars.length) return;

      if (isPlaying) {
        gsap.to(bars, {
          scaleY: "random(0.3, 1.0)",
          transformOrigin: "50% 100%",
          duration: 0.42,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          repeatRefresh: true, // pick new random heights every cycle
          stagger: { each: 0.08, from: "center" },
        });
      } else {
        gsap.killTweensOf(bars);
        gsap.to(bars, {
          scaleY: 0.2,
          transformOrigin: "50% 100%",
          duration: 0.5,
          ease: "power2.out",
        });
      }
    },
    { dependencies: [isPlaying] }
  );

  return (
    <>
      <audio ref={audioRef} src="/audio/ambient-loop.mp3" loop preload="auto" aria-hidden />

      <button
        type="button"
        onClick={toggle}
        data-cursor="link"
        aria-pressed={isPlaying}
        aria-label={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
        title={!ready ? "Add /audio/ambient-loop.mp3 to enable" : undefined}
        className="group fixed bottom-[76px] left-4 z-[120] inline-flex items-center gap-3 rounded-full border border-line bg-ink/55 px-4 py-2.5 backdrop-blur-md transition-colors duration-300 hover:border-bone/40 md:bottom-7 md:left-7"
      >
        {/* 4-line equalizer */}
        <span ref={barsRef} className="flex h-4 items-end gap-[3px]">
          {BARS.map((i) => (
            <span
              key={i}
              className="block w-[2px] rounded-full bg-bone"
              style={{ height: "100%", transform: "scaleY(0.2)" }}
            />
          ))}
        </span>

        <span className="text-mono text-[10px] uppercase tracking-[0.24em] text-bone/70 transition-colors group-hover:text-bone">
          {isPlaying ? "Sound On" : "Sound Off"}
        </span>
      </button>
    </>
  );
}
