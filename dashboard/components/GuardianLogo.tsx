"use client";

interface GuardianLogoProps {
  size?: number;
  style?: React.CSSProperties;
}

export default function GuardianLogo({ size = 48, style }: GuardianLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914" />
          <stop offset="50%" stopColor="#9D7E1A" />
          <stop offset="100%" stopColor="#6B5110" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Shield */}
      <path
        d="M 100 20 L 160 55 L 160 110 Q 160 160 100 185 Q 40 160 40 110 L 40 55 Z"
        fill="url(#shieldGradient)"
        stroke="#5A3E0D"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* Inner Shield Border */}
      <path
        d="M 100 30 L 150 60 L 150 110 Q 150 155 100 175 Q 50 155 50 110 L 50 60 Z"
        fill="none"
        stroke="#B89F3A"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Circuit Patterns - Top */}
      <g stroke="#B89F3A" strokeWidth="1.2" fill="none" opacity="0.8">
        {/* Horizontal lines */}
        <line x1="70" y1="55" x2="130" y2="55" />
        <line x1="65" y1="70" x2="135" y2="70" />
        <line x1="60" y1="85" x2="140" y2="85" />

        {/* Vertical connections */}
        <line x1="85" y1="55" x2="85" y2="70" />
        <line x1="100" y1="55" x2="100" y2="70" />
        <line x1="115" y1="55" x2="115" y2="70" />

        <line x1="75" y1="70" x2="75" y2="85" />
        <line x1="100" y1="70" x2="100" y2="85" />
        <line x1="125" y1="70" x2="125" y2="85" />

        {/* Diagonal connections */}
        <line x1="85" y1="70" x2="100" y2="85" />
        <line x1="115" y1="70" x2="100" y2="85" />
      </g>

      {/* Circuit Nodes - Top Section */}
      <g fill="#B89F3A" opacity="0.9">
        <circle cx="70" cy="55" r="2" />
        <circle cx="100" cy="55" r="2" />
        <circle cx="130" cy="55" r="2" />
        <circle cx="65" cy="70" r="2" />
        <circle cx="85" cy="70" r="2" />
        <circle cx="115" cy="70" r="2" />
        <circle cx="135" cy="70" r="2" />
        <circle cx="100" cy="85" r="2.5" />
        <circle cx="75" cy="85" r="2" />
        <circle cx="125" cy="85" r="2" />
      </g>

      {/* Circuit Patterns - Middle */}
      <g stroke="#8B6914" strokeWidth="1" fill="none" opacity="0.6">
        <line x1="65" y1="95" x2="135" y2="95" />
        <line x1="70" y1="105" x2="130" y2="105" />
        <line x1="80" y1="95" x2="80" y2="105" />
        <line x1="100" y1="95" x2="100" y2="105" />
        <line x1="120" y1="95" x2="120" y2="105" />
      </g>

      {/* Circuit Nodes - Middle */}
      <g fill="#8B6914" opacity="0.7">
        <circle cx="65" cy="95" r="1.5" />
        <circle cx="100" cy="95" r="1.5" />
        <circle cx="135" cy="95" r="1.5" />
        <circle cx="80" cy="105" r="1.5" />
        <circle cx="100" cy="105" r="1.5" />
        <circle cx="120" cy="105" r="1.5" />
      </g>

      {/* Circuit Patterns - Bottom */}
      <g stroke="#8B6914" strokeWidth="0.8" fill="none" opacity="0.5">
        <line x1="75" y1="115" x2="125" y2="115" />
        <line x1="70" y1="128" x2="130" y2="128" />
        <line x1="85" y1="115" x2="85" y2="128" />
        <line x1="115" y1="115" x2="115" y2="128" />
      </g>

      {/* Circuit Nodes - Bottom */}
      <g fill="#8B6914" opacity="0.5">
        <circle cx="75" cy="115" r="1" />
        <circle cx="125" cy="115" r="1" />
        <circle cx="70" cy="128" r="1" />
        <circle cx="100" cy="128" r="1" />
        <circle cx="130" cy="128" r="1" />
      </g>

      {/* Central car silhouette */}
      <g fill="#B89F3A" opacity="0.3">
        <path d="M 85 110 Q 100 105 115 110 L 115 130 Q 100 135 85 130 Z" />
      </g>

      {/* Highlight edges for 3D effect */}
      <path
        d="M 100 20 L 160 55"
        stroke="#D4AF37"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M 100 20 L 40 55"
        stroke="#5A3E0D"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
}
