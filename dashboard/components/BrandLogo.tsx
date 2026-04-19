"use client";

import { P } from "./theme";

interface BrandLogoProps {
  vehicleName: string;
  size?: number;
  style?: React.CSSProperties;
}

// Brand to logo file mapping
const BRAND_LOGO_MAP: Record<string, string> = {
  "audi": "/logos/audi.png",
  "mercedes": "/logos/mercedes.png",
  "bmw": "/logos/bmw.png",
  "tesla": "/logos/tesla.png",
  "porsche": "/logos/porsche.png",
  "volkswagen": "/logos/volkswagen.png",
  "ford": "/logos/ford.png",
  "chevrolet": "/logos/chevrolet.png",
  "toyota": "/logos/toyota.png",
  "honda": "/logos/honda.png",
  "nissan": "/logos/nissan.png",
  "hyundai": "/logos/hyundai.png",
  "lexus": "/logos/lexus.png",
  "lamborghini": "/logos/lamborghini.png",
  "ferrari": "/logos/ferrari.png",
};

export default function BrandLogo({ vehicleName, size = 32, style }: BrandLogoProps) {
  // Extract brand from vehicle name
  let logoUrl: string | null = null;
  const nameLower = vehicleName.toLowerCase();

  for (const [brand, url] of Object.entries(BRAND_LOGO_MAP)) {
    if (nameLower.includes(brand)) {
      logoUrl = url;
      break;
    }
  }

  if (!logoUrl) {
    // Fallback: Generic shield for unknown brands
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

  return (
    <img
      src={logoUrl}
      alt={vehicleName}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        ...style,
      }}
    />
  );
}
