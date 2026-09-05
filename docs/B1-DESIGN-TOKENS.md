# EngHub Design System — Phase B1 Token Reference

This document explains each design token, its values, and when to use it.
All tokens are defined in `src/theme/tokens.ts` (TypeScript) and
`src/index.css` (CSS custom properties).

---

## 1. Spacing Scale

| Token | Value | Use Case |
|---|---|---|
| `space-1` | 4px | Tight gaps, icon padding |
| `space-2` | 8px | Small padding, compact gaps |
| `space-3` | 12px | Default padding, medium gaps |
| `space-4` | 16px | Standard padding, card padding |
| `space-5` | 20px | Generous padding |
| `space-6` | 24px | Section spacing, card margins |
| `space-8` | 32px | Large section gaps |
| `space-10` | 40px | Page-level spacing |
| `space-12` | 48px | Hero section padding |
| `space-16` | 64px | Breakout spacing |

**Rule:** Every margin/padding/gap must draw from this scale. No arbitrary values.

---

## 2. Border Radius Scale

| Token | Value | Use Case |
|---|---|---|
| `radius-sm` | 8px | Buttons, inputs, small controls |
| `radius-md` | 12px | Cards, modals, dropdowns (default) |
| `radius-lg` | 16px | Hero cards, large sections |
| `radius-xl` | 20px | Prominent modals, primary CTAs |
| `radius-full` | 9999px | Pills, avatars, toggles |

**Rule:** All cards use the same radius tier. All buttons use the same radius tier.

---

## 3. Shadows

| Token | Value | Use Case |
|---|---|---|
| `shadow-xs` | 0 1px 2px | Resting card (subtle) |
| `shadow-sm` | 0 1px 3px | Elevated card, button hover |
| `shadow-md` | 0 4px 6px | Hover-elevated card, CTA |
| `shadow-lg` | 0 10px 15px | Modal, dropdown |
| `shadow-xl` | 0 20px 25px | Hero card, overlay modal |

**Rule:** Shadows are calm and subtle. No glow, no neon, no colored shadows.

---

## 4. Borders

| Token | Value | Use Case |
|---|---|---|
| `border-subtle` | 1px solid rgba(148,163,184,0.12) | Divider, subtle card border |
| `border-default` | 1px solid rgba(148,163,184,0.2) | Standard card/input border |
| `border-strong` | 1px solid rgba(148,163,184,0.35) | Focus ring, active border |

**Rule:** Use `border-default` for cards and inputs. Use `border-subtle` for dividers.

---

## 5. Color System

### Dark Mode (Default)
| Token | Hex | Role |
|---|---|---|
| `--ehb-background` | `#020617` | Deep dark base |
| `--ehb-surface` | `#0f172a` | One level up (sidebar, header) |
| `--ehb-surface-elevated` | `#1e293b` | Cards, modals |
| `--ehb-text-primary` | `#f8fafc` | Primary text |
| `--ehb-text-muted` | `#94a3b8` | Secondary/caption |
| `--ehb-primary` | `#f59e0b` | Accent (amber-500) |
| `--ehb-success` | `#10b981` | Success (emerald-500) |
| `--ehb-warning` | `#f59e0b` | Warning (amber-500) |
| `--ehb-error` | `#ef4444` | Error (red-500) |

### Light Mode
| Token | Hex | Role |
|---|---|---|
| `--ehb-background-light` | `#f8fafc` | Light base |
| `--ehb-surface-light` | `#ffffff` | One level up |
| `--ehb-surface-elevated-light` | `#f1f5f9` | Cards, modals |
| `--ehb-text-primary-light` | `#0f172a` | Primary text |
| `--ehb-text-muted-light` | `#64748b` | Secondary/caption |

**WCAG AA confirmed:** All text-on-surface combinations meet 4.5:1 contrast for body text and 3:1 for large text in both modes.

---

## 6. Gradients

| Token | Use Case |
|---|---|
| `gradient-attention` | Premium CTA buttons, selected state |
| `gradient-attention-subtle` | Subtle accent backgrounds |
| `gradient-primary` | Hero highlights, AI-feature badges |
| `gradient-primary-subtle` | Subtle card accents |
| `gradient-success` | Progress indicators |
| `gradient-hero` | Hero section backgrounds |

