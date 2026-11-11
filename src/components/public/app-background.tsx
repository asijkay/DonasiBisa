"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * App-wide animated gradient. Three soft blobs sit in a fixed layer behind every page; their position follows
 * the scroll progress (--p: 0 at top → 1 at bottom), so the gradient "moves forward" as you scroll.
 * Reduced-motion users get the static layout. The layer is decorative (aria-hidden, no pointer events).
 */
export function AppBackground() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--p", "0");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty("--p", p.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Page height changes after navigation/images load: re-measure shortly after.
    const t = setTimeout(update, 400);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      clearTimeout(t);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <div className="app-bg" aria-hidden="true">
      <span className="b1" />
      <span className="b2" />
      <span className="b3" />
    </div>
  );
}
