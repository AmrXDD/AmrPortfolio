import { Hero } from "@/components/sections/hero/hero";
import { FullStack } from "@/components/sections/fullstack";
import { About } from "@/components/sections/about";
import { WorkGrid } from "@/components/sections/work-grid";
import { CaseStudies } from "@/components/sections/case-studies";
import { LaptopScene } from "@/components/sections/showcase/laptop-scene";
import { Guarantees } from "@/components/sections/guarantees";
import { BrowserCodeScene } from "@/components/sections/showcase/browser-code-scene";
import { TechLoop } from "@/components/sections/tech-loop";
import { SoundStudio } from "@/components/sections/sound-studio";
import { Process } from "@/components/sections/process";
import { Expertise } from "@/components/sections/expertise";
import { MotionShowcase } from "@/components/sections/motion-showcase";
import { Philosophy } from "@/components/sections/philosophy";
import { Testimonials } from "@/components/sections/testimonials";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <>
      <Hero />
      {/* Warp from the hero lands here — the full-stack cylinder splits apart */}
      <FullStack />
      <About />
      <WorkGrid />
      {/* Featured case studies: a sideways gallery, each room in its client's colours */}
      <CaseStudies />

      {/* ── Craft showcase: cinematic device sequences ── */}
      <LaptopScene />
      {/* sticky-stacking promise cards with edge-glow borders */}
      <Guarantees />
      <BrowserCodeScene />

      {/* Infinite marquee of the tech stack */}
      <TechLoop />
      {/* Interactive option wheel — its click is the site's global tick sound */}
      <SoundStudio />

      <Process />
      <Expertise />
      <MotionShowcase />
      <Philosophy />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}
