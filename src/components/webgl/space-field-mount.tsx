"use client";

import dynamic from "next/dynamic";

// ssr:false is only allowed inside a Client Component
const SpaceField = dynamic(() => import("./space-field"), { ssr: false });

export function SpaceFieldMount() {
  if (process.env.NEXT_PUBLIC_NO_WEBGL) return null;
  return <SpaceField />;
}
