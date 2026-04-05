"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import DXMDLoader from "@/components/DXMDLoader";

type Props = { username: string; onComplete: () => void };

// ─── Text scramble hook ─────────────────────────────────────────────────────

const CIPHER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function useScramble(target: string, delay: number, duration: number) {
  const [text, setText] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(t1);
  }, [delay]);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    const start = performance.now();
    const perChar = duration / target.length;

    function tick() {
      const elapsed = performance.now() - start;
      let out = "";
      let done = true;
      for (let i = 0; i < target.length; i++) {
        if (target[i] === " ") { out += " "; continue; }
        const t = i * perChar;
        if (elapsed > t + perChar * 2.5) {
          out += target[i];
        } else if (elapsed > t) {
          if (Math.random() < (elapsed - t) / (perChar * 3)) out += target[i];
          else { out += CIPHER[Math.floor(Math.random() * CIPHER.length)]; done = false; }
        } else {
          out += CIPHER[Math.floor(Math.random() * CIPHER.length)];
          done = false;
        }
      }
      setText(out);
      if (!done) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return active ? text : "";
}

// DXMDLogo is now imported from DXMDLoader.tsx

// ─── Horizontal rule ────────────────────────────────────────────────────────

function HRule({ color, delay, width = 140 }: { color: string; delay: number; width?: number }) {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width, opacity: 0.3 }}
        transition={{ delay, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color})` }}
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ delay: delay + 0.3, duration: 0.4, ease: "easeOut" }}
        style={{ width: 5, height: 5, background: color, transform: "rotate(45deg)", flexShrink: 0 }}
      />
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width, opacity: 0.3 }}
        transition={{ delay, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: 1, background: `linear-gradient(270deg, transparent, ${color})` }}
      />
    </div>
  );
}

// ─── Corner brackets ────────────────────────────────────────────────────────

function CornerBrackets({ color }: { color: string }) {
  const style = { position: "absolute" as const, width: 24, height: 24, borderColor: color, opacity: 0.2 };
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
        style={{ ...style, top: 24, left: 24, borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }}
        style={{ ...style, top: 24, right: 24, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 1 }}
        style={{ ...style, bottom: 24, left: 24, borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}
        style={{ ...style, bottom: 24, right: 24, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
    </>
  );
}

// ─── Scan line ──────────────────────────────────────────────────────────────

function ScanLine({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none"
      initial={{ top: "-2px", opacity: 0 }}
      animate={{ top: "100%", opacity: [0, 0.12, 0.12, 0] }}
      transition={{ duration: 4, ease: "linear", repeat: Infinity, repeatDelay: 1 }}
      style={{ height: 1, background: `linear-gradient(90deg, transparent 5%, ${color} 30%, ${color} 70%, transparent 95%)` }}
    />
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function IntroOverlay({ username, onComplete }: Props) {
  const { themeId } = useTheme();
  const isWh40k = themeId === "wh40k";
  const [show, setShow] = useState(true);

  const gold = "#EDA622";
  const imperialGold = "#C8AA50";
  const accent = isWh40k ? imperialGold : gold;

  // Text colors: white for default, parchment for WH40K
  const textPrimary = isWh40k ? "#D2C3A5" : "#ffffff";
  const textSecondary = isWh40k ? "rgba(210,195,165,0.6)" : "rgba(255,255,255,0.55)";
  const textTertiary = isWh40k ? "rgba(200,170,80,0.28)" : "rgba(255,255,255,0.25)";

  const title = isWh40k ? "COGITATOR TERMINUS" : "N E X U S";
  const sub = isWh40k
    ? `Operative ${username} — Identity Confirmed`
    : `IDENTITY VERIFIED  //  ${username.toUpperCase()}`;
  const tagline = isWh40k
    ? "An open mind is like a fortress with its gates unbarred"
    : "SECURE COMMUNICATIONS PROTOCOL";

  const scrambledTitle = useScramble(title, 1600, 1400);
  const scrambledSub = useScramble(sub, 3200, 900);

  const dismiss = useCallback(() => {
    setShow(false);
    setTimeout(onComplete, 800);
  }, [onComplete]);

  useEffect(() => {
    const t = setTimeout(dismiss, 7500);
    return () => clearTimeout(t);
  }, [dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ background: isWh40k ? "#0A0806" : "#141514", cursor: "default" }}
          onClick={dismiss}
        >
          {/* Noise grain */}
          <div className="absolute inset-0 pointer-events-none" style={{
            opacity: 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }} />

          {/* WH40K parchment grain overlay — no CRT scanlines */}
          {isWh40k && (
            <div className="absolute inset-0 pointer-events-none" style={{
              opacity: 0.022,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "220px",
            }} />
          )}

          {/* Scan line */}
          <ScanLine color={accent} />

          {/* Corner brackets */}
          <CornerBrackets color={accent} />

          {/* Vignette — warm dark for WH40K */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: isWh40k
              ? "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 20%, rgba(4,2,1,0.88) 100%)"
              : "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 20%, rgba(0,0,0,0.9) 100%)",
          }} />

          {/* ── Centered content ── */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-8">

            {/* DXMD loading triangle */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <DXMDLoader color={accent} size={140} />
            </motion.div>

            {/* Upper rule */}
            <HRule color={accent} delay={1.2} />

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              style={{
                fontFamily: isWh40k ? "'Cinzel', serif" : "'Orbitron', monospace",
                fontSize: isWh40k ? "36px" : "clamp(28px, 6vw, 52px)",
                fontWeight: 700,
                color: textPrimary,
                letterSpacing: isWh40k ? "0.22em" : "0.35em",
                textShadow: `0 0 40px ${accent}44`,
                lineHeight: 1.1,
                minHeight: "1.2em",
              }}
            >
              {scrambledTitle || "\u00A0"}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.0, duration: 0.8 }}
              style={{
                marginTop: "14px",
                fontFamily: isWh40k ? "'Cinzel', serif" : "'Orbitron', monospace",
                fontSize: isWh40k ? "13px" : "clamp(9px, 1.4vw, 12px)",
                fontWeight: 400,
                color: textSecondary,
                letterSpacing: isWh40k ? "0.08em" : "0.28em",
                minHeight: "1.4em",
              }}
            >
              {scrambledSub || "\u00A0"}
            </motion.p>

            {/* Lower rule */}
            <HRule color={accent} delay={3.6} width={90} />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.2, duration: 1.5 }}
              style={{
                fontFamily: isWh40k ? "'Cinzel', serif" : "Inter, sans-serif",
                fontSize: isWh40k ? "10px" : "8px",
                fontWeight: 300,
                color: textTertiary,
                letterSpacing: isWh40k ? "0.18em" : "0.3em",
                textTransform: "uppercase",
              }}
            >
              {tagline}
            </motion.p>

            {/* Skip */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ delay: 3.5, duration: 1 }}
              style={{
                marginTop: "48px",
                fontFamily: isWh40k ? "'Cinzel', serif" : "Inter, sans-serif",
                fontSize: isWh40k ? "10px" : "8px",
                color: textSecondary,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {isWh40k ? "Click to continue" : "CLICK ANYWHERE TO SKIP"}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
