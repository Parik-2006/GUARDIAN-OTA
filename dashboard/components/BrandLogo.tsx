"use client";

import { P } from "./theme";

interface BrandLogoProps {
  vehicleName: string;
  size?: number;
  style?: React.CSSProperties;
}

export default function BrandLogo({ vehicleName, size = 32, style }: BrandLogoProps) {
  let brandColor = P.cognac;
  let Logo = null;

  if (vehicleName.toLowerCase().includes("audi")) {
    brandColor = "#E1242B";
    Logo = (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
      >
        {/* Audi Four Rings */}
        <circle cx="22" cy="50" r="12" fill="none" stroke={brandColor} strokeWidth="4" />
        <circle cx="46" cy="50" r="12" fill="none" stroke={brandColor} strokeWidth="4" />
        <circle cx="70" cy="50" r="12" fill="none" stroke={brandColor} strokeWidth="4" />
        <circle cx="78" cy="50" r="12" fill="none" stroke={brandColor} strokeWidth="4" />
      </svg>
    );
  } else if (vehicleName.toLowerCase().includes("mercedes")) {
    brandColor = "#00a3e0";
    Logo = (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
      >
        {/* Mercedes Star */}
        <circle cx="50" cy="50" r="18" fill="none" stroke={brandColor} strokeWidth="3" />
        {/* Three rays from center */}
        {[0, 120, 240].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 50;
          const y1 = 50;
          const x2 = 50 + Math.cos(rad) * 20;
          const y2 = 50 + Math.sin(rad) * 20;
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={brandColor}
              strokeWidth="2.5"
            />
          );
        })}
      </svg>
    );
  } else if (vehicleName.toLowerCase().includes("bmw")) {
    brandColor = "#1f4788";
    Logo = (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
      >
        {/* BMW Roundel - Circle with top and bottom sections */}
        <circle cx="50" cy="50" r="22" fill="none" stroke={brandColor} strokeWidth="2" />
        {/* Inner divider */}
        <line x1="50" y1="28" x2="50" y2="72" stroke={brandColor} strokeWidth="2.5" />
        {/* Left section */}
        <path
          d="M 50 28 Q 35 39, 35 50 Q 35 61, 50 72"
          fill="none"
          stroke={brandColor}
          strokeWidth="2.5"
        />
        {/* Right section */}
        <path
          d="M 50 28 Q 65 39, 65 50 Q 65 61, 50 72"
          fill="none"
          stroke={brandColor}
          strokeWidth="2.5"
        />
      </svg>
    );
  } else {
    // Default generic shield for other brands
    Logo = (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
      >
        <path
          d="M50 10 L70 20 L70 55 Q70 75 50 90 Q30 75 30 55 L30 20 Z"
          fill="none"
          stroke={P.copper}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return Logo;
}
