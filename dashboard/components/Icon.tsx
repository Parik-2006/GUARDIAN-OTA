"use client";

import { P } from "./theme";

/** Material Symbols Outlined icon helper — identical to original `I` component */
export default function I({ n, f = false, sz = 20, col }: {
  n: string; f?: boolean; sz?: number; col?: string;
}) {
  return (
    <span style={{
      fontFamily: "'Material Symbols Outlined'", fontWeight: 400, fontStyle: "normal",
      fontSize: sz, lineHeight: 1, letterSpacing: "normal", textTransform: "none",
      display: "inline-block", whiteSpace: "nowrap", direction: "ltr",
      WebkitFontSmoothing: "antialiased",
      fontVariationSettings: f ? "'FILL' 1" : "'FILL' 0",
      color: col ?? P.parchment, verticalAlign: "middle",
    }}>{n}</span>
  );
}
