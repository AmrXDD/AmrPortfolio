import "server-only";

/*
 * Single source of truth for every address the site sends from or replies to.
 * Previously each route carried its own `onboarding@resend.dev` fallback, so
 * changing a sender meant editing three files.
 *
 * The amrstudio.dev domain is verified in Resend, so these work as real
 * defaults — env vars stay supported purely as per-environment overrides
 * (e.g. pointing staging at a throwaway inbox).
 */

/** Where inquiries land, and the reply-to on everything we send out. */
export const INBOX = process.env.CONTACT_TO_EMAIL || "info@amrstudio.dev";

/** Default sender: inquiry confirmations, lead notifications, outreach. */
export const FROM_DEFAULT =
  process.env.RESEND_FROM_EMAIL || "Amr Studio <info@amrstudio.dev>";

/** Proposals go out on their own address so client threads stay separable. */
export const FROM_PROPOSALS =
  process.env.RESEND_PROPOSALS_FROM_EMAIL || "Amr Studio <proposals@amrstudio.dev>";
