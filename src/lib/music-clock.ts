/*
 * The ambient track's clock, shared so the hero can land on the music:
 * the title catches fire exactly on second 5 of the track.
 */

let el: HTMLAudioElement | null = null;
let last = { t: -1, at: 0 };

/** AmbientPlayer: the element while the music is on (or starting), else null. */
export function setMusic(next: HTMLAudioElement | null) {
  el = next;
  last = { t: -1, at: 0 };
}

/**
 * Seconds into the track, or null when no music is playing. Some browsers
 * update currentTime only a few times a second; between updates the wall
 * clock carries it on (briefly, so a stall can't run it far ahead).
 */
export function musicTime(): number | null {
  if (!el || el.paused) return null;
  const t = el.currentTime;
  const now = performance.now();
  if (t !== last.t) last = { t, at: now };
  // still at 0: not actually playing yet, so don't run ahead
  if (t === 0) return 0;
  return t + Math.min(0.3, (now - last.at) / 1000);
}
