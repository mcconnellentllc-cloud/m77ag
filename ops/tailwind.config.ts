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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Entity colors
        entity: {
          m77ag: "#16a34a",
          cattle: "#92400e",
          pioneer: "#f59e0b",
          togoag: "#ec4899",
          acreprofit: "#8b5cf6",
          cocorn: "#eab308",
          hunting: "#78716c",
          mcconnellent: "#3b82f6",
          personal: "#06b6d4",
          flamesoffury: "#ef4444",
        },
        // App chrome
        sidebar: {
          bg: "#111827",
          hover: "#1f2937",
          active: "#374151",
        },
      },
    },
  },
  plugins: [],
};
export default config;
