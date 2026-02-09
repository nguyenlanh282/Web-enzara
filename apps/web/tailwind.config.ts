import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f7f9f0",
          100: "#f0f3e4",
          200: "#dce3c0",
          300: "#c0cf8e",
          400: "#a4b760",
          500: "#8a9a4a",
          600: "#738136",
          700: "#626c13",
          800: "#4a5210",
          900: "#33390b",
        },
        secondary: {
          50: "#fef7ec",
          100: "#fdecd3",
          200: "#fbd5a0",
          300: "#f5b560",
          400: "#e67e22",
          500: "#de8d1e",
          600: "#c47a15",
          700: "#9c5e10",
          800: "#7a4a0d",
          900: "#5c370a",
        },
        accent: {
          DEFAULT: "#ffcc48",
          light: "#ffe08a",
          dark: "#e6b030",
        },
        surface: "#F5F5F0",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
