"use client";

import { useEffect, useRef } from "react";

/**
 * Faithful React port of the Deus Ex: Mankind Divided loading animation
 * by jeremywynn (https://codepen.io/jeremywynn/pen/mjzwPw)
 *
 * 20 tessellated triangles arranged in a large triangle, with staggered
 * fill-reveal animations across two offset layers, all continuously rotating.
 */

// ─── Triangle geometry data ─────────────────────────────────────────────────

type TriData = { d: string; ox: number; oy: number; idx: number };

const TRIS: TriData[] = [
  { d: "M22.5 180.1l-22.5 45h45z",         ox: 22.5,   oy: 209.1, idx: 0 },
  { d: "M67.6 180.1l-22.5 45h45z",         ox: 67.6,   oy: 209.1, idx: 1 },
  { d: "M45.07 225.099l-22.5-45h45z",      ox: 45.07,  oy: 199.1, idx: 2 },
  { d: "M90.07 225.099l-22.5-45h45z",      ox: 90.7,   oy: 199.1, idx: 3 },
  { d: "M112.6 180.1l-22.5 45h45z",        ox: 112.6,  oy: 209.1, idx: 4 },
  { d: "M135.07 225.099l-22.5-45h45z",     ox: 135.07, oy: 199.1, idx: 5 },
  { d: "M45.07 135.1l22.5 45h-45z",        ox: 45.07,  oy: 165.1, idx: 6 },
  { d: "M157.6 180.1l-22.5 45h45z",        ox: 157.6,  oy: 209.1, idx: 7 },
  { d: "M180.07 225.099l-22.5-45h45z",     ox: 180.07, oy: 199.1, idx: 8 },
  { d: "M202.6 180.1l-22.5 45h45z",        ox: 202.6,  oy: 209.1, idx: 9 },
  { d: "M67.6 180.099l22.5-45h-45z",       ox: 67.6,   oy: 155.1, idx: 10 },
  { d: "M180.07 135.1l22.5 45h-45z",       ox: 180.07, oy: 165.1, idx: 11 },
  { d: "M67.6 90.1l22.5 45h-45z",          ox: 67.6,   oy: 122.1, idx: 12 },
  { d: "M157.6 180.099l-22.5-45h45z",      ox: 157.6,  oy: 155.1, idx: 13 },
  { d: "M157.6 90.1l22.5 45h-45z",         ox: 157.6,  oy: 122.1, idx: 14 },
  { d: "M90.07 135.099l22.5-45h-45z",      ox: 90.07,  oy: 108.1, idx: 15 },
  { d: "M135.07 135.099l-22.5-45h45z",     ox: 135.07, oy: 108.1, idx: 15 },
  { d: "M135.07 45l22.5 45h-45z",          ox: 135.07, oy: 76.1,  idx: 16 },
  { d: "M90.07 45l22.5 45h-45z",           ox: 90.07,  oy: 76.1,  idx: 17 },
  { d: "M135.07 45h-45l22.5 45z",          ox: 112.6,  oy: 62.1,  idx: 18 },
  { d: "M112.6.1l22.5 45h-45z",            ox: 112.6,  oy: 30.1,  idx: 19 },
];

// ─── Animation constants (from original) ───────────────────────────────────

const DURATION = (92 / 30) * 1000;         // ~3067ms per cycle
const DURATION_ROTATE = (288 / 30) * 1000; // ~9600ms full rotation
const INSET_DELAY = 0.50;                  // iterationStart offset for layer 1
const OFFSET = 12 / 96;                    // 0.125 — opacity reveal offset
const OFFSET_SCALE = 30 / 96;              // 0.3125 — fill scale offset
const FRAC = 0.5;                          // duration fraction for stagger

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  color?: string;
  size?: number;
};

