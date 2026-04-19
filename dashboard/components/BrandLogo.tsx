"use client";

import { P } from "./theme";

interface BrandLogoProps {
  vehicleName: string;
  size?: number;
  style?: React.CSSProperties;
}

// SVG Logos for each brand
const BRAND_LOGOS: Record<string, (size: number, style?: React.CSSProperties) => JSX.Element> = {
  "audi": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <circle cx="20" cy="50" r="12" fill="#DC143C" />
      <circle cx="40" cy="50" r="12" fill="#DC143C" />
      <circle cx="60" cy="50" r="12" fill="#DC143C" />
      <circle cx="80" cy="50" r="12" fill="#DC143C" />
    </svg>
  ),
  "mercedes": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <circle cx="50" cy="50" r="35" fill="none" stroke="#00A3E0" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="8" fill="#00A3E0" />
      <line x1="50" y1="50" x2="50" y2="20" stroke="#00A3E0" strokeWidth="2.5" />
      <line x1="50" y1="50" x2="73" y2="65" stroke="#00A3E0" strokeWidth="2.5" />
      <line x1="50" y1="50" x2="27" y2="65" stroke="#00A3E0" strokeWidth="2.5" />
    </svg>
  ),
  "bmw": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="25" y="25" width="25" height="50" fill="#1f4788" />
      <rect x="50" y="25" width="25" height="50" fill="white" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#1f4788" strokeWidth="2" />
      <line x1="50" y1="20" x2="50" y2="80" stroke="#1f4788" strokeWidth="2.5" />
    </svg>
  ),
  "tesla": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M50 15 L75 50 L50 85 L25 50 Z" fill="#E82127" />
      <text x="50" y="55" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">T</text>
    </svg>
  ),
  "porsche": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="15" y="20" width="70" height="60" rx="5" fill="#000" />
      <circle cx="35" cy="50" r="10" fill="white" stroke="#FFD700" strokeWidth="1.5" />
      <circle cx="65" cy="50" r="10" fill="none" stroke="#FFD700" strokeWidth="1.5" />
      <text x="50" y="28" fontSize="12" fontWeight="bold" fill="#FFD700" textAnchor="middle">PORSCHE</text>
    </svg>
  ),
  "volkswagen": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <circle cx="50" cy="50" r="35" fill="#0066B2" />
      <path d="M50 30 L60 55 L40 55 Z" fill="white" />
      <path d="M50 55 L65 70 L35 70 Z" fill="white" />
    </svg>
  ),
  "ford": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="20" y="20" width="60" height="60" fill="#003478" rx="3" />
      <text x="50" y="65" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">F</text>
    </svg>
  ),
  "chevrolet": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="25" y="30" width="18" height="40" fill="#FFB81C" />
      <rect x="57" y="30" width="18" height="40" fill="#FFB81C" />
      <rect x="41" y="38" width="18" height="24" fill="#FFB81C" />
    </svg>
  ),
  "toyota": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <ellipse cx="50" cy="40" rx="15" ry="18" fill="none" stroke="#EB0A1E" strokeWidth="2.5" />
      <ellipse cx="35" cy="65" rx="12" ry="15" fill="none" stroke="#EB0A1E" strokeWidth="2.5" />
      <ellipse cx="65" cy="65" rx="12" ry="15" fill="none" stroke="#EB0A1E" strokeWidth="2.5" />
    </svg>
  ),
  "honda": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="25" y="25" width="50" height="50" fill="#C60C30" rx="4" />
      <text x="50" y="60" fontSize="28" fontWeight="bold" fill="white" textAnchor="middle">H</text>
    </svg>
  ),
  "nissan": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="20" y="30" width="60" height="40" fill="#C8102E" rx="2" />
      <text x="50" y="60" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">N</text>
    </svg>
  ),
  "hyundai": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="20" y="20" width="60" height="60" fill="#003478" rx="3" />
      <path d="M45 40 L50 50 L55 40 M45 60 L50 50 L55 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  ),
  "lexus": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <circle cx="50" cy="50" r="32" fill="none" stroke="#0066B2" strokeWidth="2.5" />
      <text x="50" y="60" fontSize="20" fontWeight="bold" fill="#0066B2" textAnchor="middle">L</text>
    </svg>
  ),
  "lamborghini": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <polygon points="50,20 80,50 80,80 20,80 20,50" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="50" y="60" fontSize="18" fontWeight="bold" fill="#FFD700" textAnchor="middle">λ</text>
    </svg>
  ),
  "ferrari": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="20" y="20" width="60" height="60" fill="#DC143C" rx="3" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="#FFD700" strokeWidth="2" />
      <text x="50" y="55" fontSize="16" fontWeight="bold" fill="#FFD700" textAnchor="middle">F</text>
    </svg>
  ),
};

export default function BrandLogo({ vehicleName, size = 32, style }: BrandLogoProps) {
  // Extract brand from vehicle name
  const nameLower = vehicleName.toLowerCase();
  let brand: string | null = null;

  for (const key of Object.keys(BRAND_LOGOS)) {
    if (nameLower.includes(key)) {
      brand = key;
      break;
    }
  }

  if (!brand) {
    // Fallback: Generic shield
    return (
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

  return BRAND_LOGOS[brand](size, style);
}
