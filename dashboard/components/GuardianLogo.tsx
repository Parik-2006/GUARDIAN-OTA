"use client";

interface GuardianLogoProps {
  size?: number;
  style?: React.CSSProperties;
}

export default function GuardianLogo({ size = 48, style }: GuardianLogoProps) {
  return (
    <img
      src="/logos/guardian-logo.png"
      alt="Guardian OTA Logo"
      width={size}
      height={size}
      style={{
        objectFit: "contain",
        ...style,
      }}
    />
  );
}
