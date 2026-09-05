# B6 Design System, Dark Mode & UI/UX Report

## 1. Executive Summary

B6 hardened the existing B1 token architecture rather than introducing a second
theme system. Dark and light themes now resolve from the root `html` element,
persist through refresh/navigation, initialize before React mounts, and expose
theme-safe surface, text, border, semantic, overlay, and native-control styles.

## 2. Dark Mode Root Cause

Theme state lives in `App.tsx` as `isDarkMode`. `true` represents dark mode and
`false` represents light mode. The value is persisted as `dark` or `light` in
`localStorage["enghub_theme"]`, and the `.dark` class is applied to
`document.documentElement` (`html`).

The regression was the selector `:where(:not(.dark))` in `index.css`. It matched
nearly every descendant that did not itself have a `dark` class and reassigned
the light token variables there. As a result, dark descendants could inherit
light values despite the correct `.dark` class on `html`. It is now scoped to
`:root:not(.dark)`, so light overrides apply only to the theme root.

## 3. Theme Architecture Before

- B1 variables were defined in `index.css`.
- `App.tsx` toggled `.dark` after the first React render.
- Light overrides used a descendant-matching `:where(:not(.dark))` selector.
- Several shared components used literal or dark-only semantic colors.
- Modal backdrop and native controls did not consume theme tokens consistently.

## 4. Theme Architecture After

- `main.tsx` reads persisted theme state before mounting React.
- `html.dark` is the single runtime theme marker.
- `:root:not(.dark)` owns light overrides; dark values remain the root default.
- Components consume `ehb` semantic utility classes for shared states.
- `color-scheme`, selection, overlays, focus-ring offsets, and native controls
  follow the active theme.

## 5. Token Changes

Added or exposed:

- Theme-aware modal overlay tokens.
- Success, warning, error, and information semantic colors and borders.
- Light-theme semantic foreground, hover, subtle, and border values.
- Backwards-compatible `text-ehb-text-primary` and `text-ehb-text-muted`
  aliases used by existing components.
- Theme-aware semantic hover background utilities and ring offset utility.

## 6. Dark Theme Palette

| Role | Value |
| --- | --- |
| Background | `#020617` |
| Surface | `#0f172a` |
| Surface elevated | `#1e293b` |
| Interactive elevated | `#334155` |
| Primary text | `#f8fafc` |
| Muted text | `#94a3b8` |
| Primary | `#f59e0b` |
| Overlay | `rgb(2 6 23 / 0.78)` |

## 7. Light Theme Palette

| Role | Value |
| --- | --- |
| Background | `#f8fafc` |
| Surface | `#ffffff` |
| Surface elevated | `#f1f5f9` |
| Interactive elevated | `#e2e8f0` |
| Primary text | `#0f172a` |
| Muted text | `#64748b` |
| Primary | `#f59e0b` |
| Overlay | `rgb(15 23 42 / 0.5)` |

## 8. Component Theme Audit

Shared B2 components were reviewed. `Card`, `Input`, `Textarea`, `Select`,
`Skeleton`, `Avatar`, `Divider`, `Modal`, `Dropdown`, and `SearchField` already
consume surface/text/border tokens. `Button`, `Badge`, `IconContainer`,
`EmptyState`, `ErrorState`, and `Toast` were hardened to use theme-safe
semantic utilities for primary, success, warning, error, info, focus, and
notification states.

## 9. Page Theme Audit

The page-level audit covered dashboard, course workspace, community, study
tools, campus, admin, shared auth, modal, dropdown, loading, empty, error, and
toast surfaces through source inspection and runtime verification. Existing
literal colors that are intentionally content/brand-specific remain documented
below rather than being blindly replaced.

## 10. Hardcoded Color Audit

Remaining literal colors are intentional:

- `src/theme/tokens.ts` and `index.css`: canonical token definitions.
- `PomodoroFocusTimer.tsx`: SVG chart series colors, which encode distinct
  data categories rather than surfaces.
- Course/image and hero treatments: intentional brand/content presentation.
- White text on dark brand buttons, badges, and image overlays: intentional
  foreground contrast.
- Slate/indigo/amber literals in legacy page-specific content: retained where
  they are intentional branded or content states; shared primitives no longer
  depend on them for theme surfaces.

## 11. Accessibility

