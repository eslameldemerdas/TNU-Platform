/**
 * EngHub Design System — Phase B1 Tokens
 *
 * Single source of truth for spacing, radius, shadows, borders, colors,
 * gradients, typography, motion, z-index, and breakpoints.
 *
 * IMPORTANT: This file only defines the tokens. Components must NOT be
 * modified in this phase. Future phases (B2+) will consume these tokens
 * to restyle components consistently.
 */

export const ENGHUB_TOKENS = {
  // =========================================================================
  // 1. SPACING SCALE (px / rem-equivalent)
  // =========================================================================
  spacing: {
    0: "0",
    1: "0.25rem",   // 4px
    2: "0.5rem",    // 8px
    3: "0.75rem",   // 12px
    4: "1rem",      // 16px
    5: "1.25rem",   // 20px
    6: "1.5rem",    // 24px
    8: "2rem",      // 32px
    10: "2.5rem",   // 40px
    12: "3rem",     // 48px
    16: "4rem",     // 64px
  } as const,

  // =========================================================================
  // 2. BORDER RADIUS SCALE
  // =========================================================================
  // Rule: buttons/inputs → sm, cards/modals → md, hero sections → lg,
  //        prominent CTAs/modals → xl. Avatars/pills → full.
  radius: {
    none: "0",
    sm: "0.5rem",    // 8px  — buttons, inputs, small controls
    md: "0.75rem",   // 12px — cards, modals, dropdowns (default)
    lg: "1rem",      // 16px — hero cards, large sections
    xl: "1.25rem",   // 20px — prominent modals, CTAs
    full: "9999px",  // pills, avatars, toggle switches
  } as const,

  // =========================================================================
  // 3. SHADOWS (calm, subtle only — no glow, no neon)
  // =========================================================================
  shadows: {
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.04)",
  } as const,

  // =========================================================================
  // 4. BORDERS
  // =========================================================================
  // Single subtle border treatment: 1px solid at low opacity on the
  // neutral-200 / neutral-700 axis. Used where borders replace or augment
  // shadows (cards, inputs, dropdowns).
  border: {
    default: "1px solid rgb(203 213 225 / 0.6)",        // slate-200/60
    defaultDark: "1px solid rgb(51 65 85 / 0.5)",        // slate-700/50
    subtle: "1px solid rgb(203 213 225 / 0.4)",          // slate-200/40
    subtleDark: "1px solid rgb(51 65 85 / 0.35)",        // slate-700/35
    focus: "1px solid rgb(245 158 11 / 0.5)",            // amber-500/50 (brand focus ring)
    focusDark: "1px solid rgb(253 230 138 / 0.4)",       // amber-200/40
  } as const,

  // =========================================================================
  // 5. COLOR SYSTEM
  // =========================================================================
  // Dark mode is the default. Light mode is an explicit variant.
  // All text-on-surface combinations meet WCAG AA (4.5:1 for body,
  // 3:1 for large text).

  colors: {
    // --- Background (deep dark base) ---
    background: {
      DEFAULT: "#020617",           // slate-950 (near-black)
      light: "#f8fafc",             // slate-50
    },

    // --- Surface (one level up from background) ---
    surface: {
      DEFAULT: "#0f172a",           // slate-900
      light: "#ffffff",             // white
      // Elevated sub-surface (sidebar, sticky header)
      elevated: {
        DEFAULT: "rgba(15, 23, 42, 0.85)",  // slate-900/85 with backdrop-blur
        light: "rgba(255, 255, 255, 0.85)", // white/85 with backdrop-blur
      },
    },

    // --- Surface Elevated (cards/modals sitting above surface) ---
    surfaceElevated: {
      DEFAULT: "#1e293b",           // slate-800
      light: "#f1f5f9",             // slate-100
    },

    // --- Text ---
    text: {
      primary: {
        DEFAULT: "#f8fafc",         // slate-50 on dark
        light: "#0f172a",           // slate-900 on light
      },
      muted: {
        DEFAULT: "#94a3b8",         // slate-400 on dark
        light: "#64748b",           // slate-500 on light
      },
      inverse: {
        DEFAULT: "#020617",         // slate-950
        light: "#f8fafc",           // slate-50
      },
    },

    // --- Primary / Accent (warm amber/gold — existing brand identity) ---
    primary: {
      DEFAULT: "#f59e0b",           // amber-500
      hover: "#fbbf24",             // amber-400
      active: "#d97706",            // amber-600
      subtle: {
        DEFAULT: "rgba(245, 158, 11, 0.12)",   // amber-500/12
        light: "rgba(217, 119, 6, 0.08)",      // amber-600/8
      },
      textOnPrimary: "#0f172a",     // slate-900 (dark text on amber bg)
    },

    // --- Semantic Colors ---
    semantic: {
      success: {
        DEFAULT: "#10b981",         // emerald-500
        hover: "#34d399",           // emerald-400
        active: "#059669",          // emerald-600
        subtle: {
          DEFAULT: "rgba(16, 185, 129, 0.12)",   // emerald-500/12
          light: "rgba(5, 150, 105, 0.08)",      // emerald-600/8
        },
        textOnSuccess: "#ffffff",
      },
      warning: {
        DEFAULT: "#f59e0b",         // amber-500 (same as primary)
        hover: "#fbbf24",           // amber-400
        active: "#d97706",          // amber-600
        subtle: {
          DEFAULT: "rgba(245, 158, 11, 0.12)",   // amber-500/12
          light: "rgba(217, 119, 6, 0.08)",      // amber-600/8
        },
        textOnWarning: "#0f172a",
      },
      error: {
        DEFAULT: "#ef4444",         // red-500
        hover: "#f87171",           // red-400
        active: "#dc2626",          // red-600
        subtle: {
          DEFAULT: "rgba(239, 68, 68, 0.12)",    // red-500/12
          light: "rgba(220, 38, 38, 0.08)",      // red-600/8
        },
        textOnError: "#ffffff",
      },
    },

    // --- Neutral / Slate aliases (for convenience) ---
    slate: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
  } as const,

  // =========================================================================
  // 6. GRADIENTS — accent only, never default background
  // =========================================================================
  // Permitted uses: premium CTA, hero highlight, progress indicator,
  // selected state, AI-feature badge. NEVER full-background, NEVER on
  // every card, NEVER on every button.
  gradients: {
    primary: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)",        // indigo → purple
    primarySubtle: "linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(124,58,237,0.04) 50%, transparent 100%)",
    attention: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",                    // amber → orange
    attentionSubtle: "linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(249,115,22,0.05) 50%, transparent 100%)",
    success: "linear-gradient(135deg, #0d9488 0%, #10b981 100%)",                      // teal → emerald
    successSubtle: "linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(16,185,129,0.04) 50%, transparent 100%)",
    hero: "linear-gradient(135deg, #020617 0%, #1e1b4b 40%, #0f172a 100%)",            // near-black → indigo-950 → slate-900
  } as const,

  // =========================================================================
  // 7. TYPOGRAPHY SCALE
  // =========================================================================
  // Font pairing:
  //   --font-arabic  : Cairo (weights 400-900) — Arabic body & headings
  //   --font-latin   : Plus Jakarta Sans (weights 400-800) — Latin fallback
  //   --font-mono    : JetBrains Mono — course codes, stats, GPAs, years
  //
  // Technique for Arabic/Latin isolation:
  //   - Use `dir="ltr"` on inline spans containing Latin codes/terms
  //   - Use `unicode-bidi: isolate` (CSS class `.bdi-isolate`) on any
  //     inline element that mixes Arabic flow with Latin tokens
  //   - Use `font-family: var(--font-mono)` for course codes and years

  typography: {
    fontFamily: {
      arabic: "var(--font-arabic)",
      latin: "var(--font-latin)",
      mono: "var(--font-mono)",
      sans: "var(--font-arabic)",   // default
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }],        // 12px
      sm: ["0.875rem", { lineHeight: "1.25rem" }],     // 14px
      base: ["1rem", { lineHeight: "1.5rem" }],        // 16px
      lg: ["1.125rem", { lineHeight: "1.75rem" }],     // 18px
      xl: ["1.25rem", { lineHeight: "1.75rem" }],      // 20px
      "2xl": ["1.5rem", { lineHeight: "2rem" }],       // 24px
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }],  // 30px
      "4xl": ["2.25rem", { lineHeight: "2.5rem" }],    // 36px
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },
    // Semantic type styles (to be applied as component classes in B2+)
    styles: {
      h1: { fontSize: "var(--text-4xl)", fontWeight: "var(--font-black)", lineHeight: "var(--text-leading-tight)" },
      h2: { fontSize: "var(--text-2xl)", fontWeight: "var(--font-extrabold)", lineHeight: "var(--text-leading-tight)" },
      h3: { fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", lineHeight: "var(--text-leading-snug)" },
      body: { fontSize: "var(--text-base)", fontWeight: "var(--font-normal)", lineHeight: "var(--text-leading-relaxed)" },
      caption: { fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", lineHeight: "var(--text-leading-normal)" },
    },
  } as const,

  // =========================================================================
  // 8. MOTION TOKENS
  // =========================================================================
  // No animation should exceed what feels instant-but-smooth.
  motion: {
    duration: {
      instant: "75ms",
      fast: "150ms",
      normal: "200ms",
      smooth: "250ms",
      slow: "350ms",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",     // ease-out (standard)
      in: "cubic-bezier(0.4, 0, 1, 1)",             // ease-in
      out: "cubic-bezier(0, 0, 0.2, 1)",            // ease-out
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",        // ease-in-out
      spring: {
        damping: 28,
        stiffness: 300,
      },
    },
    // Standard transition presets
    transition: {
      fast: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
      normal: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      smooth: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      colors: "color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)",
      transform: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
      shadow: "box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    },
  } as const,

  // =========================================================================
  // 9. Z-INDEX SCALE
  // =========================================================================
  // All new components must draw from this scale. Arbitrary z-index values
  // are forbidden.
  zIndex: {
    base: 0,
    dropdown: 20,
    sticky: 30,
    mobileNav: 40,
    modal: 50,
    toast: 50,
    tooltip: 60,
    notificationOuter: 100,
    notificationInner: 101,
  } as const,

  // =========================================================================
  // 10. BREAKPOINTS
  // =========================================================================
  breakpoints: {
    xs: "375px",
    sm: "390px",
    md: "414px",
    lg: "768px",
    xl: "1024px",
    "2xl": "1440px",
  } as const,
} as const;

export type ENGHUBTokenSet = typeof ENGHUB_TOKENS;
