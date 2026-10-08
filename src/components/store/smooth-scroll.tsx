"use client";

import { useSyncExternalStore } from "react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Global Lenis smooth scroll; native scrolling when the user prefers reduced motion. Server assumes motion is allowed so hydration matches. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  if (reduce) return children;
  return (
    <ReactLenis root options={{ lerp: 0.12, anchors: true, autoRaf: true }}>
      {children}
    </ReactLenis>
  );
}
