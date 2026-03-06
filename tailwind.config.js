/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Instrument Serif'", "serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        ink: {
          50:  "#f8f7f4",
          100: "#efede8",
          200: "#dbd8d0",
          300: "#bfbab0",
          400: "#9e9890",
          500: "#7f7970",
          600: "#635e57",
          700: "#4a4640",
          800: "#2e2b27",
          900: "#1a1814",
          950: "#0d0c0a",
        },
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease-out forwards",
        "fade-in":   "fadeIn 0.4s ease-out forwards",
        "shimmer":   "shimmer 1.8s linear infinite",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        "bar-grow":  "barGrow 1s cubic-bezier(0.4,0,0.2,1) forwards",
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        shimmer:  { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        pulseDot: { "0%,100%": { opacity: 1, transform: "scale(1)" }, "50%": { opacity: 0.4, transform: "scale(0.85)" } },
        barGrow:  { from: { transform: "scaleY(0)", transformOrigin: "bottom" }, to: { transform: "scaleY(1)", transformOrigin: "bottom" } },
      },
    },
  },
  plugins: [],
};