Primary and muted text remain theme-specific. Focus rings use amber and their
offset now follows the active background. Disabled controls retain visible
content with opacity and cursor affordances. Semantic states use both icon/text
and color. Native controls advertise the active `color-scheme`.

## 12. RTL/Bidi

No direction, language, course-code, numeric, or bidi utilities were changed.
Existing RTL/LTR and bidi isolation behavior remains intact.

## 13. Responsive

No responsive layout behavior was changed. Existing responsive breakpoints and
mobile navigation remain unchanged; theme initialization is viewport-independent.

## 14. Theme Persistence

On first load, `main.tsx` reads `enghub_theme` before React mounts. If absent or
invalid, dark mode remains the default. `App.tsx` keeps the class and storage
value synchronized when toggled. Browser verification confirmed both `dark` and
`light` survive the toggle path and expose matching computed token values.

## 15. Performance

No dependency was added. Theme work is one synchronous local-storage read before
mount and one existing state effect on toggle. No API calls, data loading, or
business logic were changed.

## 16. Tests

Executed:

- `npm run lint` — passed.
- `npm run build` — passed after the final shared-component token edits.
- `npx tsc --noEmit --skipLibCheck` — failed on pre-existing JavaScript files
  containing TypeScript syntax (`debug_schema.mjs` and `tests/persistence_test.mjs`);
  no changed frontend file was reported.
- `npx tsx tests/persistence_test.ts; npx tsx tests/regression_matrix.ts;
  npx tsx tests/security_audit.ts; npx tsx tests/upload_download_tests.ts` —
  persistence `41/41` passed, regression matrix `53/53` passed, upload/download
  `8/8` passed, and security `25/26` passed. The single security failure was
  the existing production-cookie `Secure` assertion and is unrelated to B6
  frontend theme changes.

## 17. Visual Verification Matrix

| Area | Light | Dark | Mobile/Desktop |
| --- | --- | --- | --- |
| Header | PASS | PASS | Existing responsive layout |
| Sidebar | PASS | PASS | Existing responsive layout |
| Mobile navigation | PASS | PASS | Existing responsive layout |
| Dashboard surfaces | PASS | PASS | Existing responsive layout |
| Shared cards/forms | PASS | PASS | Existing responsive layout |
| Modal overlay/panel | PASS | PASS | Existing responsive layout |
| Dropdown | PASS | PASS | Existing responsive layout |
| Toast | PASS | PASS | Existing responsive layout |
| Loading/empty/error | PASS | PASS | Existing responsive layout |

Runtime checks confirmed `html.dark`, dark/light token values, `color-scheme`,
and local-storage persistence while switching themes in the running application.

## 18. Files Modified

- `src/index.css` — root scoping, semantic tokens, aliases, overlay, controls.
- `src/main.tsx` — pre-mount persisted theme initialization.
- `src/App.tsx` — removed hardcoded selection colors.
- `src/components/ui/Modal.tsx` — tokenized backdrop.
- `src/components/ui/Button.tsx` — tokenized primary/semantic buttons and focus.
- `src/components/ui/Badge.tsx` — theme-safe semantic badges.
- `src/components/ui/IconContainer.tsx` — theme-safe semantic icon surfaces.
- `src/components/common/EmptyState.tsx` — tokenized primary action.
- `src/components/common/ErrorState.tsx` — tokenized error state.
- `src/components/common/Toast.tsx` — theme-safe toast surfaces and controls.

## 19. Backend Integrity

No backend, Prisma schema, migration, authentication, authorization, or
business-logic files were changed by B6.

## 20. API Integrity

No API routes, request/response contracts, persistence calls, or API behavior
were changed by B6.

## 21. Regression Analysis

The root cause was the theme selector in the existing B1 CSS architecture, not
an API or backend regression. The runtime marker and persistence model were
already conceptually correct; the descendant-scoped light override defeated
them. The B6 fix preserves that architecture and corrects its scope.

## 22. Final Acceptance

**PASS for B6 frontend acceptance with documented pre-existing validation
exceptions:** runtime theme switching and persistence work, lint and build pass,
and all persistence/regression/upload-download checks pass. Workspace-wide
TypeScript checking remains blocked by pre-existing `.mjs` files containing
TypeScript syntax, and the security suite has one unrelated production-cookie
failure. No backend or API changes were introduced.
