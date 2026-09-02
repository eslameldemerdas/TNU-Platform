/**
 * EngHub Design System Tokens
 * Defines consistent tokens for colors, subtle gradients, cards, micro-interactions, and badges.
 * Built for a premium academic engineering platform.
 */

export const ENGHUB_TOKENS = {
  // Gradients (Accents only, not base backgrounds)
  gradients: {
    // Primary: Indigo -> Purple
    primary: "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600",
    primarySubtle:
      "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20",
    primaryHero: "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900",

    // Success / Academic Progress: Teal -> Emerald
    success: "bg-gradient-to-r from-teal-600 to-emerald-600",
    successSubtle: "bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20",

    // Attention / Highlights: Orange -> Amber
    attention: "bg-gradient-to-r from-amber-600 to-orange-600",
    attentionSubtle: "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20",
  },

  // Premium Card Styling Variants
  cards: {
    base: "bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs transition-all duration-200",
    hover:
      "hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:shadow-md dark:hover:shadow-indigo-950/20 hover:-translate-y-0.5",
    interactive:
      "bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:shadow-md dark:hover:shadow-indigo-950/20 transition-all duration-200 cursor-pointer active:scale-[0.99]",
    flat: "bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl",
    elevated:
      "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl",
    accentPrimary:
      "bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 rounded-2xl",
    accentSuccess:
      "bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 rounded-2xl",
    accentWarning:
      "bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl",
  },

  // Icon Containers
  icons: {
    primary:
      "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0",
    success:
      "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0",
    warning:
      "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0",
    neutral:
      "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center shrink-0",
  },

  // Buttons & CTAs
  buttons: {
    primary:
      "px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow-md hover:shadow-indigo-600/20 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] flex items-center justify-center gap-2",
    secondary:
      "px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all duration-150 active:scale-95 min-h-[40px] flex items-center justify-center gap-2",
    ghost:
      "p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors",
    success:
      "px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all duration-150 active:scale-95 min-h-[40px] flex items-center justify-center gap-2",
  },

  // Micro-interaction durations
  transitions: {
    fast: "transition-all duration-150 ease-out",
    normal: "transition-all duration-200 ease-out",
    smooth: "transition-all duration-300 ease-in-out",
  },
};
