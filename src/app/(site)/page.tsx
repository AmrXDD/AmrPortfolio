import { Hero } from "@/components/sections/hero/hero";
import { FullStack } from "@/components/sections/fullstack";
import { About } from "@/components/sections/about";
import { WorkGrid } from "@/components/sections/work-grid";
import { CaseStudies } from "@/components/sections/case-studies";
import { BookingStrip } from "@/components/sections/booking-strip";
import { CraftAnatomy } from "@/components/sections/showcase/craft-anatomy";
import { Guarantees } from "@/components/sections/guarantees";
import { CodeToUI } from "@/components/sections/showcase/code-to-ui";
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
      {/* right after the work: the booking, one tap away */}
      <BookingStrip />

      {/* ── Craft showcase: cinematic device sequences ── */}
      <CraftAnatomy />
      {/* sticky-stacking promise cards with edge-glow borders */}
      <Guarantees />
      <CodeToUI />

      {/* The site's UI tick, played as a step sequencer */}
      <SoundStudio />

      <Process />
      <Expertise />
      <MotionShowcase />
      <Philosophy />
      <Testimonials />
      {/* "Built for these four" → built with: the stack, and what this site runs on */}
      <TechLoop />
      <CTA />
      <Footer />
    </>
  );
}
