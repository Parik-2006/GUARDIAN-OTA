"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ══════════════════════════════════════════
   CAR BACKGROUND — sleek side-view silhouette
   Appears when viewing architecture/stack sections
══════════════════════════════════════════ */
export function CarBackground() {
  const [opacity, setOpacity] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      
      // Get section positions
      const archSection = document.getElementById("architecture");
      const stackSection = document.getElementById("stack");

      if (!archSection || !stackSection) {
        setOpacity(0);
        return;
      }

      const archTop = archSection.offsetTop;
      const archHeight = archSection.offsetHeight;
      const stackTop = stackSection.offsetTop;
      const stackHeight = stackSection.offsetHeight;

      // Show car if user is viewing architecture or stack sections
      if (scrollPos >= archTop && scrollPos <= stackTop + stackHeight) {
        setIsInViewport(true);
        
        // Calculate smooth opacity curves
        const archEnd = archTop + archHeight;
        const stackEnd = stackTop + stackHeight;

        if (scrollPos <= archEnd) {
          // Fade in during architecture (0 → 1)
          const progress = (scrollPos - archTop) / archHeight;
          setOpacity(Math.max(0, Math.min(1, progress * 1.2)));
        } else if (scrollPos >= stackTop) {
          // Fade out during stack (1 → 0)
          const progress = (scrollPos - stackTop) / stackHeight;
          setOpacity(Math.max(0, 1 - progress * 1.2));
        } else {
          // Full opacity in between
          setOpacity(1);
        }
      } else {
        setIsInViewport(false);
        setOpacity(0);
      }

      // Parallax
      const parallaxOffset = (scrollPos % 100) * 0.05;
      setPosition({ x: parallaxOffset, y: parallaxOffset * 0.3 });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className="lp-car-background"
      animate={{ opacity }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      style={{
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
            <stop offset="0%" stopColor="#5A5A6E" />
            <stop offset="20%" stopColor="#3A3A4A" />
            <stop offset="50%" stopColor="#1A1A28" />
            <stop offset="80%" stopColor="#2A2A38" />
            <stop offset="100%" stopColor="#4A4A5A" />
          </linearGradient>

          {/* Rim gradient */}
          <radialGradient id="rimGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#8A8A9E" />
            <stop offset="50%" stopColor="#4A4A5A" />
            <stop offset="100%" stopColor="#1A1A25" />
          </radialGradient>

          {/* Window reflection */}
          <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#506080" />
            <stop offset="50%" stopColor="#384860" />
            <stop offset="100%" stopColor="#203040" />
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
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* Main car body (side profile) */}
        <g className="lp-car-body">
          {/* Undercarriage shadow */}
          <ellipse cx="600" cy="340" rx="520" ry="35" fill="#00000026" />

          {/* Main body silhouette - dramatic profile */}
          <path
            d="M 200 280 L 280 200 L 320 185 L 450 170 L 550 165 L 700 160 L 800 155 L 950 165 L 1000 180 L 1050 210 L 1060 250 L 1065 290 Q 1060 310 1050 320 L 200 320 Z"
            fill="url(#carGradient)"
            stroke="#D4A96A"
            strokeWidth="2"
            opacity="0.9"
          />

          {/* Hood accent line */}
          <path
            d="M 280 200 Q 400 185 550 170 Q 650 165 750 165"
            stroke="#D4A96A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Roof line - elegant curve */}
          <path
            d="M 320 185 Q 500 140 700 135 Q 850 140 950 160"
            stroke="#D4A96A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Front windshield reflection */}
          <path
            d="M 850 165 L 950 200 L 920 150 Z"
            fill="url(#windowGradient)"
            opacity="0.8"
          />

          {/* Rear windshield reflection */}
          <path
            d="M 450 170 L 550 210 L 500 150 Z"
            fill="url(#windowGradient)"
            opacity="0.6"
          />

          {/* Side accent line (crease) */}
          <path
            d="M 300 220 Q 600 215 1000 235"
            stroke="#D4A96A"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />

          {/* Front bumper */}
          <rect x="1050" y="290" width="25" height="35" fill="#2A2A35" stroke="#D4A96A" strokeWidth="1.5" opacity="0.8" />

          {/* Rear bumper */}
          <rect x="185" y="290" width="20" height="35" fill="#2A2A35" stroke="#D4A96A" strokeWidth="1.5" opacity="0.8" />
        </g>

        {/* Wheels */}
        <g className="lp-wheels">
          {/* Front wheel */}
          <circle cx="850" cy="330" r="48" fill="url(#rimGradient)" stroke="#1A1A25" strokeWidth="2" />
          <circle cx="850" cy="330" r="42" fill="#0F0F18" />
          <circle cx="850" cy="330" r="38" fill="none" stroke="#D4A96A" strokeWidth="1.5" opacity="0.6" />
          <circle cx="850" cy="330" r="28" fill="none" stroke="#D4A96A" strokeWidth="1" opacity="0.5" />

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
                stroke="#D4A96A"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}

          {/* Rear wheel */}
          <circle cx="350" cy="335" r="45" fill="url(#rimGradient)" stroke="#1A1A25" strokeWidth="2" />
          <circle cx="350" cy="335" r="40" fill="#0F0F18" />
          <circle cx="350" cy="335" r="36" fill="none" stroke="#D4A96A" strokeWidth="1.5" opacity="0.6" />
          <circle cx="350" cy="335" r="27" fill="none" stroke="#D4A96A" strokeWidth="1" opacity="0.5" />

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
                stroke="#D4A96A"
                strokeWidth="0.8"
                opacity="0.5"
              />
            );
          })}
        </g>

        {/* Headlight glow */}
        <ellipse cx="1020" cy="250" rx="35" ry="28" fill="#D4A96A" opacity="0.15" filter="url(#accentGlow)" />
        <ellipse cx="1020" cy="250" rx="20" ry="16" fill="#D4A96A" opacity="0.25" />

        {/* Accent details - front splitter */}
        <rect x="1055" y="310" width="8" height="25" fill="#D4A96A" rx="1" opacity="0.6" />
        <rect x="1065" y="310" width="8" height="25" fill="#D4A96A" rx="1" opacity="0.5" />

        {/* Light highlight on body */}
        <path
          d="M 400 190 Q 600 160 800 155 Q 850 200 900 230"
          stroke="#D4A96A"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
          filter="url(#highlight)"
        />
      </svg>
    </motion.div>
  );
}
