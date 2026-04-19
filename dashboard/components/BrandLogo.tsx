"use client";

import { useState, useEffect } from "react";
import { P } from "./theme";

interface BrandLogoProps {
  vehicleName: string;
  size?: number;
  style?: React.CSSProperties;
}

const BRAND_DOMAINS: Record<string, string> = {
  "audi": "audi.com",
  "mercedes": "mercedes-benz.com",
  "bmw": "bmw.com",
  "tesla": "tesla.com",
  "porsche": "porsche.com",
  "volkswagen": "volkswagen.com",
  "ford": "ford.com",
  "chevrolet": "chevrolet.com",
  "toyota": "toyota.com",
  "honda": "honda.com",
  "nissan": "nissan.com",
  "hyundai": "hyundai.com",
  "lexus": "lexus.com",
  "lamborghini": "lamborghini.com",
  "ferrari": "ferrari.com",
};

export default function BrandLogo({ vehicleName, size = 32, style }: BrandLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const nameLower = vehicleName.toLowerCase();
    let domain = "";

    for (const [brand, domainUrl] of Object.entries(BRAND_DOMAINS)) {
      if (nameLower.includes(brand)) {
        domain = domainUrl;
        break;
      }
    }

    if (!domain) {
      setIsLoading(false);
      return;
    }

    // Use Brandfetch API - free tier available
    // Returns official company logos with proper licensing
    const brandName = domain.split(".")[0];
    const url = `https://cdn.brandfetch.io/${brandName}/logo/square/200`;

    const img = new Image();
    img.onload = () => {
      setLogoUrl(url);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      // Fallback to clearbit
      const fallbackUrl = `https://logo.clearbit.com/${domain}?size=200`;
      setLogoUrl(fallbackUrl);
    };
    img.src = url;
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

  if (!logoUrl) {
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
        padding: 2,
        filter: "brightness(1.1) contrast(1.1)",
        ...style,
      }}
      onError={() => setLogoUrl(null)}
    />
  );
}
