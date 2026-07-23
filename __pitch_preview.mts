import { writeFileSync } from "node:fs";
import { coldPitchEmail } from "@/lib/emails/templates";
const m = coldPitchEmail({
  company: "Mirror Studio",
  hook: "A second opinion on",
  observation: "Your consultancy positions itself on outcomes, but the site leads with services. The two are fighting each other.",
  angle: "I'd restructure it around the transformation you sell, not the deliverables you ship.",
  offer: ["Positioning and messaging audits for founder-led firms", "Conversion-focused site restructures", "Go-to-market copy that sounds like a person"],
  proof: ["Scenarios: repositioned a contractor as a creative studio; first international RFP within a month", "LivFunctional: bilingual funnel converting cold traffic at 4.1%"],
  proofUrl: "https://scenariosd.vercel.app",
});
writeFileSync("public/__pitch.html", m.html);
console.log("SUBJECT:", m.subject);
console.log("has em-dash in text:", m.text.includes("—"));
