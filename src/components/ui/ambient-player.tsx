"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLang } from "@/lib/i18n";
import { setMusic } from "@/lib/music-clock";

const BARS = [0, 1, 2, 3];
const SRC = "/audio/ambient-loop.mp3";
const VOLUME = 0.3; // ambient bed level — present but not intrusive
const LOOP_END = 218; // seconds — the whole track (it fades out on its own by 3:38), then loop
const FADE_IN = 3; // seconds, on play and after each loop
const FADE_OUT = 1.6; // seconds, on mute
const LOOP_FADE = 4; // seconds the end of the loop fades out over
const GAP = 0.6; // seconds of silence between the fade-out and the restart

/**
 * AmbientPlayer — a premium, minimalist background-audio controller.
 *
 * • Autoplay-safe: defaults to PAUSED and waits for an explicit user click
 *   (browsers block unsolicited audio).
 * • Never cuts: playback fades in, muting fades out, and at the loop point
 *   the track fades out, rests a breath, and fades back in from 0:00. One
 *   voice only — the end and the start of the song never play on top of
 *   each other. Gain runs through Web Audio (iOS ignores element.volume),
 *   and every ramp is anchored at the current level so rapid toggles can't
 *   pop or jump.
 * • The toggle holds a 4-line equalizer: while playing, a GSAP loop animates the
 *   bars with a random scaleY (yoyo, repeat -1, fresh randoms each cycle); when
 *   paused, the loop is killed and the bars ease back to a flat resting state.
 */
export function AmbientPlayer() {
  const ar = useLang().lang === "ar";
  const audioRef = useRef<HTMLAudioElement>(null);
  const barsRef = useRef<HTMLSpanElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(true);

  // Audio graph + playback state live in refs: none of it should re-render.
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const playingRef = useRef(false);
  const loopingRef = useRef(false); // inside the fade-out → restart window
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  /** Build the Web Audio graph once, inside a user gesture. */
  const ensureGraph = () => {
    const el = audioRef.current;
    if (!el || ctxRef.current || gainRef.current) return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = new AC();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
      el.volume = 1;
      ctxRef.current = ctx;
      gainRef.current = gain;
    } catch {
      // no Web Audio: fall back to element volume below
    }
  };

  /**
   * Glide to `to` over `seconds`, starting from wherever the level is right
   * now. Anchoring at the current value (cancelAndHold where available) is
   * what keeps an interrupted fade from snapping or clicking.
   */
  const fadeTo = (to: number, seconds: number) => {
    const el = audioRef.current;
    const ctx = ctxRef.current;
    const g = gainRef.current?.gain;
    if (ctx && g) {
      const now = ctx.currentTime;
      const held = g.value;
      const p = g as AudioParam & { cancelAndHoldAtTime?: (t: number) => AudioParam };
      if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(now);
      else g.cancelScheduledValues(now);
      g.setValueAtTime(held, now);
      // An S-curve feels like a fader moved by hand, not a switch. Built from
      // short linear ramps rather than setValueCurveAtTime: ramps cancel
      // cleanly mid-fade in every browser, a curve can throw in Firefox.
      const dur = Math.max(0.05, seconds);
      const steps = 12;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        g.linearRampToValueAtTime(held + (to - held) * (0.5 - 0.5 * Math.cos(Math.PI * t)), now + dur * t);
      }
      return;
    }
    if (!el) return;
    const from = el.volume;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (seconds * 1000));
      el.volume = from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * k));
      if (k < 1 && playingRef.current === (to > 0)) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const start = async () => {
    const el = audioRef.current;
    if (!el) throw new Error("no audio");
    ensureGraph();
    clearTimers();
    loopingRef.current = false;
    await ctxRef.current?.resume();
    if (!gainRef.current) el.volume = 0;
    setMusic(el);
    try {
      await el.play();
    } catch (err) {
      setMusic(null);
      throw err;
    }
    playingRef.current = true;
    fadeTo(VOLUME, FADE_IN);
  };

  const stop = () => {
    playingRef.current = false;
    setMusic(null);
    loopingRef.current = false;
    clearTimers();
    fadeTo(0, FADE_OUT);
    // Pause only once the fade has finished; restarting cancels this.
    timersRef.current.push(window.setTimeout(() => audioRef.current?.pause(), FADE_OUT * 1000 + 80));
  };

  const toggle = async () => {
    if (isPlaying) {
      stop();
      setIsPlaying(false);
      window.dispatchEvent(new CustomEvent("sound:toggle", { detail: { on: false } }));
      return;
    }
    // turning on — enable UI tick sounds regardless of whether the music exists
    window.dispatchEvent(new CustomEvent("sound:toggle", { detail: { on: true } }));
    try {
      await start();
      setIsPlaying(true);
      setReady(true);
    } catch {
      // No track yet / autoplay blocked — fail gracefully, stay paused.
      playingRef.current = false;
      setIsPlaying(false);
      setReady(false);
    }
  };

  // The preloader's "Enter with sound" choice fires this — the click there is a
  // valid user gesture, so playback is allowed.
  useEffect(() => {
    const onStart = (e: Event) => {
      if (!(e as CustomEvent).detail?.on) return;
      start()
        .then(() => setIsPlaying(true))
        .catch(() => {
          playingRef.current = false;
          setIsPlaying(false);
          setReady(false);
        });
    };
    window.addEventListener("ambient:start", onStart);
    return () => window.removeEventListener("ambient:start", onStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The loop: shortly before the track's end fade out, rest a
  // breath, jump to 0:00, fade back in. Driven by the element's own
  // timeupdate, which keeps firing in background tabs.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const restart = () => {
      if (!playingRef.current) return;
      el.currentTime = 0;
      if (el.paused) el.play().catch(() => {});
      fadeTo(VOLUME, FADE_IN);
      loopingRef.current = false;
    };
    const onTime = () => {
      if (!playingRef.current || loopingRef.current) return;
      const end = Math.min(LOOP_END, Number.isFinite(el.duration) ? el.duration : LOOP_END);
      if (el.currentTime < end - LOOP_FADE) return;
      loopingRef.current = true;
      fadeTo(0, LOOP_FADE);
      timersRef.current.push(window.setTimeout(restart, (LOOP_FADE + GAP) * 1000));
    };
    // safety net if the track is shorter than expected and simply ends
    const onEnded = () => {
      if (playingRef.current) restart();
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <audio ref={audioRef} src={SRC} preload="auto" aria-hidden />

      <button
        type="button"
        onClick={toggle}
        data-cursor="link"
        aria-pressed={isPlaying}
        aria-label={ar ? (isPlaying ? "كتم الصوت المحيط" : "تشغيل الصوت المحيط") : isPlaying ? "Mute ambient sound" : "Play ambient sound"}
        title={!ready ? "Add /audio/ambient-loop.mp3 to enable" : undefined}
        className="group fixed bottom-[76px] start-4 z-[120] inline-flex items-center gap-3 rounded-full border border-line bg-ink/55 px-4 py-2.5 backdrop-blur-md transition-colors duration-300 hover:border-bone/40 md:bottom-7 md:start-7"
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
          {ar ? (isPlaying ? "الصوت يعمل" : "الصوت مغلق") : isPlaying ? "Sound On" : "Sound Off"}
        </span>
      </button>
    </>
  );
}
