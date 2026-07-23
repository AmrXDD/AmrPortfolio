/*
 * Every branded email Amr Studio sends, built on the shared shell so they all
 * carry the same ink / bone / ember look as the generated contract documents.
 *
 * Each builder returns { subject, html, text }, hand it straight to Resend.
 */

import { SITE, waLink } from "@/lib/constants";
import {
  emailShell, toText, esc, h1, sub, section, p, bullets, kv, panel, step, button, linkRow, hero,
} from "./shell";

export type Email = { subject: string; html: string; text: string };

const pack = (subject: string, html: string): Email => ({ subject, html, text: toText(html) });

const firstName = (n: string) => (n || "there").trim().split(/\s+/)[0];

/* ───────────────────────── 1. Inquiry confirmation ─────────────────────────
   Auto-sent to the person who filled in the contact form. */

export type InquiryData = {
  name: string;
  email: string;
  service_label: string;
  budget?: string;
  reason: string;
};

export function inquiryConfirmationEmail(d: InquiryData): Email {
  const body = [
    h1(`Got it, ${firstName(d.name)}.`),
    sub(`Your inquiry landed, ${d.service_label}${d.budget ? ` · ${d.budget}` : ""}`),
    p("Thanks for reaching out. This is an automatic confirmation that your message arrived safely, a real reply from me follows, usually within one working day (Kuwait time, GMT+3)."),

    section("What you sent"),
    kv([
      ["Service", d.service_label],
      ["Budget", d.budget || "Not specified"],
      ["Your email", d.email],
    ]),
    p(
      `<span style="color:#8a8a8a;">Your brief:</span><br>${esc(d.reason).replace(/\n/g, "<br>")}`,
      { html: true }
    ),

    section("What happens next"),
    step("01", "I read the brief properly", "Not a template reply. I go through what you sent and work out whether I'm genuinely the right person for it."),
    step("02", "You get an honest answer", "A direct response with my read on the project, a ballpark on scope and cost, and any questions I need answered."),
    step("03", "We scope it together", "If it's a fit, you get a written proposal with fixed deliverables and pricing, no open-ended hourly surprises."),

    p("If it's urgent, WhatsApp is the fastest line to me."),
    button("Message me on WhatsApp", waLink(`Hi Amr, I just sent an inquiry about ${d.service_label}.`)),
    linkRow("Or see the work:", SITE.url),
  ].join("");

  return pack(
    `Your inquiry landed, ${SITE.brand}`,
    emailShell({
      preheader: `Thanks ${firstName(d.name)}, I've got your ${d.service_label} inquiry and will reply within a working day.`,
      badge: "Inquiry Received",
      body,
      footerNote: "You're getting this because you submitted the contact form on amrstudio. No list, no newsletter, just this confirmation.",
    })
  );
}

/* ───────────────────────── 2. Inquiry notification ─────────────────────────
   Auto-sent to Amr so the lead is readable on a phone. */

export function inquiryNotificationEmail(d: InquiryData): Email {
  const body = [
    h1("New inquiry"),
    sub(`${d.name} · ${d.service_label}${d.budget ? ` · ${d.budget}` : ""}`),
    kv([
      ["Name", d.name],
      ["Email", d.email],
      ["Service", d.service_label],
      ["Budget", d.budget || "Not specified"],
      ["Received", new Date().toLocaleString("en-GB", { timeZone: "Asia/Kuwait", dateStyle: "medium", timeStyle: "short" }) + " (Kuwait)"],
    ]),
    section("Their brief"),
    p(esc(d.reason).replace(/\n/g, "<br>"), { html: true }),
    button("Reply by email", `mailto:${d.email}?subject=${encodeURIComponent(`Re: your ${d.service_label} inquiry`)}`),
    p("Reply directly to this email and it goes straight to them, the reply-to is already set."),
  ].join("");

  return pack(
    `New inquiry, ${d.name} · ${d.service_label}${d.budget ? ` (${d.budget})` : ""}`,
    emailShell({
      preheader: `${d.name}: ${d.reason.slice(0, 110)}`,
      badge: "Lead",
      body,
    })
  );
}

/* ───────────────────────── 3. Cold outreach pitch ─────────────────────────
   Marketing: first-touch to a studio/founder you want to work with. */

