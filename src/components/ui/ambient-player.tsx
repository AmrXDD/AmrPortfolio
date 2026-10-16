"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLang } from "@/lib/i18n";

const BARS = [0, 1, 2, 3];
const SRC = "/audio/ambient-loop.mp3";
const VOLUME = 0.3; // ambient bed level — present but not intrusive
const LOOP_END = 105; // seconds — only use 0:00 → 1:45 of the track, then loop
const FADE_IN = 2.5; // seconds, on play
const FADE_OUT = 1.4; // seconds, on mute
const XFADE = 6; // seconds of overlap where the end melts into the start

type Voice = { el: HTMLAudioElement; gain: GainNode | null };

/*
 * Equal-power curve from `from` to `to`: the sum of two crossfading voices
 * stays at constant loudness, so the loop point has no dip or bump.
 */
function curve(from: number, to: number, rising: boolean, n = 64) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const q = ((i / (n - 1)) * Math.PI) / 2;
    // rising follows sin (fast then gentle), falling follows cos (gentle then fast)
    c[i] = rising ? from + (to - from) * Math.sin(q) : to + (from - to) * Math.cos(q);
  }
  return c;
}

/**
 * AmbientPlayer — a premium, minimalist background-audio controller.
 *
 * • Autoplay-safe: defaults to PAUSED and waits for an explicit user click
 *   (browsers block unsolicited audio).
 * • Never cuts: playback fades in, muting fades out, and the loop point is a
 *   6s equal-power crossfade between two copies of the track, so 1:45 melts
 *   back into 0:00. Gain runs through Web Audio (iOS ignores element.volume).
 * • The toggle holds a 4-line equalizer: while playing, a GSAP loop animates the
 *   bars with a random scaleY (yoyo, repeat -1, fresh randoms each cycle); when
 *   paused, the loop is killed and the bars ease back to a flat resting state.
 */
export function AmbientPlayer() {
  const ar = useLang().lang === "ar";
  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);
  const barsRef = useRef<HTMLSpanElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(true);

  // Audio graph + playback state live in refs: none of it should re-render.
  const ctxRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef<Voice[]>([]);
  const currentRef = useRef(0); // index of the voice carrying the music
  const xfadingRef = useRef(false);
  const playingRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  /** Build the Web Audio graph once, inside a user gesture. */
  const ensureGraph = () => {
    if (voicesRef.current.length) return voicesRef.current;
    const els = [aRef.current, bRef.current].filter(Boolean) as HTMLAudioElement[];
    const AC =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (AC) {
      try {
        const ctx = new AC();
        ctxRef.current = ctx;
        voicesRef.current = els.map((el) => {
          const gain = ctx.createGain();
          gain.gain.value = 0;
          ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
          el.volume = 1;
          return { el, gain };
        });
        return voicesRef.current;
      } catch {
        // fall through to element volume
      }
    }
    voicesRef.current = els.map((el) => ({ el, gain: null }));
    return voicesRef.current;
  };

  /** Ramp one voice's level. Falls back to stepping element.volume. */
  const fade = (v: Voice, to: number, seconds: number, rising: boolean) => {
    const ctx = ctxRef.current;
    if (v.gain && ctx) {
      const now = ctx.currentTime;
      const from = v.gain.gain.value;
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setValueCurveAtTime(curve(from, to, rising), now, seconds);
      return;
    }
    const from = v.el.volume;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (seconds * 1000));
      v.el.volume = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const start = async () => {
    const voices = ensureGraph();
    const v = voices[currentRef.current];
    if (!v) throw new Error("no audio");
    clearTimers();
    xfadingRef.current = false;
    // Only the carrying voice plays; a half-finished crossfade is dropped.
    voices.forEach((o, i) => {
      if (i !== currentRef.current) o.el.pause();
    });
    await ctxRef.current?.resume();
    if (!v.gain) v.el.volume = 0;
    await v.el.play();
    playingRef.current = true;
    fade(v, VOLUME, FADE_IN, true);
  };

  const stop = () => {
    playingRef.current = false;
    xfadingRef.current = false;
    clearTimers();
    for (const v of voicesRef.current) {
      if (!v.el.paused) fade(v, 0, FADE_OUT, false);
    }
    // Pause only once the fade has finished; restarting cancels this.
    timersRef.current.push(
      window.setTimeout(() => voicesRef.current.forEach((v) => v.el.pause()), FADE_OUT * 1000 + 60)
    );
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

  // The loop: shortly before 1:45 (or the track's end, if shorter) the other
  // voice starts from 0:00 and the two crossfade, so there's never a cut.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!playingRef.current || xfadingRef.current) return;
      const voices = voicesRef.current;
      const cur = voices[currentRef.current];
      const next = voices[1 - currentRef.current];
      if (!cur || !next) return;
      const end = Math.min(LOOP_END, Number.isFinite(cur.el.duration) ? cur.el.duration : LOOP_END);
      if (cur.el.currentTime < end - XFADE) return;

      xfadingRef.current = true;
      next.el.currentTime = 0;
      if (next.gain) next.gain.gain.value = 0;
      else next.el.volume = 0;
      next.el
        .play()
        .then(() => {
          fade(next, VOLUME, XFADE, true);
          fade(cur, 0, XFADE, false);
          timersRef.current.push(
            window.setTimeout(() => {
              cur.el.pause();
              cur.el.currentTime = 0;
              currentRef.current = 1 - currentRef.current;
              xfadingRef.current = false;
            }, XFADE * 1000 + 80)
          );
        })
        .catch(() => {
          // Couldn't start the second voice: fade the end out and restart.
          fade(cur, 0, 1.2, false);
          timersRef.current.push(
            window.setTimeout(() => {
              cur.el.currentTime = 0;
              fade(cur, VOLUME, FADE_IN, true);
              xfadingRef.current = false;
            }, 1250)
          );
        });
    }, 200);
    return () => {
      clearInterval(id);
      clearTimers();
    };
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
      {/* two voices of the same track, crossfaded at the loop point */}
      <audio ref={aRef} src={SRC} preload="auto" aria-hidden />
      <audio ref={bRef} src={SRC} preload="auto" aria-hidden />

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
