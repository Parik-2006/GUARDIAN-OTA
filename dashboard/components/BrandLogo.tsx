"use client";

import { P } from "./theme";

interface BrandLogoProps {
  vehicleName: string;
  size?: number;
  style?: React.CSSProperties;
}

// Professional SVG Logos for each brand
const BRAND_LOGOS: Record<string, (size: number, style?: React.CSSProperties) => JSX.Element> = {
  "audi": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Audi Four Rings */}
      <defs>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap');`}</style>
      </defs>
      <circle cx="18" cy="50" r="11" fill="none" stroke="#DC143C" strokeWidth="3"/>
      <circle cx="38" cy="50" r="11" fill="none" stroke="#DC143C" strokeWidth="3"/>
      <circle cx="58" cy="50" r="11" fill="none" stroke="#DC143C" strokeWidth="3"/>
      <circle cx="78" cy="50" r="11" fill="none" stroke="#DC143C" strokeWidth="3"/>
    </svg>
  ),
  "mercedes": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Mercedes Star */}
      <circle cx="50" cy="50" r="32" fill="none" stroke="#00A3E0" strokeWidth="2"/>
      <circle cx="50" cy="50" r="6" fill="#00A3E0"/>
      <line x1="50" y1="50" x2="50" y2="18" stroke="#00A3E0" strokeWidth="2.5"/>
      <line x1="50" y1="50" x2="75" y2="73" stroke="#00A3E0" strokeWidth="2.5"/>
      <line x1="50" y1="50" x2="25" y2="73" stroke="#00A3E0" strokeWidth="2.5"/>
    </svg>
  ),
  "bmw": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* BMW Roundel */}
      <circle cx="50" cy="50" r="32" fill="none" stroke="#003B7F" strokeWidth="2"/>
      <circle cx="50" cy="50" r="28" fill="none" stroke="#003B7F" strokeWidth="1.5"/>
      <line x1="50" y1="22" x2="50" y2="78" stroke="#003B7F" strokeWidth="2"/>
      <line x1="22" y1="50" x2="78" y2="50" stroke="#003B7F" strokeWidth="2"/>
      <path d="M 50 22 Q 35 35 35 50 Q 35 65 50 78" fill="white" opacity="0.3"/>
    </svg>
  ),
  "tesla": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Tesla T */}
      <rect x="20" y="20" width="60" height="60" fill="#E82127" rx="4"/>
      <g transform="translate(50, 50)">
        <path d="M -8 -12 L -8 12 M 8 -12 L 8 12 M -10 -12 L 10 -12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  ),
  "porsche": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Porsche Crest */}
      <rect x="15" y="20" width="70" height="65" fill="white" stroke="#000" strokeWidth="2" rx="3"/>
      <rect x="15" y="20" width="70" height="30" fill="#000"/>
      <text x="50" y="40" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">PORSCHE</text>
      <circle cx="35" cy="62" r="11" fill="none" stroke="#000" strokeWidth="2"/>
      <circle cx="65" cy="62" r="11" fill="none" stroke="#000" strokeWidth="2"/>
      <path d="M 35 51 L 50 75" stroke="#000" strokeWidth="1.5"/>
      <path d="M 65 51 L 50 75" stroke="#000" strokeWidth="1.5"/>
    </svg>
  ),
  "volkswagen": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* VW Logo */}
      <circle cx="50" cy="50" r="35" fill="#0066B2"/>
      <path d="M 50 28 L 32 72 L 42 72 L 48 55 L 52 55 L 58 72 L 68 72 L 50 28 Z" fill="white"/>
    </svg>
  ),
  "ford": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Ford Blue Oval */}
      <ellipse cx="50" cy="50" rx="32" ry="30" fill="#003478"/>
      <text x="50" y="60" fontSize="28" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial">F</text>
    </svg>
  ),
  "chevrolet": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Chevy Bowtie */}
      <rect x="20" y="28" width="30" height="22" fill="#FFB81C"/>
      <rect x="50" y="28" width="30" height="22" fill="#FFB81C"/>
      <rect x="35" y="35" width="30" height="10" fill="#FFB81C"/>
      <rect x="20" y="50" width="30" height="22" fill="#FFB81C"/>
      <rect x="50" y="50" width="30" height="22" fill="#FFB81C"/>
    </svg>
  ),
  "toyota": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Toyota Oval */}
      <ellipse cx="50" cy="38" rx="14" ry="16" fill="none" stroke="#EB0A1E" strokeWidth="2.5"/>
      <ellipse cx="38" cy="62" rx="10" ry="13" fill="none" stroke="#EB0A1E" strokeWidth="2.5"/>
      <ellipse cx="62" cy="62" rx="10" ry="13" fill="none" stroke="#EB0A1E" strokeWidth="2.5"/>
      <line x1="50" y1="54" x2="50" y2="64" stroke="#EB0A1E" strokeWidth="2"/>
    </svg>
  ),
  "honda": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Honda H */}
      <rect x="22" y="22" width="56" height="56" fill="#C60C30" rx="4"/>
      <text x="50" y="63" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">H</text>
    </svg>
  ),
  "nissan": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Nissan Badge */}
      <rect x="18" y="35" width="64" height="30" fill="none" stroke="#C8102E" strokeWidth="2.5"/>
      <circle cx="38" cy="50" r="8" fill="#C8102E"/>
      <circle cx="62" cy="50" r="8" fill="#C8102E"/>
      <line x1="38" y1="50" x2="62" y2="50" stroke="#C8102E" strokeWidth="1.5"/>
    </svg>
  ),
  "hyundai": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Hyundai H */}
      <rect x="20" y="20" width="60" height="60" fill="#003478" rx="3"/>
      <path d="M 40 40 L 40 65 M 60 40 L 60 65 M 40 50 L 60 50" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  "lexus": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Lexus L */}
      <circle cx="50" cy="50" r="30" fill="none" stroke="#0066B2" strokeWidth="2.5"/>
      <path d="M 40 38 L 60 38 L 60 62 L 55 62 L 40 62 Z" fill="none" stroke="#0066B2" strokeWidth="2.5" strokeLinejoin="round"/>
    </svg>
  ),
  "lamborghini": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Lamborghini Shield */}
      <polygon points="50,20 75,40 75,75 25,75 25,40" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinejoin="round"/>
      <polygon points="50,35 70,50 70,70 30,70 30,50" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="50" y1="35" x2="50" y2="70" stroke="#FFD700" strokeWidth="1.5"/>
    </svg>
  ),
  "ferrari": (size, style) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Ferrari Prancing Horse */}
      <rect x="18" y="18" width="64" height="64" fill="#DC143C" rx="3"/>
      <g transform="translate(50, 50)">
        <circle cx="0" cy="-8" r="3" fill="#FFD700"/>
        <path d="M -4 0 L 0 -3 L 4 0 L 0 8 Z" fill="#FFD700"/>
        <path d="M -8 2 Q -6 6 -4 8 M 8 2 Q 6 6 4 8" stroke="#FFD700" strokeWidth="1" fill="none"/>
      </g>
    </svg>
  ),
};

export default function BrandLogo({ vehicleName, size = 32, style }: BrandLogoProps) {
  const nameLower = vehicleName.toLowerCase();
  let brand: string | null = null;

  for (const key of Object.keys(BRAND_LOGOS)) {
    if (nameLower.includes(key)) {
      brand = key;
      break;
    }
  }

  if (!brand) {
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
