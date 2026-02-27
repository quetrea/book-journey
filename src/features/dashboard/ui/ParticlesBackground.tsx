"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
};

const MIN_PARTICLES = 50;
const MAX_PARTICLES = 80;
const LINK_DISTANCE = 110;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function makeParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    radius: Math.random() * 1.6 + 0.4,
    alpha: Math.random() * 0.32 + 0.08,
  };
}

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let reducedMotion = reducedMotionQuery.matches;
    let particles: Particle[] = [];
    let frameId = 0;
    let resizeTimeout: number | undefined;

    const rebuildCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const total = clamp(
        Math.round((width * height) / 24000),
        MIN_PARTICLES,
        MAX_PARTICLES,
      );
      particles = Array.from({ length: total }, () => makeParticle(width, height));
    };

    const drawParticles = () => {
      context.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];

        if (!reducedMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x <= 0 || particle.x >= width) {
            particle.vx *= -1;
          }
          if (particle.y <= 0 || particle.y >= height) {
            particle.vy *= -1;
          }
        }

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(129, 146, 255, ${particle.alpha})`;
        context.fill();
      }

      for (let i = 0; i < particles.length; i += 1) {
        const source = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const target = particles[j];
          const dx = source.x - target.x;
          const dy = source.y - target.y;
          const distance = Math.hypot(dx, dy);

          if (distance < LINK_DISTANCE) {
            const opacity = (1 - distance / LINK_DISTANCE) * 0.12;
            context.beginPath();
            context.moveTo(source.x, source.y);
            context.lineTo(target.x, target.y);
            context.strokeStyle = `rgba(129, 146, 255, ${opacity})`;
            context.lineWidth = 0.6;
            context.stroke();
          }
        }
      }
    };

    const loop = () => {
      drawParticles();
      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(loop);
      }
    };

    const restart = () => {
      window.cancelAnimationFrame(frameId);
      drawParticles();
      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(loop);
      }
    };

    const onResize = () => {
      if (resizeTimeout !== undefined) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        rebuildCanvas();
        restart();
      }, 140);
    };

    const onReducedMotionChange = (
      event: MediaQueryListEvent | MediaQueryList,
    ) => {
      reducedMotion = event.matches;
      restart();
    };

    rebuildCanvas();
    restart();

    window.addEventListener("resize", onResize);
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
      if (resizeTimeout !== undefined) {
        window.clearTimeout(resizeTimeout);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 opacity-75 dark:opacity-90"
    />
  );
}
