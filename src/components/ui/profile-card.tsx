"use client";

import { memo, useEffect, useRef, type CSSProperties } from "react";
import { CalendarDays } from "lucide-react";

/*
 * ProfileCard: a holographic, tilting card (after React Bits' ProfileCard,
 * typed and fitted to the site: its type, the ember tile, the logo as the
 * foil's pattern, and the intro tilt playing when it comes into view rather
 * than on page load). The spring loop runs only while the card is moving.
 * Styles: globals.css, "The profile card".
 */

type Vars = Record<string, string | number>;

const THEMES: Record<"dark" | "light", Vars> = {
  dark: {
    "--pc-frame": "rgba(20, 16, 18, 0.72)",
    "--pc-frame-edge": "rgba(255, 255, 255, 0.08)",
    "--pc-frame-highlight": "rgba(255, 255, 255, 0.07)",
    "--pc-frame-shadow": "0 30px 60px -24px rgba(0, 0, 0, 0.85), 0 0 80px -30px rgba(255, 77, 31, 0.45)",
    "--pc-tile": "linear-gradient(180deg, #2a1d1a 0%, #141012 100%)",
    "--pc-tile-edge": "rgba(255, 255, 255, 0.07)",
    "--pc-tile-highlight": "rgba(255, 255, 255, 0.12)",
    "--pc-tile-shadow": "0 4px 10px -4px rgba(0, 0, 0, 0.7)",
    "--pc-ink": "#f5f5f5",
    "--pc-muted": "rgba(245, 245, 245, 0.6)",
    "--pc-hover": "brightness(1.12)",
    "--pc-press": "brightness(0.8)",
    "--pc-shade": "rgba(0, 0, 0, 0.4)",
  },
  light: {
    "--pc-frame": "rgba(240, 238, 234, 0.85)",
    "--pc-frame-edge": "rgba(24, 24, 27, 0.07)",
    "--pc-frame-highlight": "rgba(255, 255, 255, 0.95)",
    "--pc-frame-shadow": "0 26px 50px -24px rgba(24, 24, 27, 0.35), 0 0 70px -30px rgba(255, 77, 31, 0.35)",
    "--pc-tile": "linear-gradient(180deg, #ffffff 0%, #f4f2ee 100%)",
    "--pc-tile-edge": "rgba(24, 24, 27, 0.08)",
    "--pc-tile-highlight": "rgba(255, 255, 255, 1)",
    "--pc-tile-shadow": "0 4px 10px -5px rgba(24, 24, 27, 0.25)",
    "--pc-ink": "#111111",
    "--pc-muted": "rgba(17, 17, 17, 0.6)",
    "--pc-hover": "brightness(0.97)",
    "--pc-press": "brightness(0.92)",
    "--pc-shade": "rgba(24, 24, 27, 0.14)",
  },
};

const FOILS: Record<"dark" | "light", Vars> = {
  dark: { "--pc-blend": "color-dodge", "--pc-holo-filter": "hue-rotate(0deg)", "--pc-sheen": "rgba(255, 255, 255, 0.16)" },
  light: { "--pc-blend": "multiply", "--pc-holo-filter": "invert(1) hue-rotate(180deg)", "--pc-sheen": "rgba(255, 255, 255, 0)" },
};

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
)}")`;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type Props = {
  avatarUrl?: string;
  iconUrl?: string;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  statusColor?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  theme?: "dark" | "light";
  /** the tile behind the photo (a CSS background); defaults to the theme's */
  backdrop?: string;
  radius?: number;
  holo?: number;
  glare?: number;
  enableTilt?: boolean;
  tiltStrength?: number;
  parallax?: number;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  intro?: boolean;
  className?: string;
};