export type PitchData = {
  company?: string;
  /** Opening phrase before the company name, e.g. "An outside read on".
      Editable so the whole pitch re-niches without a code change. */
  hook: string;
  /** The specific thing you noticed, what makes this not a mass mail. */
  observation: string;
  /** What you'd do about it. */
  angle: string;
  /** "What I do" bullets. Owned by the sender, so moving from studio work to
      consultancy (or any niche) is just editing these, never the template. */
  offer: string[];
  /** "Recent work" / proof bullets. */
  proof: string[];
  /** Optional reference link to drop. */
  proofUrl?: string;
};

export function coldPitchEmail(d: PitchData): Email {
  const who = (d.company || "").trim() || "you";
  const hook = (d.hook || "").trim() || "An outside read on";
  const opener = `${hook} ${who}`;
  const body = [
    h1(`${opener}.`),
    sub(`${SITE.role} · ${SITE.city}`),
    p(d.observation),
    p(d.angle),

    ...(d.offer.length ? [section("What I do"), bullets(d.offer)] : []),
    ...(d.proof.length ? [section("Recent work"), bullets(d.proof)] : []),

    p("If this is worth ten minutes, reply to this email or message me directly. No pitch deck, just a conversation about whether it's a fit."),
    button("Start a conversation", waLink(`Hi Amr, saw your note about ${who}.`)),
    linkRow(d.proofUrl ? "Relevant work:" : "The portfolio:", d.proofUrl || SITE.url),
  ].join("");

  return pack(
    opener,
    emailShell({
      preheader: d.observation.slice(0, 120),
      badge: "Introduction",
      body,
      footerNote: "Sent once by a person, not a list. Reply 'no thanks' and you'll never hear from me again.",
    })
  );
}

/* ───────────────────────── 4. Follow-up nudge ─────────────────────────
   Marketing: the second touch, after silence. */

export type FollowUpData = {
  company?: string;
  /** What the last conversation was about. */
  topic: string;
  /** Optional sweetener / new reason to reply. */
  newAngle?: string;
};

export function followUpEmail(d: FollowUpData): Email {
  const body = [
    h1(`Still worth a conversation${d.company ? `, ${d.company}` : ""}?`),
    sub(`Following up on ${d.topic}`),
    p(`I reached out a little while ago about ${d.topic}${d.company ? ` for ${d.company}` : ""} and never heard back. That usually means one of three things.`),

    bullets([
      "The timing is wrong. Tell me when to come back and I will.",
      "It's not a priority right now. Fair enough, I'll stop here.",
      "It got buried. It happens; this is the nudge.",
    ]),

    ...(d.newAngle ? [section("One more thing"), p(d.newAngle)] : []),

    p("A one-line reply is genuinely enough. If the answer is no, that's useful too. I'd rather know than keep guessing."),
    button("Reply in one line", waLink(`Hi Amr, about ${d.topic}`)),
  ].join("");

  return pack(
    `Following up on ${d.topic}`,
    emailShell({
      preheader: `A short follow-up about ${d.topic}. One line is enough.`,
      badge: "Follow Up",
      body,
      footerNote: "This is the last follow-up. I won't chase a third time.",
    })
  );
}

/* ───────────────────────── 5. Launch / announcement ─────────────────────────
   Marketing: tell past clients and contacts something shipped. */

export type LaunchData = {
  /** Their company, keeps each send distinct rather than one identical blast. */
  company?: string;
  projectName: string;
  projectUrl: string;
  /** One paragraph on what it is and why it matters. */
  story: string;
  /** Optional offer / availability line. */
  availability?: string;
};

export function launchEmail(d: LaunchData): Email {
  const body = [
    h1(`${d.projectName} is live.`),
    sub(`New from ${SITE.brand} · ${SITE.city}`),
    p(`${d.company ? `Hi ${d.company},` : "Hi,"}`),
    p(d.story),
    button("See it live", d.projectUrl),
    linkRow("Direct link:", d.projectUrl),

    section("What went into it"),
    bullets([
      "Motion choreographed end to end, every transition earns its place.",
      "Tuned to 60fps on a five-year-old laptop; frame rate treated as a feature.",
      "Production-grade from the first commit, not a prototype dressed up.",
    ]),

    ...(d.availability
      ? [section("Availability"), panel("Taking on new work.", d.availability)]
      : []),

    p("If someone in your circle needs this kind of build, forwarding this email is the whole referral."),
  ].join("");

  return pack(
    `${d.projectName} is live`,
    emailShell({
      preheader: d.story.slice(0, 120),
      badge: "Launch",
      body,
      footerNote: "You're getting this because we've worked together or spoken about a project.",
    })
  );
}

