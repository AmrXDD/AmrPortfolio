/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const runtime = "edge";
export const alt = `${SITE.brand} — ${SITE.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0A0A0A",
          color: "#EFEAE2",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Iridescent glow corners */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: 9999,
            background: "radial-gradient(closest-side, rgba(255,77,31,0.55), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: 9999,
            background: "radial-gradient(closest-side, rgba(124,58,237,0.45), transparent 70%)",
          }}
        />

        {/* Top row — logo + locale */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* Logo halo + letter */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 9999,
                background:
                  "conic-gradient(from 0deg, #FF4D1F, #7C3AED, #22D3EE, #FF4D1F)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 9999,
                  background: "#0A0A0A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontStyle: "italic",
                  fontSize: 36,
                  color: "#EFEAE2",
                }}
              >
                a
              </div>
            </div>
            <div
              style={{
                fontSize: 18,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "rgba(239,234,226,0.8)",
                fontFamily: "monospace",
                display: "flex",
              }}
            >
              {SITE.name}/studio
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(239,234,226,0.6)",
              fontFamily: "monospace",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: "#34D399",
                display: "flex",
              }}
            />
            Salmiya · Kuwait · Available
          </div>
        </div>

        {/* Middle — name + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 1 }}>
          <div
            style={{
              fontSize: 140,
              lineHeight: 0.95,
              letterSpacing: -4,
              color: "#EFEAE2",
              display: "flex",
            }}
          >
            Cinematic
          </div>
          <div
            style={{
              fontSize: 140,
              lineHeight: 0.95,
              letterSpacing: -4,
              fontStyle: "italic",
              color: "rgba(239,234,226,0.9)",
              display: "flex",
              marginLeft: 60,
            }}
          >
            interfaces.
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 26,
              color: "rgba(239,234,226,0.7)",
              fontFamily: "monospace",
              letterSpacing: 1,
              display: "flex",
            }}
          >
            {SITE.role}
          </div>
        </div>

        {/* Bottom — accent + URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 80,
                height: 4,
                background: "#FF4D1F",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(239,234,226,0.6)",
                fontFamily: "monospace",
                display: "flex",
              }}
            >
              Portfolio · 2026
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(239,234,226,0.85)",
              fontFamily: "monospace",
              display: "flex",
            }}
          >
            {SITE.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
