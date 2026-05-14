import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mad: { 50: "#fef2f2", 200: "#fecaca", 500: "#ef4444", 700: "#b91c1c" },
        glad: { 50: "#f0fdf4", 200: "#bbf7d0", 500: "#22c55e", 700: "#15803d" },
        sad: { 50: "#eff6ff", 200: "#bfdbfe", 500: "#3b82f6", 700: "#1d4ed8" },
      },
    },
  },
  plugins: [],
};

export default config;
