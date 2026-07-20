"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";

const SITE_SHOT = "/projects/livfunctional.png";

function ChromeBar() {
  return (
    <div className="flex items-center gap-3 border-b border-line bg-[#16161a] px-4 py-2.5">
      <div className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="ml-2 flex flex-1 items-center gap-2 rounded-full bg-ink/60 px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="font-mono text-[10px] tracking-wide text-bone/60">livfunctional.com</span>
      </div>
    </div>
  );
}

function CodeEditor() {
  return (
    <div className="code-editor flex h-full flex-col overflow-hidden text-[10px] leading-[1.5] md:text-[11px]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="font-mono text-[10px] tracking-wide text-bone/50">Hero.tsx</span>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        {[
          <><span className="tok-key">export default function</span> <span className="tok-fn">Hero</span><span className="tok-punc">() {`{`}</span></>,
          <>  <span className="tok-key">return</span> <span className="tok-punc">(</span></>,
          <>    <span className="tok-punc">&lt;</span><span className="tok-tag">section</span> <span className="tok-attr">className</span><span className="tok-punc">=</span><span className="tok-str">&quot;hero&quot;</span><span className="tok-punc">&gt;</span></>,
          <>      <span className="tok-punc">&lt;</span><span className="tok-tag">Reveal</span> <span className="tok-attr">delay</span><span className="tok-punc">={`{`}</span><span className="tok-var">0.2</span><span className="tok-punc">{`}`}&gt;</span></>,
          <>        <span className="tok-punc">&lt;</span><span className="tok-tag">h1</span><span className="tok-punc">&gt;</span>Healing, rooted<span className="tok-punc">&lt;/</span><span className="tok-tag">h1</span><span className="tok-punc">&gt;</span></>,
          <>      <span className="tok-punc">&lt;/</span><span className="tok-tag">Reveal</span><span className="tok-punc">&gt;</span></>,
          <>      <span className="tok-com">{`// glucose chart, live`}</span></>,
          <>      <span className="tok-punc">&lt;</span><span className="tok-tag">Glucose</span> <span className="tok-attr">data</span><span className="tok-punc">={`{`}</span><span className="tok-fn">useLive</span><span className="tok-punc">()</span><span className="tok-punc">{`}`}</span> <span className="tok-punc">/&gt;</span></>,
          <>    <span className="tok-punc">&lt;/</span><span className="tok-tag">section</span><span className="tok-punc">&gt;</span></>,
          <>  <span className="tok-punc">)</span></>,
          <><span className="tok-punc">{`}`}</span></>,
          <>&nbsp;</>,
          <><span className="tok-com">{`// shipped from scratch, no template`}</span></>,
        ].map((ln, i) => (
          <div key={i} className="flex gap-4 whitespace-pre">
            <span className="code-gutter w-5 shrink-0 select-none text-right">{i + 1}</span>
            <span className="tok-var">{ln}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrowserCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-ash shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
      <ChromeBar />
      {/* fills the panel; the panel height is tuned so this matches the shot's
          ~1.93 aspect → the whole site shows with no crop */}
      <div className="relative flex-1 overflow-hidden" style={{ background: "#EFEAE2" }}>
        <Image src={SITE_SHOT} alt="LivFunctional rendered" fill sizes="(min-width: 768px) 520px, 90vw" className="object-cover object-top" />
      </div>
    </div>
  );
}

export function BrowserCodeScene() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Horizontal 3D tilt straightening to flat — like the phone
  const rotY = useTransform(scrollYProgress, [0.1, 0.62], [58, 0]);
  const scale = useTransform(scrollYProgress, [0.1, 0.62], [0.92, 1]);
  const codeOpacity = useTransform(scrollYProgress, [0.22, 0.5], [0, 1]);
  const codeX = useTransform(scrollYProgress, [0.22, 0.55], ["8%", "0%"]);

  const headOpacity = useTransform(scrollYProgress, [0, 0.1, 0.18], [1, 1, 0]);
  const tagOpacity = useTransform(scrollYProgress, [0.62, 0.74], [0, 1]);

  if (reduce) {
    return (
      <section className="border-b border-line bg-ink px-5 py-24 md:px-10">
        <div className="mx-auto max-w-[1100px]">
          <Eyebrow index="A4">From Scratch</Eyebrow>
          <h2 className="mt-6 text-display size-h2 text-bone">Rendered &amp; written by hand.</h2>
          <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2">
            <BrowserCard />
            <div className="overflow-hidden rounded-xl border border-line"><CodeEditor /></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative border-b border-line bg-ink" style={{ height: "340vh" }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden scene-3d">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/10 blur-[120px]" />

        <motion.div style={{ opacity: headOpacity }} className="pointer-events-none absolute left-5 top-20 z-30 md:left-10 md:top-28">
          <Eyebrow index="A4">From Scratch</Eyebrow>
          <h2 className="mt-4 max-w-md text-display text-[clamp(1.75rem,4vw,3.25rem)] leading-[0.95] text-bone">
            The render and its <span className="italic text-bone/70">source, hand built.</span>
          </h2>
        </motion.div>

        {/* 3D tilted unit that straightens on scroll */}
        <motion.div
          style={{ rotateY: rotY, scale, transformOrigin: "50% 50%" }}
          className="flex w-[min(1040px,90vw)] flex-col gap-4 will-change-transform preserve-3d md:h-[clamp(280px,34vh,360px)] md:flex-row md:gap-6"
        >
          {/* identical panels: same width (flex-1) and same height (h-full) */}
          <div className="relative h-[38vh] backface-hidden md:h-full md:flex-1">
            <BrowserCard />
          </div>
          <motion.div
            style={{ opacity: codeOpacity, x: codeX }}
            className="relative h-[38vh] overflow-hidden rounded-xl border border-line backface-hidden md:h-full md:flex-1"
          >
            <CodeEditor />
          </motion.div>
        </motion.div>

        <motion.div style={{ opacity: tagOpacity }} className="pointer-events-none absolute bottom-12 left-1/2 z-30 -translate-x-1/2 text-center">
          <p className="text-display text-[clamp(1.5rem,3vw,2.5rem)] italic leading-none text-bone">
            <RevealWords text="We build from scratch." />
          </p>
          <p className="mt-3 text-mono text-[10px] uppercase tracking-[0.28em] text-bone/45">
            No templates · No page builders
          </p>
        </motion.div>
      </div>
    </section>
  );
}
