import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: "var(--color-primary)",
        surface: "var(--color-surface)",
        raised: "var(--color-surface-raised)",
        accent: "var(--color-accent)",
        ink: "var(--color-dark)",
        critical: "var(--color-secondary-accent)",
        subtleBorder: "var(--color-border-subtle)",
        /** Literal fill so the rail always paints; keep in sync with --sidebar-surface in globals.css */
        "sidebar-rail": "#404E4D",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
      },
    },
  },
  plugins: [],
};
export default config;
