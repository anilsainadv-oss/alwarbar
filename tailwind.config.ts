import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          navy: "#0A192F",
          navyDark: "#071120",
          navyLight: "#1E293B",
          gold: "#C5A880",
          goldDark: "#9E7D47",
          goldLight: "#E8D8BA",
          cream: "#FAF9F6",
          slate: "#334155",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        devanagari: ["var(--font-hindi)", "Noto Sans Devanagari", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
