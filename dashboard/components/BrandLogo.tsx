"use client";

import { useState, useEffect } from "react";
import { P } from "./theme";

interface BrandLogoProps {
  vehicleName: string;
  size?: number;
  style?: React.CSSProperties;
}

// Brand to company name mapping for logo API
const BRAND_COMPANY_MAP: Record<string, string> = {
  "audi": "Audi",
  "mercedes": "Mercedes-Benz",
  "bmw": "BMW",
  "tesla": "Tesla",
  "porsche": "Porsche",
  "volkswagen": "Volkswagen",
  "ford": "Ford Motor Company",
  "gm": "General Motors",
  "chevrolet": "Chevrolet",
  "ram": "Ram Trucks",
  "toyota": "Toyota",
  "honda": "Honda",
  "nissan": "Nissan",
  "lexus": "Lexus",
  "hyundai": "Hyundai",
};

export default function BrandLogo({ vehicleName, size = 32, style }: BrandLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Extract brand from vehicle name
    let brand = "";
    const nameLower = vehicleName.toLowerCase();

    for (const [key] of Object.entries(BRAND_COMPANY_MAP)) {
      if (nameLower.includes(key)) {
        brand = key;
        break;
      }
    }

    if (!brand) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const companyName = BRAND_COMPANY_MAP[brand];

    // Use Clearbit logo API (free, no auth required)
    // Alternative: https://api.brandfetch.io/v2/logo?domain=audi.com
    const logoUrl = `https://logo.clearbit.com/${companyName.toLowerCase().replace(/\s+/g, "")}.com?size=200`;

    // Test if logo exists and is loadable
    const img = new Image();
    img.onload = () => {
      setLogoUrl(logoUrl);
      setIsLoading(false);
    };
    img.onerror = () => {
      // Try alternative: Brandfetch API
      const brandFetchUrl = `https://cdn.brandfetch.io/${companyName.toLowerCase().replace(/\s+/g, "-")}/logo/square/200`;
      
      const img2 = new Image();
      img2.onload = () => {
        setLogoUrl(brandFetchUrl);
        setIsLoading(false);
      };
      img2.onerror = () => {
        // Try another fallback: Worldvectorlogo CDN
        const wvlUrl = `https://cdn.worldvectorlogo.com/logos/${brand.toLowerCase()}.svg`;
        const img3 = new Image();
        img3.onload = () => {
          setLogoUrl(wvlUrl);
          setIsLoading(false);
        };
        img3.onerror = () => {
          setHasError(true);
          setIsLoading(false);
        };
        img3.src = wvlUrl;
      };
      img2.src = brandFetchUrl;
    };
    img.src = logoUrl;
  }, [vehicleName]);

  if (isLoading) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          background: "rgba(240,235,224,0.1)",
          animation: "pulse 2s ease-in-out infinite",
          ...style,
        }}
      />
    );
  }

  if (hasError || !logoUrl) {
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
      onError={() => setHasError(true)}
    />
  );
}