function ProfileCard({
  avatarUrl = "",
  iconUrl,
  miniAvatarUrl,
  name = "",
  title = "",
  handle = "",
  status = "",
  statusColor = "#34d399",
  contactText = "Contact",
  showUserInfo = true,
  onContactClick,
  theme = "dark",
  backdrop,
  radius = 16,
  holo = 0.8,
  glare = 0.5,
  enableTilt = true,
  tiltStrength = 12,
  parallax = 8,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  intro = true,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{ aim: (x: number, y: number, on?: boolean) => void; write: () => void; intro: () => void } | null>(null);
  const settingsRef = useRef({ enableTilt, tiltStrength, parallax, mobileTiltSensitivity, intro });
  settingsRef.current = { enableTilt, tiltStrength, parallax, mobileTiltSensitivity, intro };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size = { width: root.offsetWidth, height: root.offsetHeight };
    const x = { p: 0, v: 0, target: 0 };
    const y = { p: 0, v: 0, target: 0 };
    const light = { p: 0, target: 0 };
    let raf = 0;
    let last = 0;
    let slowUntil = 0;
    let touchId: number | null = null;

    const write = () => {
      const { enableTilt: on, tiltStrength: strength, parallax: depth } = settingsRef.current;
      const angle = on && !reduced ? strength : 0;
      const tilt = Math.min(1, Math.hypot(x.p, y.p));
      const s = root.style;
      s.setProperty("--pc-light-x", `${((x.p + 1) * 0.5 * size.width).toFixed(1)}px`);
      s.setProperty("--pc-light-y", `${((y.p + 1) * 0.5 * size.height).toFixed(1)}px`);
      s.setProperty("--pc-pointer-x", `${((x.p + 1) * 50).toFixed(2)}%`);
      s.setProperty("--pc-pointer-y", `${((y.p + 1) * 50).toFixed(2)}%`);
      s.setProperty("--pc-band-x", `${(50 + x.p * 15).toFixed(2)}%`);
      s.setProperty("--pc-band-y", `${(50 + y.p * 15).toFixed(2)}%`);
      s.setProperty("--pc-rotate-x", `${(y.p * angle).toFixed(3)}deg`);
      s.setProperty("--pc-rotate-y", `${(-x.p * angle).toFixed(3)}deg`);
      s.setProperty("--pc-shift-x", `${(x.p * (reduced ? 0 : depth)).toFixed(2)}px`);
      s.setProperty("--pc-shift-y", `${(y.p * (reduced ? 0 : depth)).toFixed(2)}px`);
      s.setProperty("--pc-reach", tilt.toFixed(4));
      s.setProperty("--pc-tilt", (tilt * light.p).toFixed(4));
      s.setProperty("--pc-active", light.p.toFixed(4));
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const slow = now < slowUntil;
      const stiffness = slow ? 24 : 120;
      const damping = slow ? 9 : 16;
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        for (const a of [x, y]) {
          a.v += (stiffness * (a.target - a.p) - damping * a.v) * h;
          a.p += a.v * h;
        }
      }
      const tau = light.target > light.p ? 0.18 : slow ? 0.9 : 0.45;
      light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));
      write();
      const moving =
        Math.abs(x.target - x.p) > 0.0005 ||
        Math.abs(y.target - y.p) > 0.0005 ||
        Math.abs(x.v) > 0.0005 ||
        Math.abs(y.v) > 0.0005 ||
        Math.abs(light.target - light.p) > 0.002;
      if (moving) raf = requestAnimationFrame(frame);
      else {
        x.p = x.target;
        y.p = y.target;
        light.p = light.target;
        write();
        raf = 0;
      }
    };
    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const aim = (nx: number, ny: number, on = true) => {
      x.target = clamp(nx, -1, 1);
      y.target = clamp(ny, -1, 1);
      light.target = on ? 1 : 0;
      slowUntil = 0;
      wake();
    };
    const aimAt = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      if (!r.width || !r.height) return;
      aim(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const release = () => aim(0, 0, false);
    const onEnter = (e: PointerEvent) => e.pointerType === "mouse" && aimAt(e);
    const onMove = (e: PointerEvent) => (e.pointerType === "mouse" || e.pointerId === touchId) && aimAt(e);
    const onLeave = (e: PointerEvent) => e.pointerType === "mouse" && release();
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      touchId = e.pointerId;
      aimAt(e);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== touchId) return;
      touchId = null;
      release();
    };
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);

    const ro = new ResizeObserver(() => {
      size.width = root.offsetWidth;
      size.height = root.offsetHeight;
      write();
    });
    ro.observe(root);

    // the intro sweep: a slow swing of the light across the foil
    const playIntro = () => {
      if (reduced) return;
      x.p = 0.62;
      y.p = -0.55;
      light.p = 1;
      slowUntil = performance.now() + 1400;
      write();
      wake();
    };
    engineRef.current = { aim, write, intro: playIntro };
    write();

    // …played when the card comes into view, not on page load
    let io: IntersectionObserver | null = null;
    if (settingsRef.current.intro) {
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          playIntro();
          io?.disconnect();
        },
        { threshold: 0.4 }
      );
      io.observe(root);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.write();
  }, [enableTilt, tiltStrength, parallax]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enableMobileTilt) return;
    let listening = false;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      const k = settingsRef.current.mobileTiltSensitivity;
      engineRef.current?.aim((e.gamma * k) / 150, ((e.beta - 20) * k) / 150);
    };
    const listen = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("deviceorientation", onOrientation);
    };
    const onClick = () => {
      const M = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (M && typeof M.requestPermission === "function") {
        M.requestPermission()
          .then((s) => s === "granted" && listen())
          .catch(() => {});
      } else listen();
    };
    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("click", onClick);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [enableMobileTilt]);

  const palette = theme === "light" ? "light" : "dark";
  const style = {
    ...THEMES[palette],
    ...FOILS[palette],
    "--pc-radius": `${Math.max(0, radius)}px`,
    "--pc-backdrop": backdrop ?? "var(--pc-tile)",
    "--pc-holo": clamp(holo, 0, 1),
    "--pc-glare": clamp(glare, 0, 1),
    "--pc-parallax": `${Math.max(0, parallax)}px`,
    "--pc-status": statusColor,
    "--pc-grain": GRAIN,
    "--pc-pattern": iconUrl ? `url("${iconUrl}")` : "linear-gradient(#000, #000)",
    "--pc-pattern-size": iconUrl ? "180% auto" : "100% 100%",
    "--pc-holo-gain": iconUrl ? 1.25 : 0.75,
    "--pc-holo-detail": iconUrl && palette === "dark" ? 1 : 0,
  } as CSSProperties;

  return (
    <div ref={rootRef} className={`profile-card ${className}`.trim()} style={style}>
      <div className="profile-card__body">
        <div className="profile-card__tile">
          <span className="profile-card__sheen" />
          <span className="profile-card__holo">
            <span className="profile-card__holo-glow" />
            <span className="profile-card__holo-shift" />
          </span>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="profile-card__photo" src={avatarUrl} alt={name} loading="lazy" draggable={false} />
          ) : null}
          {name || title ? (
            <>
              <span className="profile-card__scrim" />
              <div className="profile-card__info">
                {name ? <h3 className="profile-card__name">{name}</h3> : null}
                {title ? <p className="profile-card__title">{title}</p> : null}
              </div>
            </>
          ) : null}
          <span className="profile-card__tile-rim" />
        </div>

        {showUserInfo ? (
          <div className="profile-card__footer">
            {miniAvatarUrl ? (
              <span className="profile-card__avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={miniAvatarUrl} alt="" loading="lazy" draggable={false} />
              </span>
            ) : null}
            <div className="profile-card__meta">
              {handle ? (
                <span dir="ltr" className="profile-card__handle">
                  @{handle}
                </span>
              ) : null}
              {status ? <span className="profile-card__status">{status}</span> : null}
            </div>
            {contactText ? (
              <button type="button" data-cursor="link" className="profile-card__contact" onClick={onContactClick} aria-label={name ? `${contactText}, ${name}` : contactText}>
                <CalendarDays size={15} strokeWidth={1.8} />
                {contactText}
              </button>
            ) : null}
          </div>
        ) : null}

        <span className="profile-card__glare" />
        <span className="profile-card__shade" />
        <span className="profile-card__rim" />
      </div>
    </div>
  );
}

export default memo(ProfileCard);
