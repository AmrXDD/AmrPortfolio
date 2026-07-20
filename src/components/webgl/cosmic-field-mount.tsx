"use client";

import dynamic from "next/dynamic";

// ssr:false is only allowed inside a Client Component
const CosmicField = dynamic(() => import("./cosmic-field"), { ssr: false });

export function CosmicFieldMount() {
  if (process.env.NEXT_PUBLIC_NO_WEBGL) return null;
  return <CosmicField />;
}
