"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ══════════════════════════════════════════
   CAR BACKGROUND — Professional photorealistic render
   Sleek sports car with cinematic lighting
   Appears when viewing architecture/stack sections
══════════════════════════════════════════ */
export function CarBackground() {
  const [opacity, setOpacity] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      
      // Get the footer CTA section (Enter the Command Center)
      const footerCTA = document.querySelector("section:has(> h2:contains('Command Center'))") || 
                        document.evaluate(
                          "//h2[contains(text(), 'Command Center')]/ancestor::section",
                          document,
                          null,
                          XPathResult.FIRST_ORDERED_NODE_TYPE,
                          null
                        ).singleNodeValue;

      if (!footerCTA) {
        // Fallback: detect by finding all sections and getting the last one
        const sections = document.querySelectorAll("section");
        const lastSection = Array.from(sections).filter(s => s.id !== "architecture" && s.id !== "security" && s.id !== "stack").pop();
        
        if (!lastSection) {
          setOpacity(0);
          return;
        }

        const sectionTop = (lastSection as HTMLElement).offsetTop;
        const sectionHeight = (lastSection as HTMLElement).clientHeight;
        
        // Car appears when user reaches the footer CTA section
        const showStart = sectionTop - window.innerHeight * 0.3;
        const showEnd = sectionTop + sectionHeight + window.innerHeight * 0.2;

        if (scrollPos >= showStart && scrollPos <= showEnd) {
          const progress = (scrollPos - showStart) / (showEnd - showStart);
          setOpacity(Math.max(0, Math.min(1, progress * 1.3)));
        } else if (scrollPos > showEnd) {
          setOpacity(1);
        } else {
          setOpacity(0);
        }

        // Parallax effect
        const parallaxOffset = (scrollPos * 0.08) % 40;
        const verticalShift = Math.sin(scrollPos * 0.003) * 20;
        setPosition({ x: parallaxOffset, y: verticalShift });
        setScale(1 + Math.sin(scrollPos * 0.002) * 0.05);

        return;
      }

      const sectionTop = (footerCTA as HTMLElement).offsetTop;
      const sectionHeight = (footerCTA as HTMLElement).clientHeight;
      
      // Car appears when user reaches the footer CTA section
      const showStart = sectionTop - window.innerHeight * 0.3;
      const showEnd = sectionTop + sectionHeight + window.innerHeight * 0.2;

      if (scrollPos >= showStart && scrollPos <= showEnd) {
        const progress = (scrollPos - showStart) / (showEnd - showStart);
        setOpacity(Math.max(0, Math.min(1, progress * 1.3)));
      } else if (scrollPos > showEnd) {
        setOpacity(1);
      } else {
        setOpacity(0);
      }

      // Parallax effect
      const parallaxOffset = (scrollPos * 0.08) % 40;
      const verticalShift = Math.sin(scrollPos * 0.003) * 20;
      setPosition({ x: parallaxOffset, y: verticalShift });
      setScale(1 + Math.sin(scrollPos * 0.002) * 0.05);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className="lp-car-background"
      animate={{ opacity }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1400 500"
        className="lp-car-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Professional metallic body gradient */}
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B8B9E" />
            <stop offset="10%" stopColor="#4A4A5A" />
            <stop offset="30%" stopColor="#2A2A35" />
            <stop offset="50%" stopColor="#1A1A22" />
            <stop offset="70%" stopColor="#252530" />
            <stop offset="90%" stopColor="#3A3A45" />
            <stop offset="100%" stopColor="#5A5A6A" />
          </linearGradient>

          {/* Glossy hood/roof highlight */}
          <linearGradient id="glossHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8D4A0" />
            <stop offset="20%" stopColor="#D4A96A" />
            <stop offset="50%" stopColor="#2A2A35" />
            <stop offset="80%" stopColor="#1A1A22" />
            <stop offset="100%" stopColor="#2A2A35" />
          </linearGradient>

          {/* Ultra-reflective window glass */}
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6A7A9E" />
            <stop offset="25%" stopColor="#3A4A6A" />
            <stop offset="50%" stopColor="#1A2A4A" />
            <stop offset="75%" stopColor="#2A3A5A" />
            <stop offset="100%" stopColor="#1A1A2A" />
          </linearGradient>

          {/* Rim metallic effect */}
          <radialGradient id="wheelRim" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#ACACBC" />
            <stop offset="20%" stopColor="#7A7A8E" />
            <stop offset="50%" stopColor="#3A3A4A" />
            <stop offset="100%" stopColor="#1A1A2A" />
          </radialGradient>

          {/* Tire dark effect */}
          <radialGradient id="tireGradient" cx="45%" cy="45%">
            <stop offset="0%" stopColor="#2A2A35" />
            <stop offset="50%" stopColor="#0F0F15" />
            <stop offset="100%" stopColor="#050508" />
          </radialGradient>

          {/* Dynamic lighting effects */}
          <filter id="lightGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Cinema lighting shadow */}
          <filter id="cinemaLight">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* Scene background - subtle gradient */}
        <defs>
          <linearGradient id="sceneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A1A25" />
            <stop offset="50%" stopColor="#0D0D12" />
            <stop offset="100%" stopColor="#050508" />
          </linearGradient>
        </defs>
        <rect width="1400" height="500" fill="url(#sceneGradient)" />

        {/* Ground plane shadow - ultra-realistic */}
        <ellipse cx="700" cy="420" rx="580" ry="60" fill="#000000" opacity="0.4" />
        <ellipse cx="700" cy="425" rx="600" ry="15" fill="#D4A96A" opacity="0.08" filter="url(#cinemaLight)" />

        {/* Main car body group */}
        <g className="lp-car-body">
          
          {/* Lower body base shadow */}
          <path
            d="M 300 320 Q 350 360 700 380 Q 1050 360 1100 320 Z"
            fill="#000000"
            opacity="0.2"
          />

          {/* Dramatic rear quarter panel */}
          <path
            d="M 200 280 L 320 210 L 380 200 Q 450 195 500 192 L 1050 180 L 1100 200 L 1120 250 Q 1115 310 1050 330 L 200 330 Z"
            fill="url(#bodyGradient)"
            stroke="#D4A96A"
            strokeWidth="2.5"
            opacity="0.95"
          />

          {/* Luxury metallic sheen - upper body */}
          <path
            d="M 320 210 L 380 200 Q 600 185 1050 180 Q 1080 185 1100 200"
            fill="url(#glossHighlight)"
            opacity="0.35"
            strokeLinecap="round"
          />

          {/* Deep hood crease - dramatic shadow line */}
          <path
            d="M 350 220 Q 600 215 1050 220"
            stroke="#0A0A10"
            strokeWidth="3"
            fill="none"
            opacity="0.6"
            strokeLinecap="round"
          />

          {/* Side body crease - character line */}
          <path
            d="M 250 280 Q 600 275 1080 290"
            stroke="#D4A96A"
            strokeWidth="2.5"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
          />

          {/* Accent highlight - cinematic */}
          <path
            d="M 300 225 Q 450 210 700 205 Q 850 210 1000 225"
            stroke="#E8D4A0"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
            filter="url(#softGlow)"
            strokeLinecap="round"
          />

          {/* Front windshield - ultra reflective */}
          <path
            d="M 950 195 L 1070 210 L 1040 160 Z"
            fill="url(#glassGradient)"
            opacity="0.8"
            stroke="#D4A96A"
            strokeWidth="1.5"
          />

          {/* Rear windshield */}
          <path
            d="M 400 200 L 500 220 L 480 170 Z"
            fill="url(#glassGradient)"
            opacity="0.6"
            stroke="#D4A96A"
            strokeWidth="1.5"
          />

          {/* Front bumper - sculpted */}
          <g>
            <path
              d="M 1040 300 L 1120 310 Q 1125 315 1120 325 L 1040 320 Z"
              fill="#1A1A22"
              stroke="#D4A96A"
              strokeWidth="1.5"
            />
            <ellipse cx="1075" cy="312" rx="20" ry="8" fill="#D4A96A" opacity="0.3" filter="url(#lightGlow)" />
          </g>

          {/* Rear bumper accent */}
          <path
            d="M 200 300 L 280 310 Q 285 315 280 325 L 200 320 Z"
            fill="#1A1A22"
            stroke="#D4A96A"
            strokeWidth="1.5"
          />

          {/* Unique accent port */}
          <circle cx="1085" cy="265" r="8" fill="#D4A96A" opacity="0.5" filter="url(#lightGlow)" />
          <circle cx="1085" cy="265" r="5" fill="#D4A96A" opacity="0.8" />
        </g>

        {/* Professional wheel setup */}
        <g className="lp-wheels">
          {/* Front wheel group */}
          <g>
            {/* Tire */}
            <circle cx="900" cy="360" r="62" fill="url(#tireGradient)" stroke="#0A0A10" strokeWidth="3" />
            <circle cx="900" cy="360" r="58" fill="#050508" />
            
            {/* Rim outer */}
            <circle cx="900" cy="360" r="52" fill="url(#wheelRim)" stroke="#1A1A25" strokeWidth="2" />
            <circle cx="900" cy="360" r="48" fill="#1A1A28" />
            
            {/* Rim detail - cognac accent */}
            <circle cx="900" cy="360" r="44" fill="none" stroke="#D4A96A" strokeWidth="1.5" opacity="0.5" />
            <circle cx="900" cy="360" r="35" fill="none" stroke="#D4A96A" strokeWidth="1" opacity="0.4" />

            {/* Spokes - dramatic */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 900 + Math.cos(rad) * 35;
              const y1 = 360 + Math.sin(rad) * 35;
              return (
                <line
                  key={`front-spoke-${angle}`}
                  x1={900}
                  y1={360}
                  x2={x1}
                  y2={y1}
                  stroke="#D4A96A"
                  strokeWidth="1.2"
                  opacity="0.4"
                />
              );
            })}

            {/* Center cap */}
            <circle cx="900" cy="360" r="10" fill="#1A1A22" stroke="#D4A96A" strokeWidth="1" />
          </g>

          {/* Rear wheel group */}
          <g>
            {/* Tire */}
            <circle cx="380" cy="365" r="60" fill="url(#tireGradient)" stroke="#0A0A10" strokeWidth="3" />
            <circle cx="380" cy="365" r="56" fill="#050508" />
            
            {/* Rim outer */}
            <circle cx="380" cy="365" r="50" fill="url(#wheelRim)" stroke="#1A1A25" strokeWidth="2" />
            <circle cx="380" cy="365" r="46" fill="#1A1A28" />
            
            {/* Rim detail */}
            <circle cx="380" cy="365" r="42" fill="none" stroke="#D4A96A" strokeWidth="1.5" opacity="0.5" />
            <circle cx="380" cy="365" r="33" fill="none" stroke="#D4A96A" strokeWidth="1" opacity="0.4" />

            {/* Spokes */}
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 380 + Math.cos(rad) * 33;
              const y1 = 365 + Math.sin(rad) * 33;
              return (
                <line
                  key={`rear-spoke-${angle}`}
                  x1={380}
                  y1={365}
                  x2={x1}
                  y2={y1}
                  stroke="#D4A96A"
                  strokeWidth="1.2"
                  opacity="0.4"
                />
              );
            })}

            {/* Center cap */}
            <circle cx="380" cy="365" r="9" fill="#1A1A22" stroke="#D4A96A" strokeWidth="1" />
          </g>
        </g>

        {/* Headlight system - cinematic glow */}
        <g className="lp-lights">
          {/* Right headlight glow - large */}
          <ellipse cx="1060" cy="245" rx="55" ry="40" fill="#D4A96A" opacity="0.12" filter="url(#lightGlow)" />
          
          {/* Right headlight inner glow */}
          <ellipse cx="1060" cy="245" rx="35" ry="25" fill="#D4A96A" opacity="0.2" filter="url(#softGlow)" />
          
          {/* Right headlight highlight */}
          <ellipse cx="1060" cy="245" rx="18" ry="12" fill="#E8D4A0" opacity="0.5" />

          {/* Left headlight glow */}
          <ellipse cx="250" cy="255" rx="40" ry="30" fill="#D4A96A" opacity="0.1" filter="url(#lightGlow)" />
          <ellipse cx="250" cy="255" rx="22" ry="15" fill="#D4A96A" opacity="0.15" />
        </g>

        {/* Ambient under-light glow - luxury feel */}
        <ellipse cx="650" cy="385" rx="400" ry="40" fill="#D4A96A" opacity="0.06" filter="url(#cinemaLight)" />

        {/* Final gloss coat overlay */}
        <g opacity="0.1">
          <path
            d="M 300 210 Q 600 190 1100 205"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </motion.div>
  );
}
