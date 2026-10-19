/*
 * Fire sound effects for the hero, synthesised live with Web Audio (no files):
 *
 *   lidOpen()   the flip-top's metal "clink" as the lid swings open
 *   strike()    the flint wheel's scrape and a scatter of sparks
 *   flame(on)   the lighter catching ("fwoomp") and its soft steady hiss
 *   ignite()    the title catching: a deep whoosh that swells and settles
 *   bed(level)  the title burning: low roar plus random crackles
 *   lidClose()  the lid snapping shut
 *
 * Plays only when the visitor has sound on (the same switch as the music),
 * through one master bus with a limiter so layers never clip.
 */

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let white: AudioBuffer | null = null;
let enabled = false;

// the steady parts
let hiss: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
let bedNodes: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
let bedLevel = 0;
let crackleTimer = 0;

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 8;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    master = ctx.createGain();
    // balanced against the track (as AmbientPlayer plays it): the title
    // catching sits a few dB above the music, the lighter's sounds about
    // level with it, the burning bed well under it
    master.gain.value = 0.8;
    master.connect(limiter).connect(ctx.destination);
    // two seconds of white noise, reused by every effect
    white = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = white.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Follow the site's sound switch (from inside the click that changes it). */
function setEnabled(on: boolean) {
  enabled = on;
  if (on) {
    ensure();
    applyBed();
  } else {
    flame(false);
    applyBed();
  }
}

// the Enter screen's choice and the Sound toggle both carry { on }; both are
// dispatched inside the click, so the context may start right here
if (typeof window !== "undefined") {
  const follow = (e: Event) => setEnabled(!!(e as CustomEvent).detail?.on);
  window.addEventListener("ambient:start", follow);
  window.addEventListener("sound:toggle", follow);
}

const live = () => (enabled ? ensure() : null);

function noise(c: Ctx, at: number, dur: number, loop = false) {
  const src = c.createBufferSource();
  src.buffer = white;
  src.loop = loop;
  src.start(at, Math.random() * 1.5);
  if (!loop) src.stop(at + dur + 0.05);
  return src;
}

function env(c: Ctx, at: number, peak: number, attack: number, decay: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  return g;
}

/** A metallic strike: a click plus a few inharmonic partials ringing out. */
function metal(c: Ctx, at: number, partials: number[], level: number, ring: number) {
  const click = noise(c, at, 0.02);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2500;
  click.connect(hp).connect(env(c, at, level * 0.45, 0.001, 0.018)).connect(master!);
  partials.forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01);
    o.connect(env(c, at, (level * 0.34) / (1 + i * 0.6), 0.002, ring / (1 + i * 0.45))).connect(master!);
    o.start(at);
    o.stop(at + ring + 0.1);
  });
}

export function lidOpen() {
  const c = live();
  if (!c) return;
  const t = c.currentTime + 0.01;
  metal(c, t, [2210, 3370, 4580, 6120, 7940], 0.55, 0.42);
  // the hinge, a little later and lower
  metal(c, t + 0.07, [1180, 1730], 0.18, 0.12);
}

export function lidClose() {
  const c = live();
  if (!c) return;
  const t = c.currentTime + 0.01;
  metal(c, t, [940, 1460, 2280, 3150], 0.42, 0.16);
}

