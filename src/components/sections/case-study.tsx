"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import type { Project } from "@/lib/constants";
import { Magnetic } from "@/components/ui/magnetic";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal, RevealWords } from "@/components/ui/reveal";
import { ArrowUpRight } from "lucide-react";

/* A polished browser mockup. Its screen area matches the screenshots' ~1.94
   aspect ratio, so object-cover shows the whole site with no letterbox and no
   awkward crop. */
function CaseFrame({ project }: { project: Project }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#0d0d0f] shadow-[0_50px_120px_-50px_rgba(0,0,0,0.95)]">
      {/* browser chrome */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5" style={{ background: "#141417" }}>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-1 flex flex-1 items-center gap-2 truncate rounded-full bg-black/50 px-3 py-1">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span className="truncate font-mono text-[10px] tracking-wide text-bone/55">
            {project.url.replace(/^https?:\/\//, "")}
          </span>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-bone/35 sm:inline">/{project.slug}</span>
      </div>

      {/* screen — aspect tuned to the captures so the shot fills edge-to-edge */}
      <div className="relative w-full" style={{ aspectRatio: "1.94", background: project.palette.bg }}>
        {project.image && !errored ? (
          <Image
            src={project.image}
            alt={`${project.client} — ${project.title}`}
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover object-top"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-display text-[12vw] italic leading-none text-bone/15" style={{ mixBlendMode: "overlay" }}>
              /{project.slug}
            </span>
          </div>
        )}
        {/* whisper-soft top sheen so the chrome meets the shot cleanly */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/15 to-transparent" />
      </div>
    </div>
  );
}

export function CaseStudy({
  project,
  flagship = false,
}: {
  project: Project;
  flagship?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 1.02]);

  return (
    <section
      id={`case-${project.slug}`}
      ref={ref}
      className="relative border-b border-line bg-ink px-5 py-16 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-[1280px]">
        {/* Meta header */}
        <div className="mb-10 grid grid-cols-12 items-end gap-y-8 border-b border-line pb-10 md:mb-12 md:pb-12">
          <div className="col-span-12 md:col-span-6">
            <Eyebrow index={project.index}>
              {flagship ? "Featured Case Study" : "Case Study"}
            </Eyebrow>
            <h2 className="mt-6 text-display size-h2 text-bone">
              <RevealWords text={project.title.split("—")[0].trim()} />
              <br />
              <span className="italic text-bone/80">
                <RevealWords text={`— ${project.title.split("—")[1]?.trim() ?? ""}`} delay={0.1} />
              </span>
            </h2>
          </div>
          <div className="col-span-12 grid grid-cols-3 gap-3 md:col-span-6 md:gap-6">
            <div>
              <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">Client</p>
              <p className="mt-2 text-sm text-bone">{project.client}</p>
            </div>
            <div>
              <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">Role</p>
              <p className="mt-2 text-sm text-bone">{project.role}</p>
            </div>
            <div>
              <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">Status</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-bone">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    project.status === "In Development"
                      ? "animate-pulse bg-amber-300"
                      : "bg-emerald-400"
                  }`}
                />
                {project.status}
              </p>
            </div>
          </div>
        </div>

        {/* Big visual — a browser mockup showing the full live site */}
        <motion.div
          style={{ y, scale }}
          className={`relative mx-auto w-full ${flagship ? "max-w-4xl" : "max-w-2xl"}`}
        >
          <CaseFrame project={project} />
        </motion.div>

        {/* Summary */}
        <div className="mt-12 grid grid-cols-12 gap-y-12 md:mt-16">
          <div className="col-span-12 md:col-span-5">
            <p className="eyebrow">Premise</p>
            <p className="mt-6 text-display text-[clamp(1.5rem,2.6vw,2.5rem)] leading-[1.1] text-bone/90">
              {project.summary}
            </p>
          </div>
          <div className="col-span-12 grid grid-cols-1 gap-10 md:col-span-7 md:grid-cols-3">
            <Reveal>
              <p className="eyebrow">Challenge</p>
              <p className="mt-4 text-sm leading-relaxed text-bone/70">{project.challenge}</p>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="eyebrow">Approach</p>
              <p className="mt-4 text-sm leading-relaxed text-bone/70">{project.approach}</p>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="eyebrow">Outcome</p>
              <p className="mt-4 text-sm leading-relaxed text-bone/70">{project.outcome}</p>
            </Reveal>
          </div>
        </div>

        {/* Metrics + stack + CTA */}
        <div className="mt-12 grid grid-cols-12 items-end gap-y-12 border-t border-line pt-10 md:mt-16 md:pt-12">
          {project.metrics ? (
            <div className="col-span-12 grid grid-cols-3 gap-3 md:col-span-6 md:gap-6">
              {project.metrics.map((m) => (
                <div key={m.label}>
                  <p className="text-display text-[clamp(2rem,4vw,3.5rem)] leading-none text-bone">
                    {m.value}
                  </p>
                  <p className="mt-2 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-12 md:col-span-6">
              <p className="eyebrow">Stack</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-line px-3 py-1 text-mono text-[10px] uppercase tracking-[0.18em] text-bone/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="col-span-12 md:col-span-6 md:text-right">
            {project.metrics ? (
              <div className="mb-6 flex flex-wrap gap-2 md:justify-end">
                {project.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-line px-3 py-1 text-mono text-[10px] uppercase tracking-[0.18em] text-bone/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
            <Magnetic strength={0.2}>
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                data-cursor="link"
                data-cursor-label={project.status === "In Development" ? "Preview" : "Live"}
                className="btn-ghost"
              >
                {project.status === "In Development" ? "Preview build" : "Visit live site"}
                <ArrowUpRight size={14} />
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
