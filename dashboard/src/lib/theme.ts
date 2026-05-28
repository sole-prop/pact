export const THEME = {
  colors: {
    base: "#060606",
    surface: "#0C0C0C",
    border: "#1C1812",
    textPrimary: "#F2F2F7",
    textSecondary: "#8E8675",
    textTertiary: "#4A4339",
    goldPrimary: "#C5A880",
    goldLight: "#E5D3B3",
  },
  spacing: {
    base: 8,
    cardPadding: 24,
    pillPaddingY: 3,
    pillPaddingX: 8,
  },
  borderRadius: {
    card: "6px",
    pill: "4px",
    progressBar: "2px",
  },
  heights: {
    progressBar: "3px",
  },
  shadows: {
    card: "0 1px 3px rgba(0,0,0,0.4)",
  },
  transitions: {
    default: "opacity 0.2s ease",
  },
  typography: {
    label: {
      fontFamily: "var(--font-geist-sans)",
      fontSize: "11px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
    },
    number: {
      fontFamily: "var(--font-geist-mono)",
      fontVariantNumeric: "tabular-nums",
      fontFeatureSettings: '"tnum"',
    },
    body: {
      fontFamily: "var(--font-geist-sans)",
    },
  },
};