export function strike() {
  const c = live();
  if (!c) return;
  const t = c.currentTime + 0.01;
  // the wheel dragging over flint: band-limited noise, gated roughly
  const src = noise(c, t, 0.24);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3600;
  bp.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  for (let i = 0; i < 12; i++) g.gain.setValueAtTime(0.08 + Math.random() * 0.3, t + i * 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  src.connect(bp).connect(g).connect(master!);
  // sparks: tiny bright ticks
  for (let i = 0; i < 6; i++) {
    const at = t + 0.04 + Math.random() * 0.2;
    const s = noise(c, at, 0.01);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000 + Math.random() * 3000;
    s.connect(hp).connect(env(c, at, 0.12 + Math.random() * 0.12, 0.001, 0.008)).connect(master!);
  }
}

/** The lighter's flame: a soft "fwoomp" as it catches, then a quiet hiss. */
export function flame(on: boolean) {
  const c = enabled ? ensure() : null;
  if (!on) {
    if (hiss && ctx) {
      const n = ctx.currentTime;
      hiss.gain.gain.cancelScheduledValues(n);
      hiss.gain.gain.setTargetAtTime(0.0001, n, 0.08);
      hiss.src.stop(n + 0.5);
    }
    hiss = null;
    return;
  }
  if (!c || hiss) return;
  const t = c.currentTime + 0.01;
  // catch
  const w = noise(c, t, 0.7);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(260, t);
  lp.frequency.exponentialRampToValueAtTime(2400, t + 0.09);
  lp.frequency.exponentialRampToValueAtTime(700, t + 0.6);
  w.connect(lp).connect(env(c, t, 0.5, 0.025, 0.6)).connect(master!);
  // it spits as it takes
  for (let i = 0; i < 7; i++) crackle(c, t + 0.03 + Math.random() * 0.45, 0.8);
  // steady hiss with a slow flicker
  const src = noise(c, t, 0, true);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1300;
  bp.Q.value = 0.6;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.08, t + 0.25);
  const lfo = c.createOscillator();
  const depth = c.createGain();
  lfo.frequency.value = 3.1;
  depth.gain.value = 0.02;
  lfo.connect(depth).connect(gain.gain);
  lfo.start(t);
  src.connect(bp).connect(gain).connect(master!);
  src.addEventListener("ended", () => lfo.stop());
  hiss = { src, gain };
}

/** The title catching fire: a deep whoosh that swells into the music's drop. */
export function ignite() {
  const c = live();
  if (!c) return;
  const t = c.currentTime + 0.005;
  const w = noise(c, t, 2.2);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.9;
  lp.frequency.setValueAtTime(180, t);
  lp.frequency.exponentialRampToValueAtTime(3200, t + 0.35);
  lp.frequency.exponentialRampToValueAtTime(900, t + 2.0);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.36, t + 0.18);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.9);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);
  w.connect(lp).connect(g).connect(master!);
  // a soft low thump underneath
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.4);
  o.connect(env(c, t, 0.3, 0.01, 0.45)).connect(master!);
  o.start(t);
  o.stop(t + 0.6);
  // a burst of crackles as it takes
  for (let i = 0; i < 14; i++) crackle(c, t + 0.1 + Math.random() * 1.2, 0.6 + Math.random() * 0.6);
}

function crackle(c: Ctx, at: number, size: number) {
  const s = noise(c, at, 0.012);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1600 + Math.random() * 4200;
  bp.Q.value = 1.4;
  s.connect(bp).connect(env(c, at, 0.05 + 0.13 * size * Math.random(), 0.001, 0.006 + Math.random() * 0.02)).connect(master!);
}

/**
 * The title burning: a low roar and random crackles, at `level` 0..1
 * (the hero lowers it as the fire scrolls away; 0 stops it). The level is
 * kept while sound is off, so turning sound on finds the fire still burning.
 */
export function bed(level: number) {
  const next = Math.max(0, Math.min(1, level));
  if (Math.abs(next - bedLevel) < 0.02 && (next > 0) === bedLevel > 0) return;
  bedLevel = next;
  applyBed();
}

function applyBed() {
  const c = enabled && bedLevel > 0 ? ensure() : null;
  if (!c) {
    if (bedNodes && ctx) {
      const n = ctx.currentTime;
      bedNodes.gain.gain.cancelScheduledValues(n);
      bedNodes.gain.gain.setTargetAtTime(0.0001, n, 0.3);
      bedNodes.src.stop(n + 1.6);
    }
    bedNodes = null;
    clearInterval(crackleTimer);
    crackleTimer = 0;
    return;
  }
  if (!bedNodes) {
    const t = c.currentTime + 0.01;
    const src = noise(c, t, 0, true);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.Q.value = 0.5;
    const gain = c.createGain();
    // (at the context's now, not at t: a set after the glide below would hold it silent)
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    src.connect(lp).connect(gain).connect(master!);
    bedNodes = { src, gain };
    // crackles on a loose random clock
    crackleTimer = window.setInterval(() => {
      if (!ctx || !bedNodes) return;
      const n = ctx.currentTime;
      const count = Math.random() < 0.5 * bedLevel ? 1 + ((Math.random() * 2) | 0) : 0;
      for (let i = 0; i < count; i++) crackle(ctx, n + 0.02 + Math.random() * 0.12, bedLevel * 0.7);
    }, 140);
  }
  bedNodes.gain.gain.setTargetAtTime(0.13 * bedLevel, c.currentTime, 0.4);
}
