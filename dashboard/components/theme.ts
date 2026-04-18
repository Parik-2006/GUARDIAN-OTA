/* ═══════════════════════════════════════════════════════════════
   SHARED THEME — Palette + Icon helper
   Extracted from dashboard.tsx so all sub-components can import.
   DO NOT modify any colors — these are the canonical design tokens.
═══════════════════════════════════════════════════════════════ */

export const P = {
  bg:      "#0D0B08",
  wall:    "#161210",
  cockpit: "#1D1912",
  dash:    "#252018",
  trim:    "#2E2820",
  ivory:      "#EEE6D3",
  champagne:  "#D8CCBA",
  parchment:  "#BFB29C",
  cashmere:   "rgba(238,230,211,0.52)",
  whisper:    "rgba(238,230,211,0.24)",
  bDim:  "rgba(238,230,211,0.055)",
  bMid:  "rgba(238,230,211,0.10)",
  bHi:   "rgba(200,145,74,0.30)",
  cognac:    "#C8914A",
  cgnDim:    "rgba(200,145,74,0.13)",
  cgnGlow:   "rgba(200,145,74,0.25)",
  platinum:  "#A8A29A",
  copper:    "#B87C3A",
  copDim:    "rgba(184,124,58,0.13)",
  sage:      "#7A9E72",
  sageDim:   "rgba(122,158,114,0.13)",
  burg:      "#9E5A5A",
  burgDim:   "rgba(158,90,90,0.13)",
} as const;