/* ───────────────────────── 6. Proposal delivery ─────────────────────────
   Sent by the proposal generator, with the PDF attached. */

export type ProposalEmailData = {
  clientName: string;
  companyName?: string;
  projectTitle: string;
  investment: string;
  validUntil: string;
  ref: string;
  /** Headline deliverables to preview in the email body. */
  highlights: string[];
};

export function proposalEmail(d: ProposalEmailData): Email {
  const body = [
    h1(`Your proposal, ${firstName(d.clientName)}.`),
    sub(`${d.projectTitle} · Ref ${d.ref} · Valid until ${d.validUntil}`),
    p(`Attached is the full written proposal for ${d.companyName || "your project"}, fixed scope, fixed price, no hourly surprises. The short version is below.`),

    section("The engagement"),
    hero(d.investment, "Total project investment · fixed price"),
    kv([
      ["Project", d.projectTitle],
      ["Valid until", d.validUntil],
      ["Reference", d.ref],
    ]),

    section("What's included"),
    bullets(d.highlights),

    section("To move forward"),
    step("01", "Read the attached PDF", "Full scope, deliverables, timeline, and terms, everything in writing."),
    step("02", "Send questions or changes", "Scope adjustments are normal at this stage. Tell me what to change."),
    step("03", "Approve and we start", "On approval you get the service agreement and the upfront invoice; development is scheduled the moment it clears."),

    panel("Note on validity.", `This pricing holds until ${d.validUntil}. After that the scope stays valid but the numbers may need a second look.`),

    button("Discuss the proposal", waLink(`Hi Amr, about proposal ${d.ref}`)),
  ].join("");

  return pack(
    `Proposal, ${d.projectTitle} (${d.ref})`,
    emailShell({
      preheader: `${d.projectTitle} · ${d.investment} · valid until ${d.validUntil}`,
      badge: "Proposal",
      body,
      footerNote: `Proposal ${d.ref}, prepared for ${d.companyName || d.clientName}.`,
    })
  );
}

/* ───────────────────────── 7. Invoice delivery ─────────────────────────
   Sent by the invoice generator, with the PDF attached. */

export type InvoiceEmailData = {
  clientName: string;
  companyName?: string;
  invoiceNo: string;
  amount: string;
  dueDate: string;
  kindLabel: string;
  contractRef?: string;
  lines: string[];
  paymentDetails?: string;
};

export function invoiceEmail(d: InvoiceEmailData): Email {
  const body = [
    h1(`Invoice ${d.invoiceNo}`),
    sub(`${d.kindLabel} · Due ${d.dueDate}${d.contractRef ? ` · Against contract ${d.contractRef}` : ""}`),
    p(`${firstName(d.clientName)}, the invoice for ${d.companyName || "your project"} is attached as a PDF. The summary is below.`),

    section("Amount due"),
    hero(d.amount, `Payable by ${d.dueDate}`),

    section("What this covers"),
    bullets(d.lines),

    ...(d.paymentDetails ? [section("How to pay"), panel("Payment details.", d.paymentDetails)] : []),

    panel("Scheduling.", "Work against this invoice is scheduled as soon as payment clears. If anything on it looks wrong, reply and I'll reissue it, no awkwardness."),

    button("Ask about this invoice", waLink(`Hi Amr, about invoice ${d.invoiceNo}`)),
  ].join("");

  return pack(
    `Invoice ${d.invoiceNo}, ${d.amount} due ${d.dueDate}`,
    emailShell({
      preheader: `${d.kindLabel} · ${d.amount} · due ${d.dueDate}`,
      badge: "Invoice",
      body,
      footerNote: `Invoice ${d.invoiceNo} for ${d.companyName || d.clientName}. Amr Hassan, independent developer, not a licensed company.`,
    })
  );
}

/* ── registry used by the admin outreach console ── */
export const MARKETING_TEMPLATES = {
  pitch: { label: "Cold outreach", build: coldPitchEmail },
  followup: { label: "Follow up", build: followUpEmail },
  launch: { label: "Launch announcement", build: launchEmail },
} as const;

export type MarketingTemplateId = keyof typeof MARKETING_TEMPLATES;
