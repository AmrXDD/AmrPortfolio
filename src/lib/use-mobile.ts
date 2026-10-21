"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

const PHONE = "(max-width: 767px)";

/*
 * The server's guess (from the request's user agent) of whether this is a
 * phone. It seeds useIsMobile, so a phone renders the phone variant of each
 * section from the first paint instead of hydrating the desktop one and then
 * swapping (the desktop metro map, projection room and gallery are ~1,600vh
 * of DOM and layout work). The media query still corrects it after mount.
 */
const MobileHint = createContext(false);

export function MobileHintProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return createElement(MobileHint.Provider, { value }, children);
}

export function useIsMobile(query = PHONE) {
  const hint = useContext(MobileHint);
  // a phone matches every "narrower than" breakpoint (767 and 1023 alike)
  const [mobile, setMobile] = useState(hint && query.includes("max-width"));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return mobile;
}
