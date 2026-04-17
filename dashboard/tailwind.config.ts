import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#020617",
          900: "#060C1A",
          800: "#0A1020",
          700: "#0F172A",
          600: "#1A2338",
          500: "#1E293B",
          400: "#253347",
        },
        steel: {
          700: "#1D4ED8",
          600: "#2563EB",
          500: "#3B82F6",
          400: "#60A5FA",
          300: "#93C5FD",
          200: "#BFDBFE",
          glow: "rgba(59,130,246,0.4)",
        },
        bone: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
        },
        slate: {
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          400: "#94A3B8",
        },
        status: {
          safe: "#10B981",
          "safe-dim": "rgba(16,185,129,0.15)",
          warn: "#F59E0B",
          "warn-dim": "rgba(245,158,11,0.15)",
          danger: "#EF4444",
          "danger-dim": "rgba(239,68,68,0.15)",
          info: "#22D3EE",
          "info-dim": "rgba(34,211,238,0.15)",
        },
      },
      fontFamily: {
        display: ["'Rajdhani'", "'DM Sans'", "system-ui", "sans-serif"],
        body: ["'DM Sans'", "'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      borderRadius: {
        cockpit: "4px",
        card: "6px",
        pill: "100px",
      },
      backdropBlur: {
        tactical: "20px",
        heavy: "40px",
      },
      boxShadow: {
        "steel-glow": "0 0 20px rgba(59,130,246,0.2), 0 0 60px rgba(59,130,246,0.08)",
        "steel-glow-lg": "0 0 30px rgba(59,130,246,0.3), 0 0 80px rgba(59,130,246,0.1)",
        "safe-glow": "0 0 20px rgba(16,185,129,0.2), 0 0 50px rgba(16,185,129,0.06)",
        "danger-glow": "0 0 20px rgba(239,68,68,0.25), 0 0 50px rgba(239,68,68,0.08)",
        "card-rest": "0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02)",
        "card-hover":
          "0 0 0 1px rgba(59,130,246,0.5), 0 8px 40px rgba(59,130,246,0.12), 0 2px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(59,130,246,0.08)",
        "inset-steel": "inset 0 0 0 1px rgba(59,130,246,0.2)",
      },
      animation: {
        "line-sweep": "line-sweep 5s ease-in-out infinite",
        "grain": "grain 8s steps(1) infinite",
        "pulse-dot": "pulse-dot 2.5s ease-in-out infinite",
        "flicker-in": "flicker-in 0.35s ease-out forwards",
        "scan-down": "scan-down 10s linear infinite",
        "fade-up": "fade-up 0.4s ease-out forwards",
        "ignite": "ignite 0.3s ease forwards",
      },
      keyframes: {
        "line-sweep": {
          "0%": { backgroundPosition: "-40% 0%" },
          "60%, 100%": { backgroundPosition: "140% 0%" },
        },
        "grain": {
          "0%, 100%": { transform: "translate(0,0)" },
          "10%": { transform: "translate(-4%,-8%)" },
          "20%": { transform: "translate(-12%, 4%)" },
          "30%": { transform: "translate(6%,-22%)" },
          "40%": { transform: "translate(-4%, 22%)" },
          "50%": { transform: "translate(-14%, 9%)" },
          "60%": { transform: "translate(12%, 0%)" },
          "70%": { transform: "translate(0%, 14%)" },
          "80%": { transform: "translate(2%, 32%)" },
          "90%": { transform: "translate(-8%, 9%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        "flicker-in": {
          "0%": { opacity: "0", filter: "blur(3px)" },
          "20%": { opacity: "0.6", filter: "blur(1px)" },
          "40%": { opacity: "0.3", filter: "blur(2px)" },
          "60%": { opacity: "0.85", filter: "blur(0px)" },
          "80%": { opacity: "0.7", filter: "blur(0.5px)" },
          "100%": { opacity: "1", filter: "blur(0px)" },
        },
        "scan-down": {
          "0%": { top: "-2px", opacity: "0" },
          "5%": { opacity: "1" },
          "90%": { opacity: "0.6" },
          "100%": { top: "100vh", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
