import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#020408",
        panel: "#070d1a",
        cyan: "#00f5ff",
        violet: "#a855f7",
        green: "#00ff88",
        red: "#ff3366",
        amber: "#ffb800",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(0,245,255,0.15), 0 0 60px rgba(0,245,255,0.06)",
        "neon-violet": "0 0 20px rgba(168,85,247,0.15), 0 0 60px rgba(168,85,247,0.06)",
        "neon-green": "0 0 20px rgba(0,255,136,0.15), 0 0 60px rgba(0,255,136,0.06)",
        "neon-red": "0 0 20px rgba(255,51,102,0.2)",
      },
      animation: {
        "spin-slow": "spin 6s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