export default function DXMDLoader({ color = "#EDA622", size = 120 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const animations: Animation[] = [];

    // Container rotation
    animations.push(
      el.animate([{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], {
        duration: DURATION_ROTATE,
        iterations: Infinity,
      })
    );

    // Both SVG layers scale inward
    for (const suffix of ["a", "b"]) {
      const svg = el.querySelector(`[data-layer="${suffix}"]`) as SVGElement | null;
      if (!svg) continue;
      animations.push(
        svg.animate(
          [{ transform: "scale(1)" }, { transform: "scale(0.4)" }, { transform: "scale(0.16)" }],
          {
            duration: DURATION,
            iterations: Infinity,
            iterationStart: suffix === "a" ? INSET_DELAY : 0,
          }
        )
      );
    }

    // Per-triangle animations
    for (const suffix of ["a", "b"]) {
      const isA = suffix === "a";
      const layer = el.querySelector(`[data-layer="${suffix}"]`);
      if (!layer) continue;

      TRIS.forEach((tri, i) => {
        const triEl = layer.querySelector(`[data-tri="${i}"]`) as SVGPathElement | null;
        const fillEl = layer.querySelector(`[data-fill="${i}"]`) as SVGPathElement | null;
        if (!triEl || !fillEl) return;

        const idx = tri.idx;
        const stagger = (idx / 19) * FRAC;

        // Triangle opacity reveal
        const opacityKeyframes =
          idx === 0
            ? [{ opacity: "0" }, { opacity: "1", offset: OFFSET }, { opacity: "1" }]
            : [
                { opacity: "0" },
                { opacity: "0", offset: stagger },
                { opacity: "1", offset: Math.min(OFFSET + stagger, 0.99) },
                { opacity: "1" },
              ];

        animations.push(
          triEl.animate(opacityKeyframes, {
            duration: DURATION,
            iterations: Infinity,
            iterationStart: isA ? INSET_DELAY : 0,
          })
        );

        // Fill scale reveal
        const scaleKeyframes =
          idx === 0
            ? [
                { transform: "scale(1)" },
                { transform: "scale(0)", offset: OFFSET_SCALE },
                { transform: "scale(0)" },
              ]
            : [
                { transform: "scale(1)" },
                { transform: "scale(1)", offset: stagger },
                { transform: "scale(0)", offset: Math.min(OFFSET_SCALE + stagger, 0.99) },
                { transform: "scale(0)" },
              ];

        animations.push(
          fillEl.animate(scaleKeyframes, {
            duration: DURATION,
            iterations: Infinity,
            iterationStart: isA ? INSET_DELAY : 0,
          })
        );
      });
    }

    return () => animations.forEach((a) => a.cancel());
  }, []);

  const svgProps = {
    viewBox: "0 0 226 226",
    xmlns: "http://www.w3.org/2000/svg",
    fillRule: "evenodd" as const,
    clipRule: "evenodd" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeMiterlimit: 1.5,
  };

  function renderLayer(suffix: string) {
    return (
      <svg
        {...svgProps}
        data-layer={suffix}
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: "50% 66.66%",
          ...(suffix === "a" ? { position: "absolute" as const, left: 0, top: 0 } : {}),
          display: "block",
        }}
      >
        {TRIS.map((tri, i) => (
          <g key={`${suffix}-${i}`}>
            <path
              data-tri={i}
              d={tri.d}
              fill={color}
              stroke={color}
              strokeWidth="0.5"
              opacity="0"
            />
            <path
              data-fill={i}
              d={tri.d}
              fill="black"
              stroke="black"
              strokeWidth="0.5"
              style={{ transformOrigin: `${tri.ox}px ${tri.oy}px` }}
            />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        position: "relative",
        transformOrigin: "50% 66.66%",
        clipPath:
          "polygon(0% 0%, 0% 100%, 42.3% 100%, 42.3% 71.8%, 49.85% 56.2%, 57.7% 71.8%, 30.6% 71.8%, 27% 100%, 100% 100%, 100% 0%)",
      }}
    >
      {renderLayer("b")}
      {renderLayer("a")}
    </div>
  );
}
