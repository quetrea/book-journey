"use client";

import { useEffect, useRef } from "react";

export function MouseSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf: number;

    const onMove = ({ clientX: x, clientY: y }: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x - 350}px, ${y - 350}px)`;
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[1] size-[700px] rounded-full will-change-transform"
      style={{
        background:
          "radial-gradient(circle, rgba(88,101,242,0.13) 0%, rgba(88,101,242,0.05) 50%, transparent 70%)",
      }}
    />
  );
}
