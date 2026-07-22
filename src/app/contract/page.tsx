import type { Metadata } from "next";
import { ContractTool } from "./contract-tool";

export const metadata: Metadata = {
  title: "Contract Generator",
  robots: { index: false, follow: false },
};

/*
 * Internal tool: generates the service agreement plus the Welcome letter and
 * What's Next guide from one set of details. Lives outside the (site) route
 * group so the marketing chrome (preloader, dock, cursor) stays away, while
 * the site's fonts, colors, and logo carry through.
 */
export default function ContractPage() {
  return <ContractTool />;
}
