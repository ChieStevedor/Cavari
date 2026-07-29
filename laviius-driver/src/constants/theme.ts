/**
 * Design tokens for the Laviius Driver App.
 *
 * Philosophy: Apple / Linear / Stripe / Uber Driver / Google Maps.
 * Premium, minimal, calm, high-contrast, one-handed, glanceable at 55mph.
 *
 * Dark-first: drivers spend long hours in cab glare and at night. Dark
 * backgrounds reduce windshield glare and battery draw on OLED devices.
 */

export const color = {
  // Base surfaces
  bg: "#0B0F19", // app background
  bgElevated: "#12172A", // cards
  bgElevated2: "#1B2138", // nested cards / pressed states
  border: "#262D45",
  borderSubtle: "#1B2138",

  // Text
  textPrimary: "#F5F7FF",
  textSecondary: "#A6ADC8",
  textTertiary: "#6B7394",
  textInverse: "#0B0F19",

  // Brand
  brand: "#4F7CFF", // Laviius blue
  brandMuted: "#2A3B6B",

  // Semantic — action-center + status colors (spec: green/orange/blue/purple/red)
  go: "#2CD394", // green — navigate / start / go actions
  goMuted: "#0F3B2C",
  attention: "#FF9F43", // orange — confirm / signature required
  attentionMuted: "#4A3312",
  info: "#4F7CFF", // blue — begin loading / informational action
  infoMuted: "#1C2A52",
  premium: "#B084F5", // purple — verify cargo / white glove
  premiumMuted: "#2E2350",
  danger: "#FF5D6C", // red — report issue / critical
  dangerMuted: "#4A1620",

  // Utility
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(11,15,25,0.72)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
  full: 999,
} as const;

// Minimum touch target per WCAG 2.5.5 / Apple HIG — never go below 44pt,
// this app targets 52pt as default for gloved-hand / moving-vehicle use.
export const touchTarget = {
  min: 44,
  default: 52,
  primary: 60,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: "700" as const },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 17, lineHeight: 24, fontWeight: "400" as const },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: "500" as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const },
} as const;

export type ActionColor = "go" | "attention" | "info" | "premium" | "danger";

export const actionColorMap: Record<
  ActionColor,
  { fg: string; bg: string; dot: string }
> = {
  go: { fg: color.go, bg: color.goMuted, dot: color.go },
  attention: { fg: color.attention, bg: color.attentionMuted, dot: color.attention },
  info: { fg: color.info, bg: color.infoMuted, dot: color.info },
  premium: { fg: color.premium, bg: color.premiumMuted, dot: color.premium },
  danger: { fg: color.danger, bg: color.dangerMuted, dot: color.danger },
};

export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
};
