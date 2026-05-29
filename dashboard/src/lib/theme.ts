export const THEME = {
  colors: {
    base: "#070708",       // Deep charcoal carbon
    surface: "#0D0D0E",    // Muted premium surface
    border: "#1E1E1E",     // Hairline graphite border
    borderActive: "#C5A880", // Gold border focus
    textPrimary: "#E5E5E7", // Bone white text
    textSecondary: "#807E78", // Muted clay text
    textTertiary: "#48484A", // Dark graphite text
    goldPrimary: "#C5A880", // Brushed gold highlight
    goldLight: "#E5D3B3",   // Cream light gold
  },
  spacing: {
    base: 8,
    cardPadding: 24,
    pillPaddingY: 3,
    pillPaddingX: 8,
  },
  borderRadius: {
    card: "0px",           // Razor sharp grid intersections
    pill: "2px",           // Minimal geometric pill radius
    progressBar: "0px",    // Sharp industrial bar lines
  },
  heights: {
    progressBar: "3px",
  },
  shadows: {
    card: "none",          // No floating card shadows, pure grid border boundaries
  },
  transitions: {
    default: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", // Premium expo transition
  },
  typography: {
    label: {
      fontFamily: "var(--font-geist-sans)",
      fontSize: "10px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.15em",
      fontWeight: "700",
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

