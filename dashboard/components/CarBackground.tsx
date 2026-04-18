"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ══════════════════════════════════════════
   CAR BACKGROUND — sleek side-view silhouette
   Appears in architecture → stack scroll zone
══════════════════════════════════════════ */
export function CarBackground() {
  const [opacity, setOpacity] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let archEl: HTMLElement | null = null;
    let stackEl: HTMLElement | null = null;

    const updateOpacity = () => {
      archEl = document.getElementById("architecture");
      stackEl = document.getElementById("stack");

      if (!archEl || !stackEl) return;

      const scrollPos = window.scrollY;
      const archTop = archEl.offsetTop;
      const archBottom = archEl.offsetTop + archEl.offsetHeight;
      const stackTop = stackEl.offsetTop;
      const stackBottom = stackEl.offsetTop + stackEl.offsetHeight;

      // Start fade-in at architecture section
      const archStart = archTop - window.innerHeight * 0.3;
      const archEnd = archBottom + window.innerHeight * 0.2;
      const stackStart = stackTop - window.innerHeight * 0.2;
      const stackEnd = stackBottom + window.innerHeight * 0.3;

      let newOpacity = 0;

      // Fade in during architecture section
      if (scrollPos >= archStart && scrollPos <= archEnd) {
        newOpacity = Math.max(0, Math.min(1, (scrollPos - archStart) / (archEnd - archStart) * 0.85));
      }
      // Hold opacity during transition zone
      else if (scrollPos > archEnd && scrollPos < stackStart) {
        newOpacity = 0.85;
      }
      // Fade out during stack section
      else if (scrollPos >= stackStart && scrollPos <= stackEnd) {
        newOpacity = Math.max(0, 0.85 - (scrollPos - stackStart) / (stackEnd - stackStart) * 0.85);
      }

      setOpacity(newOpacity);

      // Subtle parallax effect
      const parallaxOffset = (scrollPos % 100) * 0.05;
      setPosition({ x: parallaxOffset, y: parallaxOffset * 0.3 });
    };

    window.addEventListener("scroll", updateOpacity, { passive: true });
    updateOpacity();

    return () => window.removeEventListener("scroll", updateOpacity);
  }, []);

  return (
    <motion.div
      className="lp-car-background"
      style={{
        opacity,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1200 400"
        className="lp-car-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glossy metal gradient */}
          <linearGradient id="carGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(60,60,70,0.8)" />
            <stop offset="20%" stopColor="rgba(40,40,50,0.9)" />
            <stop offset="50%" stopColor="rgba(20,20,28,1)" />
            <stop offset="80%" stopColor="rgba(30,30,38,0.95)" />
            <stop offset="100%" stopColor="rgba(50,50,60,0.85)" />
          </linearGradient>

          {/* Rim gradient */}
          <radialGradient id="rimGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(100,100,110,0.8)" />
            <stop offset="50%" stopColor="rgba(40,40,50,0.6)" />
            <stop offset="100%" stopColor="rgba(20,20,25,0.9)" />
          </radialGradient>

          {/* Window reflection */}
          <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(80,100,120,0.3)" />
            <stop offset="50%" stopColor="rgba(40,60,80,0.1)" />
            <stop offset="100%" stopColor="rgba(20,30,40,0.05)" />
          </linearGradient>

          {/* Accent glow */}
          <filter id="accentGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Light rays */}
          <filter id="highlight">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* Main car body (side profile) */}
        <g className="lp-car-body">
          {/* Undercarriage shadow */}
          <ellipse cx="600" cy="340" rx="520" ry="35" fill="rgba(0,0,0,0.15)" />

          {/* Main body silhouette - dramatic profile */}
          <path
            d="M 200 280 L 280 200 L 320 185 L 450 170 L 550 165 L 700 160 L 800 155 L 950 165 L 1000 180 L 1050 210 L 1060 250 L 1065 290 Q 1060 310 1050 320 L 200 320 Z"
            fill="url(#carGradient)"
            stroke="rgba(212,169,106,0.15)"
            strokeWidth="1.5"
          />

          {/* Hood accent line */}
          <path
            d="M 280 200 Q 400 185 550 170 Q 650 165 750 165"
            stroke="rgba(212,169,106,0.25)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Roof line - elegant curve */}
          <path
            d="M 320 185 Q 500 140 700 135 Q 850 140 950 160"
            stroke="rgba(212,169,106,0.2)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Front windshield reflection */}
          <path
            d="M 850 165 L 950 200 L 920 150 Z"
            fill="url(#windowGradient)"
            opacity="0.6"
          />

          {/* Rear windshield reflection */}
          <path
            d="M 450 170 L 550 210 L 500 150 Z"
            fill="url(#windowGradient)"
            opacity="0.4"
          />

          {/* Side accent line (crease) */}
          <path
            d="M 300 220 Q 600 215 1000 235"
            stroke="rgba(212,169,106,0.18)"
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />

          {/* Front bumper */}
          <rect x="1050" y="290" width="25" height="35" fill="rgba(30,30,35,0.9)" stroke="rgba(212,169,106,0.1)" strokeWidth="1" />

          {/* Rear bumper */}
          <rect x="185" y="290" width="20" height="35" fill="rgba(30,30,35,0.9)" stroke="rgba(212,169,106,0.1)" strokeWidth="1" />
        </g>

        {/* Wheels */}
        <g className="lp-wheels">
          {/* Front wheel */}
          <circle cx="850" cy="330" r="48" fill="url(#rimGradient)" stroke="rgba(20,20,25,0.8)" strokeWidth="2" />
          <circle cx="850" cy="330" r="42" fill="rgba(15,15,20,0.95)" />
          <circle cx="850" cy="330" r="38" fill="none" stroke="rgba(212,169,106,0.12)" strokeWidth="1" />
          <circle cx="850" cy="330" r="28" fill="none" stroke="rgba(212,169,106,0.2)" strokeWidth="0.8" />

          {/* Front wheel spokes */}
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 850 + Math.cos(rad) * 28;
            const y1 = 330 + Math.sin(rad) * 28;
            return (
              <line
                key={angle}
                x1={850}
                y1={330}
                x2={x1}
                y2={y1}
                stroke="rgba(212,169,106,0.15)"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Rear wheel */}
          <circle cx="350" cy="335" r="45" fill="url(#rimGradient)" stroke="rgba(20,20,25,0.8)" strokeWidth="2" />
          <circle cx="350" cy="335" r="40" fill="rgba(15,15,20,0.95)" />
          <circle cx="350" cy="335" r="36" fill="none" stroke="rgba(212,169,106,0.12)" strokeWidth="1" />
          <circle cx="350" cy="335" r="27" fill="none" stroke="rgba(212,169,106,0.15)" strokeWidth="0.8" />

          {/* Rear wheel spokes */}
          {[0, 72, 144, 216, 288].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 350 + Math.cos(rad) * 27;
            const y1 = 335 + Math.sin(rad) * 27;
            return (
              <line
                key={angle}
                x1={350}
                y1={335}
                x2={x1}
                y2={y1}
                stroke="rgba(212,169,106,0.12)"
                strokeWidth="0.7"
              />
            );
          })}
        </g>

        {/* Headlight glow */}
        <ellipse cx="1020" cy="250" rx="35" ry="28" fill="rgba(212,169,106,0.08)" filter="url(#accentGlow)" />
        <ellipse cx="1020" cy="250" rx="20" ry="16" fill="rgba(212,169,106,0.12)" />

        {/* Accent details - front splitter */}
        <rect x="1055" y="310" width="8" height="25" fill="rgba(212,169,106,0.2)" rx="1" />
        <rect x="1065" y="310" width="8" height="25" fill="rgba(212,169,106,0.15)" rx="1" />

        {/* Light highlight on body */}
        <path
          d="M 400 190 Q 600 160 800 155 Q 850 200 900 230"
          stroke="rgba(212,169,106,0.25)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
          filter="url(#highlight)"
        />
      </svg>
    </motion.div>
  );
}