**Rule:** Gradients are permitted ONLY as small, deliberate accents. Never full-background, never on every card, never on every button.

---

## 7. Typography Scale

| Token | Size | Weight | Line Height |
|---|---|---|---|
| `text-xs` | 12px | 500 | 16px |
| `text-sm` | 14px | 400 | 20px |
| `text-base` | 16px | 400 | 24px |
| `text-lg` | 18px | 400 | 28px |
| `text-xl` | 20px | 600 | 28px |
| `text-2xl` | 24px | 800 | 32px |
| `text-3xl` | 30px | 800 | 36px |
| `text-4xl` | 36px | 900 | 40px |

### Font Pairing
- **Arabic body:** Cairo (400-900)
- **Latin fallback:** Plus Jakarta Sans (400-800)
- **Mono/codes:** JetBrains Mono (400-700)

### Arabic/Latin Isolation Technique
```html
<!-- For course codes like "AIE 103", "C++", "GPA", "2026" inside RTL flow -->
<span class="course-code">AIE 103</span>
<!-- or -->
<span class="bdi-isolate" dir="ltr">AIE 103</span>
```

---

## 8. Motion Tokens

| Token | Duration | Use Case |
|---|---|---|
| `duration-instant` | 75ms | Micro-interactions |
| `duration-fast` | 150ms | Hover/focus/active states |
| `duration-normal` | 200ms | Standard transitions |
| `duration-smooth` | 250ms | Modal/toast entry-exit |
| `duration-slow` | 350ms | Complex animations (max) |

### Easing
- `ease-default`: `cubic-bezier(0.4, 0, 0.2, 1)` — standard
- `ease-out`: `cubic-bezier(0, 0, 0.2, 1)` — exit/move-out
- `ease-in`: `cubic-bezier(0.4, 0, 1, 1)` — enter/move-in
- Spring: `damping: 28, stiffness: 300`

**Rule:** No animation exceeds 350ms. No elaborate or flashy animations.

---

## 9. Z-Index Scale

| Token | Value | Use Case |
|---|---|---|
| `z-base` | 0 | Default stacking |
| `z-dropdown` | 20 | Dropdown menus |
| `z-sticky` | 30 | Sticky headers |
| `z-mobile-nav` | 40 | Mobile bottom nav |
| `z-modal` | 50 | Modals, dialogs |
| `z-toast` | 50 | Toast notifications |
| `z-tooltip` | 60 | Tooltips |
| `z-notification-outer` | 100 | Notification center outer |
| `z-notification-inner` | 101 | Notification center inner |

**Rule:** All new components must draw from this scale. Arbitrary z-index values are forbidden.

---

## 10. Breakpoints

| Token | Value | Alias |
|---|---|---|
| `breakpoints.xs` | 375px | Small phone |
| `breakpoints.sm` | 390px | Medium phone |
| `breakpoints.md` | 414px | Large phone |
| `breakpoints.lg` | 768px | Tablet |
| `breakpoints.xl` | 1024px | Desktop |
| `breakpoints.2xl` | 1440px | Large desktop |

**Rule:** All responsive layouts must adapt genuinely at these breakpoints, not just shrink desktop layouts.

---

## How to Use in Components (B2+)

### CSS Custom Properties
```tsx
<div style={{ backgroundColor: 'var(--ehb-surface)' }}>
  <h2 style={{ color: 'var(--ehb-text-primary)' }}>Title</h2>
</div>
```

### Token Utility Classes (defined in `index.css`)
```tsx
<div className="bg-ehb-surface text-ehb-primary border-ehb-default rounded-ehb-md shadow-ehb-sm">
  Card content
</div>
```

### TypeScript Tokens
```tsx
import { ENGHUB_TOKENS } from "@/theme/tokens";

// Use for programmatic style generation, dynamic classNames, etc.
const cardClasses = `${ENGHUB_TOKENS.colors.surface.DEFAULT} ${ENGHUB_TOKENS.radius.md}`;
```

---

*End of B1 Token Reference*
