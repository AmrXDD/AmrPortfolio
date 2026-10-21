/*
 * Booking through Cal.com (cal.com/amrstudios), opened as a modal over the
 * site. Cal's embed script is fetched on the first booking tap only, so it is
 * never on a phone's critical path. If it can't load (offline, blocked by a
 * content blocker), the booking links simply open Cal.com in a new tab.
 */

export const CAL_USER = "amrstudios";
export const CAL_URL = `https://cal.com/${CAL_USER}`;
const EMBED_SRC = "https://app.cal.com/embed/embed.js";
const BRAND = "#FF4D1F";

type CalFn = ((...args: unknown[]) => void) & { q?: unknown[][]; loaded?: boolean; ns?: Record<string, unknown> };
type Win = Window & { Cal?: CalFn };

let state: "idle" | "loading" | "ready" | "failed" = "idle";
let queued = false;

/**
 * Cal's own embed snippet, typed: the first call adds the script, and every
 * call is queued until it has loaded (it then replays the queue).
 */
function install(w: Win) {
  if (w.Cal) return;
  const d = w.document;
  w.Cal = function () {
    const cal = w.Cal!;
    // eslint-disable-next-line prefer-rest-params
    const ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      const s = d.createElement("script");
      s.src = EMBED_SRC;
      s.async = true;
      s.onload = () => {
        state = "ready";
        queued = false;
      };
      s.onerror = () => {
        state = "failed";
        // the tap that asked for it still gets its booking: on Cal.com itself
        if (queued) window.location.assign(CAL_URL);
      };
      d.head.appendChild(s);
      cal.loaded = true;
    }
    cal.q!.push(ar as unknown as unknown[]);
  } as CalFn;
}

function load(w: Win) {
  if (state !== "idle") return;
  state = "loading";
  install(w);
  w.Cal!("init", { origin: "https://cal.com" });
}

/** Warm up on hover/press: open the connections before the tap lands. */
export function warmBooking() {
  if (typeof document === "undefined" || document.querySelector('link[data-cal-warm]')) return;
  for (const href of ["https://app.cal.com", "https://cal.com"]) {
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = href;
    l.crossOrigin = "";
    l.dataset.calWarm = "";
    document.head.appendChild(l);
  }
}

/**
 * Open the booking modal. Returns false when the embed is unavailable, so the
 * caller lets its link open Cal.com instead.
 */
export function openBooking(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as Win;
  if (state === "failed") return false;
  // a second tap while the script is still on its way would queue a second modal
  if (state === "loading" && queued) return true;
  load(w);
  queued = state === "loading";
  const theme = document.documentElement.classList.contains("light") ? "light" : "dark";
  w.Cal!("ui", {
    theme,
    hideEventTypeDetails: false,
    layout: "month_view",
    styles: { branding: { brandColor: BRAND } },
    cssVarsPerTheme: { light: { "cal-brand": BRAND }, dark: { "cal-brand": BRAND } },
  });
  w.Cal!("modal", { calLink: CAL_USER, config: { layout: "month_view", theme } });
  return true;
}
