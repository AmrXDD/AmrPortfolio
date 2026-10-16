"use client";

import { motion } from "framer-motion";
import { Pause, Play, Shuffle, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { CLICK_SOUND } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";

const COPY = {
  en: {
    eyebrow: "Sound · Interaction",
    h1: "Play the",
    h2: "interface.",
    p: "The soft tick on every link and button across this site is one sound. Here it is as an instrument: tap a step to hear it, paint a pattern, press play. Motion and sound treated as one material.",
    voices: ["Low", "Body", "Tick", "Air"],
    play: "Play",
    stop: "Stop",
    clear: "Clear",
    shuffle: "Shuffle",
    tempo: "Tempo",
    hint: "Sound plays only when you press play or tap a step.",
  },
  ar: {
    eyebrow: "الصوت · التفاعل",
    h1: "اعزف على",
    h2: "الواجهة.",
    p: "النقرة الهادئة على كل رابط وزر في هذا الموقع صوت واحد. هنا تصبح آلة: انقر خانة لتسمعها، ارسم إيقاعًا، ثم اضغط تشغيل. الحركة والصوت مادة واحدة.",
    voices: ["منخفض", "جسم", "نقرة", "هواء"],
    play: "تشغيل",
    stop: "إيقاف",
    clear: "مسح",
    shuffle: "عشوائي",
    tempo: "الإيقاع",
    hint: "لا يُسمع صوت إلا عند الضغط على تشغيل أو النقر على خانة.",
  },
};

/*
 * Sound · Interaction. The site's UI tick, pitched into four voices, laid
 * out as a sixteen-step sequencer. Tap steps to paint a pattern, press play
 * and the playhead sweeps the grid while an oscilloscope draws the actual
 * signal. Audio is scheduled on the Web Audio clock (look-ahead scheduler),
 * so timing stays tight even when the page is busy. It stops itself when
 * the section leaves the screen or the tab is hidden.
 */

const STEPS = 16;
const RATES = [0.5, 0.78, 1.15, 1.75];
const GAINS = [0.95, 0.75, 0.55, 0.38];
const START: boolean[][] = [
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
].map((r) => r.map(Boolean));

type Engine = {
  ctx: AudioContext;
  out: GainNode;
  analyser: AnalyserNode;
  buf: AudioBuffer | null;
};

export function SoundStudio() {
  const c = useCopy(COPY);
  const { lang } = useLang();
  const [grid, setGrid] = useState(START);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(-1);
  const [bpm, setBpm] = useState(112);
  const [steps, setSteps] = useState(STEPS);

  const engine = useRef<Engine | null>(null);
  const gridRef = useRef(grid);
  const bpmRef = useRef(bpm);
  const stepsRef = useRef(steps);
  gridRef.current = grid;
  bpmRef.current = bpm;
  stepsRef.current = steps;

  const section = useRef<HTMLElement>(null);
  const scope = useRef<HTMLCanvasElement>(null);
  const liveUntil = useRef(0);

  // phones get eight steps so each one is still a decent tap target
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setSteps(mq.matches ? 8 : STEPS);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  /** Create the audio graph on the first gesture inside this section. */
  const ensure = useCallback(async () => {
    if (!engine.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const out = ctx.createGain();
      out.gain.value = 0.7;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      out.connect(analyser).connect(ctx.destination);
      engine.current = { ctx, out, analyser, buf: null };
      try {
        const ab = await (await fetch(CLICK_SOUND)).arrayBuffer();
        engine.current.buf = await ctx.decodeAudioData(ab);
      } catch {
        /* no sound, the grid still works visually */
      }
    }
    if (engine.current.ctx.state === "suspended") await engine.current.ctx.resume();
    return engine.current;
  }, []);

  const voice = (e: Engine, row: number, at: number) => {
    if (!e.buf) return;
    const src = e.ctx.createBufferSource();
    const g = e.ctx.createGain();
    src.buffer = e.buf;
    src.playbackRate.value = RATES[row];
    g.gain.value = GAINS[row];
    src.connect(g).connect(e.out);
    src.start(at);
  };

  /* ── the look-ahead scheduler ── */
  useEffect(() => {
    if (!playing) return;
    const e = engine.current;
    if (!e) return;
    let step = 0;
    let next = e.ctx.currentTime + 0.06;
    const queue: { step: number; time: number }[] = [];
    const tick = setInterval(() => {
      while (next < e.ctx.currentTime + 0.12) {
        const n = stepsRef.current;
        const s = step % n;
        gridRef.current.forEach((row, r) => row[s] && voice(e, r, next));
        queue.push({ step: s, time: next });
        next += 60 / bpmRef.current / 4;
        step = (s + 1) % n;
      }
    }, 25);
    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);
      let shown = -1;
      while (queue.length && queue[0].time <= e.ctx.currentTime) shown = queue.shift()!.step;
      if (shown >= 0) setCur(shown);
    };
    raf = requestAnimationFrame(follow);
    return () => {
      clearInterval(tick);
      cancelAnimationFrame(raf);
      setCur(-1);
    };
  }, [playing]);

  /* ── oscilloscope: draws only while there is signal to show ── */
  useEffect(() => {
    const cv = scope.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    const data = new Uint8Array(1024);
    const flat = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.strokeStyle = "rgba(239,234,226,0.18)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, H / 2);
      g.lineTo(W, H / 2);
      g.stroke();
    };
    const size = () => {
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      flat();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const e = engine.current;
      if (!e || (!playing && performance.now() > liveUntil.current)) {
        flat();
        if (!playing) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
        return;
      }
      e.analyser.getByteTimeDomainData(data);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // fade the previous frames instead of wiping them: hits leave a trail
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "rgba(0,0,0,0.22)";
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "source-over";
      g.lineWidth = 2;
      g.strokeStyle = "#FF4D1F";
      g.shadowColor = "rgba(255,77,31,0.8)";
      g.shadowBlur = 10;
      g.beginPath();
      const n = data.length;
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * W;
        const y = H / 2 + ((data[i] - 128) / 128) * H * 1.6;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
      g.shadowBlur = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    kick();
    window.addEventListener("seq:live", kick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("seq:live", kick);
    };
  }, [playing]);

  /* ── stop when it scrolls away or the tab hides ── */
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => !e.isIntersecting && setPlaying(false), { threshold: 0.05 });
    io.observe(el);
    const vis = () => document.hidden && setPlaying(false);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const toggleStep = async (r: number, s: number) => {
    const on = !grid[r][s];
    setGrid((g) => g.map((row, ri) => (ri === r ? row.map((v, si) => (si === s ? on : v)) : row)));
    if (on) {
      const e = await ensure();
      if (e) {
        voice(e, r, e.ctx.currentTime);
        liveUntil.current = performance.now() + 500;
        window.dispatchEvent(new Event("seq:live"));
      }
    }
  };

  const togglePlay = async () => {
    if (playing) return setPlaying(false);
    const e = await ensure();
    if (e) setPlaying(true);
  };

  const shuffle = () =>
    setGrid(RATES.map((_, r) => Array.from({ length: STEPS }, (_, s) => Math.random() < [0.28, 0.16, 0.3, 0.35][r] || (r === 0 && s % 8 === 0))));

  const ar = lang === "ar";

  return (
    <section ref={section} className="relative overflow-hidden border-b border-line bg-ink px-5 py-24 md:px-10 md:py-32">
      {/* the room glows with the beat */}
      <motion.div
        aria-hidden
        animate={{ opacity: playing ? [0.35, 0.6, 0.35] : 0.18 }}
        transition={playing ? { duration: 60 / bpm, repeat: Infinity, ease: "easeOut" } : { duration: 0.6 }}
        className="pointer-events-none absolute -bottom-[30%] left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,77,31,0.35),transparent_62%)]"
      />

      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <Eyebrow index="A3">{c.eyebrow}</Eyebrow>
          <h2 key={lang} className="mt-6 text-display size-h2 text-bone">
            <RevealWords text={c.h1} />{" "}
            <span className="italic text-accent">
              <RevealWords text={c.h2} delay={0.1} />
            </span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-bone/65">{c.p}</p>
          <p className="mt-6 flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {c.hint}
          </p>
        </div>

        {/* the machine */}
        <div data-no-tick className="relative rounded-[28px] border border-line bg-ash/50 p-4 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:p-6">
          {/* oscilloscope */}
          <div className="relative h-24 overflow-hidden rounded-2xl border border-line bg-ink sm:h-28">
            <div aria-hidden className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(239,234,226,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(239,234,226,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
            <canvas ref={scope} aria-hidden className="absolute inset-0 h-full w-full" />
            <span dir="ltr" className="absolute end-3 top-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/40">
              {bpm} bpm
            </span>
          </div>

          {/* step lights */}
          <div dir="ltr" className="mt-5 grid gap-1.5 ps-0 sm:ps-16" style={{ gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))` }}>
            {Array.from({ length: steps }, (_, s) => (
              <span key={s} className={`mx-auto h-1.5 w-1.5 rounded-full transition-colors duration-75 ${s === cur ? "bg-accent shadow-[0_0_10px_rgba(255,77,31,0.9)]" : s % 4 === 0 ? "bg-bone/40" : "bg-bone/15"}`} />
            ))}
          </div>

          {/* the grid */}
          <div dir="ltr" className="mt-3 space-y-1.5">
            {grid.map((row, r) => (
              <div key={r} className="flex items-center gap-2">
                <span dir={ar ? "rtl" : undefined} className="hidden w-14 shrink-0 text-mono text-[10px] uppercase tracking-[0.16em] text-bone/45 sm:block">
                  {c.voices[r]}
                </span>
                <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))` }}>
                  {row.slice(0, steps).map((on, s) => {
                    const hit = on && s === cur;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${c.voices[r]} ${s + 1}`}
                        onClick={() => toggleStep(r, s)}
                        data-cursor="link"
                        className={`relative aspect-square rounded-[6px] border transition-[background-color,transform,box-shadow,border-color] duration-100 ${
                          on
                            ? r === 2
                              ? "border-accent bg-accent"
                              : "border-bone/80 bg-bone"
                            : `border-line ${s % 4 === 0 ? "bg-bone/[0.07]" : "bg-bone/[0.03]"} hover:bg-bone/15`
                        } ${s === cur ? "border-accent/70" : ""} ${hit ? "scale-110 shadow-[0_0_22px_rgba(255,77,31,0.85)]" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* transport */}
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={togglePlay}
              data-cursor="link"
              className={`group inline-flex h-14 items-center gap-3 rounded-full px-6 text-sm font-medium transition-colors ${playing ? "bg-bone text-ink" : "bg-accent text-ink"}`}
            >
              {playing ? <Pause size={16} /> : <Play size={16} className="rtl:-scale-x-100" />}
              {playing ? c.stop : c.play}
            </button>
            <button type="button" onClick={shuffle} data-cursor="link" className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-mono text-[10px] uppercase tracking-[0.2em] text-bone/70 transition-colors hover:border-bone/40 hover:text-bone">
              <Shuffle size={13} /> {c.shuffle}
            </button>
            <button
              type="button"
              onClick={() => setGrid(START.map((r) => r.map(() => false)))}
              data-cursor="link"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-mono text-[10px] uppercase tracking-[0.2em] text-bone/70 transition-colors hover:border-bone/40 hover:text-bone"
            >
              <Trash2 size={13} /> {c.clear}
            </button>
            <label className="flex min-w-[180px] flex-1 items-center gap-3 text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">
              {c.tempo}
              <input
                type="range"
                min={80}
                max={160}
                value={bpm}
                onChange={(e) => setBpm(+e.target.value)}
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-bone/15 accent-[#FF4D1F]"
                aria-label={c.tempo}
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
