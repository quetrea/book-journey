"use client";

import { useEffect, useRef } from "react";

const N = 55;
const CONNECT_DIST = 130;
const REPEL_R = 140;
const REPEL_F = 1.0;
const BASE_SPD = 0.32;

type Pt = { x: number; y: number; vx: number; vy: number };

function hexRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  if (c.length !== 6) return [99, 102, 241];
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return [
    Number.isNaN(r) ? 99 : r,
    Number.isNaN(g) ? 102 : g,
    Number.isNaN(b) ? 241 : b,
  ];
}

export function ParticleCanvas({
  color,
  isDark,
}: {
  color: string;
  isDark: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const [r, g, b] = hexRgb(color);
    const dotA = isDark ? 0.55 : 0.22;
    const lineA = isDark ? 0.20 : 0.10;

    const pts: Pt[] = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * BASE_SPD * 2,
      vy: (Math.random() - 0.5) * BASE_SPD * 2,
    }));

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    let raf: number;

    function frame() {
      ctx!.clearRect(0, 0, W, H);
      const { x: mx, y: my } = mouseRef.current;

      for (const p of pts) {
        // Repel from mouse
        const dx = p.x - mx;
        const dy = p.y - my;
        const d = Math.hypot(dx, dy);
        if (d < REPEL_R && d > 0.5) {
          const f = ((REPEL_R - d) / REPEL_R) * REPEL_F;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }

        // Dampen
        p.vx *= 0.965;
        p.vy *= 0.965;

        // Clamp max speed
        const spd = Math.hypot(p.vx, p.vy);
        const maxSpd = BASE_SPD * 5;
        if (spd > maxSpd) {
          p.vx = (p.vx / spd) * maxSpd;
          p.vy = (p.vy / spd) * maxSpd;
        }

        // Keep minimum drift so particles always drift
        if (spd < 0.08) {
          p.vx += (Math.random() - 0.5) * 0.15;
          p.vy += (Math.random() - 0.5) * 0.15;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        else if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        else if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }

        // Draw node dot with glow
        const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, 3.5);
        gradient.addColorStop(0, `rgba(${r},${g},${b},${dotA})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();
      }

      // Draw connections
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        for (let j = i + 1; j < pts.length; j++) {
          const bp = pts[j]!;
          const dist = Math.hypot(a.x - bp.x, a.y - bp.y);
          if (dist < CONNECT_DIST) {
            const alpha = lineA * (1 - dist / CONNECT_DIST);
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(bp.x, bp.y);
            ctx!.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx!.lineWidth = 0.7;
            ctx!.stroke();
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, [color, isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
