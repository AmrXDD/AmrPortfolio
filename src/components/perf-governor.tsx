"use client";

import { useEffect } from "react";

/*
 * PerfGovernor: keeps the site smooth on weak machines. It marks the page
 * "lite" (html.lite) up front on low-end hardware (little memory, two cores,
 * data saver), and otherwise measures the real frame rate for two seconds
 * after the visitor enters: if it can't hold ~45 fps, lite it is. Lite means
 * no grain or backdrop blur (CSS), a comet that sleeps when still, and the
 * fire at 30 fps; a "perf:lite" event tells the canvases.
 */
export function PerfGovernor() {
  useEffect(() => {
    const html = document.documentElement;
    const lite = () => {
      if (html.classList.contains("lite")) return;
      html.classList.add("lite");
      window.dispatchEvent(new Event("perf:lite"));
    };
    const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if ((n.deviceMemory ?? 8) <= 4 || (n.hardwareConcurrency ?? 8) <= 2 || n.connection?.saveData) return lite();

    let raf = 0;
    let t0 = 0;
    const probe = () => {
      const gaps: number[] = [];
      let last = performance.now();
      const tick = (now: number) => {
        gaps.push(now - last);
        last = now;
        if (now - t0 < 2000) raf = requestAnimationFrame(tick);
        else {
          gaps.sort((a, b) => a - b);
          // the median frame: slower than ~45 fps is a machine to go easy on
          if (gaps[gaps.length >> 1] > 22) lite();
        }
      };
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
    };
    // measure once the site is running (after the Enter screen), not during it
    let timer = 0;
    const onEnter = () => (timer = window.setTimeout(probe, 1800));
    if (!html.classList.contains("preloading")) onEnter();
    else window.addEventListener("ambient:start", onEnter, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("ambient:start", onEnter);
    };
  }, []);
  return null;
}
