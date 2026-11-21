import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/sections/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-roboto)", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "1.5" }],
        sm: ["var(--text-sm)", { lineHeight: "1.5" }],
        base: ["var(--text-body)", { lineHeight: "1.57" }],
        md: ["var(--text-md)", { lineHeight: "1.5" }],
        lg: ["var(--text-lg)", { lineHeight: "1.5" }],
        xl: ["var(--text-xl)", { lineHeight: "1.5" }],
      },
      spacing: {
        tight: "var(--space-tight)",
        inline: "var(--space-inline)",
        stack: "var(--space-stack)",
        section: "var(--space-section)",
        page: "var(--space-page)",
      },
      maxWidth: {
        page: "var(--page-max-width)",
      },
      borderRadius: {
        lg: "var(--radius-card)",
        md: "var(--radius)",
        sm: "calc(var(--radius) - 2px)",
        panel: "var(--radius-panel)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          dark: "var(--primary-dark)",
          lighter: "var(--primary-lighter)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        info: "var(--info)",
        success: "var(--success)",
        warning: "var(--warning)",
        canvas: "var(--surface-canvas)",
        content: "var(--surface-content)",
        sidebar: "var(--sidebar)",
      },
    },
  },
  plugins: [],
};
export default config;
