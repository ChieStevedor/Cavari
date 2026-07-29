/**
 * NativeWind / Tailwind config.
 * Colors mirror src/constants/theme.ts (`color`) — kept in sync manually
 * since this file runs under plain Node, not the Metro/Babel TS pipeline.
 */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F19",
        "bg-elevated": "#12172A",
        "bg-elevated-2": "#1B2138",
        border: "#262D45",
        "border-subtle": "#1B2138",
        "text-primary": "#F5F7FF",
        "text-secondary": "#A6ADC8",
        "text-tertiary": "#6B7394",
        brand: "#4F7CFF",
        "brand-muted": "#2A3B6B",
        go: "#2CD394",
        "go-muted": "#0F3B2C",
        attention: "#FF9F43",
        "attention-muted": "#4A3312",
        info: "#4F7CFF",
        "info-muted": "#1C2A52",
        premium: "#B084F5",
        "premium-muted": "#2E2350",
        danger: "#FF5D6C",
        "danger-muted": "#4A1620",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px",
      },
      spacing: {
        touch: "52px",
        "touch-lg": "60px",
      },
    },
  },
  plugins: [],
};
