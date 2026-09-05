# EngHub Phase B0 — Full UI/UX Audit Report

**Project:** EngHub (TNU Platform)  
**Date:** 2026-09-04  
**Scope:** Frontend only (`src/`, `index.html`, `vite.config.ts`, `src/index.css`)  
**Constraint:** Backend, database, API contracts, and business logic are out of scope and untouched.

---

## 1. Inventory of Existing UI Patterns

### 1.1 Button Styles
| Pattern | Where Used | Classes (representative) |
|---|---|---|
| Primary (indigo) | `App.tsx:1414`, `CommunityView.tsx:427`, `CourseWorkspace.tsx:684` | `px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 min-h-[42px]` |
| Secondary (slate) | `ConfirmModal.tsx:116`, `Header.tsx:386` | `px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs` |
| Ghost | `Header.tsx:248`, `Toast.tsx:58` | `p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors` |
| Success (emerald) | `StudyToolsView.tsx:209`, `ConfirmModal.tsx:121` | `px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all` |
| Danger (rose) | `ConfirmModal.tsx:121`, `CourseWorkspace.tsx:240` | `px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all` |
| Warning/Attention (amber/orange gradient) | `App.tsx:1305`, `Sidebar.tsx:199` | `px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg` |
| CTA (orange gradient) | `App.tsx:1305`, `CourseWorkspace.tsx:262`, `CampusHubView.tsx:842` | `bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-md` |
| Nav item (sidebar) | `Sidebar.tsx:111`, `Sidebar.tsx:156` | `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all` |
| Tab button | `ScrollableTabs.tsx:232` | `flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0` |
| Chip/filter | `CommunityView.tsx:318`, `CampusHubView.tsx:321` | `px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all` |

### 1.2 Card Styles
| Pattern | Where Used | Classes (representative) |
|---|---|---|
| Base card | `DashboardView.tsx:200`, `StudyToolsView.tsx:163` | `p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2` |
| Elevated card (hero) | `App.tsx:1568`, `CourseWorkspace.tsx:277` | `p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xl` |
| Flat card | `StudyToolsView.tsx:251`, `DashboardView.tsx:380` | `p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950` |
| Accent card (indigo) | `CommunityView.tsx:536` | `bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-500/30` |
| Accent card (amber) | `App.tsx:1275` | `p-4 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-xl` |
| Interactive hover card | `App.tsx:1425`, `CourseWorkspace.tsx:545` | `rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden ... group hover:border-amber-500/50 transition-all` |
| Post card (community) | `CommunityView.tsx:534` | `bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-500/30` |
| Event card | `CampusHubView.tsx:364` | `rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all` |
| Marketplace card | `CampusHubView.tsx:757` | `p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3` |

### 1.3 Modal / Overlay / Bottom Sheet Styles
| Pattern | Where Used | Classes (representative) |
|---|---|---|
| Full-screen modal overlay | `AuthModal.tsx:223`, `UploadModal.tsx:193` | `fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md` |
| Modal content panel | `ConfirmModal.tsx:67`, `AuthModal.tsx:230` | `relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6` |
| Bottom sheet | `BottomSheet.tsx:51`, `BottomSheet.tsx:70` | `fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4` + `relative z-10 w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl border-t md:border border-slate-200 dark:border-slate-800 shadow-2xl` |
| Dropdown menu | `Header.tsx:142`, `Header.tsx:330` | `absolute top-full ltr:left-0 rtl:right-0 mt-2 w-60 sm:w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-1.5 z-50` |

### 1.4 Badge Styles
| Pattern | Where Used | Classes (representative) |
|---|---|---|
| Status pill (amber) | `DashboardView.tsx:107`, `CourseWorkspace.tsx:288` | `px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30` |
| Category chip | `CourseWorkspace.tsx:555`, `CommunityView.tsx:584` | `text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300` |
| Verification badge | `CourseWorkspace.tsx:559-584` | `text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30` |
| Priority badge | `DashboardView.tsx:166`, `CampusHubView.tsx:253` | `text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border` |
| Notification count | `Header.tsx:288` | `absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center shadow-xs font-mono` |
| Role badge | `Header.tsx:340` | `text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase` |

### 1.5 Color Values (Observed)
- **Neutral base:** `slate-50` → `slate-950`, `white`, `black`
- **Primary accent:** `indigo-500/600/700/900/950`, `purple-600`
- **Attention/warning:** `amber-400/500/600`, `orange-500/600`, `yellow-400/500`
- **Success:** `emerald-500/600/700`, `teal-500/600`, `cyan-400/500`
- **Error/danger:** `rose-500/600`, `red-500/600`
- **Info:** `blue-500/600/900`, `sky-400`

### 1.6 Spacing Values (Observed)
- **Padding:** `p-1`, `p-1.5`, `p-2`, `p-2.5`, `p-3`, `p-3.5`, `p-4`, `p-5`, `p-6`, `p-8`
- **Vertical padding:** `py-1`, `py-1.5`, `py-2`, `py-2.5`, `py-3`, `py-3.5`, `py-4`, `py-5`, `py-6`, `py-8`
- **Horizontal padding:** `px-2`, `px-2.5`, `px-3`, `px-3.5`, `px-4`, `px-5`, `px-6`, `px-8`
- **Margins/gaps:** `mb-6`, `mt-1`, `mt-2`, `mt-4`, `mt-6`, `gap-1` → `gap-6`, `space-y-1` → `space-y-6`

### 1.7 Border-Radius Values (Observed)
- `rounded-none` (AuthModal mobile)
- `rounded-lg` (rare)
- `rounded-xl` (most common for buttons, inputs, small cards, dropdowns)
- `rounded-2xl` (most common for cards, modals)
- `rounded-3xl` (hero cards, large sections)
- `rounded-full` (pills, avatars)

### 1.8 Shadow Styles (Observed)
- `shadow-xs` (common on cards)
- `shadow-sm` (common on cards and buttons)
- `shadow-md` (hover states, CTAs)
- `shadow-lg` (CTAs, buttons with glow)
- `shadow-xl` (hero cards, modals)
- `shadow-2xl` (modals, dropdowns)

### 1.9 Z-Index Scale (Observed)
| Value | Usage |
|---|---|
| `z-10` | Content within modals, gradient overlays |
| `z-20` | Dropdown backdrop, sticky tab bar |
| `z-30` | Sticky header |
| `z-40` | Mobile bottom navigation |
| `z-50` | Modals, dropdowns, toast container, command palette |
| `z-[100]` | Notification center outer wrapper |
| `z-[101]` | Notification center inner panel |

---

## 2. Inconsistencies Found

### 2.1 Card Styles
- **No single canonical card class.** `DashboardView` uses `p-4 rounded-2xl border ... shadow-sm`, `CourseWorkspace` uses `p-5 sm:p-6 rounded-3xl ... shadow-sm`, `CampusHubView` uses `p-5 rounded-2xl ... shadow-sm`, `CommunityView` uses `p-5 sm:p-6 rounded-2xl ... shadow-xs`. Padding, radius, and shadow vary by author and view.
- **Flat cards** (`bg-slate-50 dark:bg-slate-950`) appear in `StudyToolsView.tsx:179`, `DashboardView.tsx:380` but not in other views.
- **Accent-colored cards** exist in `CommunityView` (indigo hover border) and `App.tsx` (amber/indigo gradient banner) but no shared accent-card utility.

### 2.2 Button Styles
- **Primary button sizing varies:** `min-h-[40px]` in `tokens.ts`, `min-h-[42px]` in `App.tsx:1414`, `min-h-[44px]` in `CourseWorkspace.tsx:684`. No single source of truth.
- **Button font sizes vary:** `text-xs`, `text-xs sm:text-sm`, `text-[10px]` used inconsistently.
- **Button padding varies:** `px-4 py-2.5`, `px-3 py-2`, `px-3.5 py-2`, etc.
- **Gradient buttons use different directions:** `from-indigo-600 to-blue-600` (`Header.tsx:394`) vs. `from-indigo-600 via-indigo-700 to-purple-600` (`tokens.ts:11`).

### 2.3 Modal Styles
- **ConfirmModal** uses `rounded-3xl` while `AuthModal` uses `rounded-none sm:rounded-2xl` and `UploadModal` uses `rounded-2xl`.
- **Backdrop blur intensity varies:** `backdrop-blur-md` vs. `backdrop-blur-sm` vs. `backdrop-blur-xs` (non-standard).
- **Modal overlay background varies:** `bg-slate-950/70`, `bg-slate-950/60`, `bg-slate-950/75`.

### 2.4 Input Styles
- **No shared input utility.** Each view reimplements inputs:
  - `CourseWorkspace.tsx:449` uses `focus:ring-2 focus:ring-orange-500`
  - `CommunityView.tsx:445` uses `focus:ring-2 focus:ring-indigo-500`
  - `UploadModal.tsx:309` uses `focus:ring-2 focus:ring-orange-500`
  - `AuthModal.tsx:339` uses `focus:ring-2 focus:ring-amber-500`
- **Focus ring colors are not consistent** across the app (indigo, amber, orange).

### 2.5 Badge / Chip Styles
- **No shared badge component.** Badges are copy-pasted inline with varying sizes, colors, and border treatments.
- **Font sizes vary:** `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xs` for badges.
- **Padding varies:** `px-1 py-0.5`, `px-1.5 py-0.5`, `px-2 py-0.5`, `px-2.5 py-0.5`, `px-2 py-1`.

### 2.6 Icon Container Styles
- **Icon containers vary by view:** `DashboardView` uses `w-8 h-8 rounded-lg`, `CourseWorkspace` uses `w-11 h-11 rounded-2xl`, `EmptyState` uses `w-14 h-14 rounded-2xl`, `CommunityView` uses `w-8 h-8 rounded-xl`. No canonical icon-container size.

### 2.7 Tab Styles
- **ScrollableTabs** has three variants (`pills`, `segmented`, `underline`) but `segmented` uses `emerald-600` while the rest of the brand uses `indigo`/`amber`. This creates a visual disconnect.
- **Active tab styles vary:** `bg-emerald-600 text-white` (ScrollableTabs) vs. `bg-slate-900 text-white` (Sidebar) vs. `bg-indigo-600 text-white` (CourseWorkspace buttons).

### 2.8 Gradient Usage
- **Gradients are overused as backgrounds** in some places (e.g., `App.tsx:1275` full-width gradient banner, `CourseWorkspace.tsx:277` full banner, `AdminModerationView.tsx:826` full-width gradient).
- **Gradient direction varies:** `from-indigo-900/90 via-indigo-950 to-slate-900` vs. `from-slate-900 via-indigo-950 to-slate-900` vs. `from-amber-500 to-amber-600`.

### 2.9 Dark Mode Surface Values
- **Dark surfaces are inconsistent:** `dark:bg-slate-900`, `dark:bg-slate-900/90`, `dark:bg-slate-950`, `dark:bg-slate-950/95`, `dark:bg-slate-950/80`. No canonical dark surface token.
- **Dark border values are inconsistent:** `dark:border-slate-800`, `dark:border-slate-800/80`, `dark:border-slate-800/60`, `dark:border-slate-800/40`.

---

## 3. Duplicated Logic / Markup

### 3.1 Card Component (Copy-Pasted)
The "stat card" pattern from `DashboardView.tsx:200-251` is repeated with minor variations in:
- `StudyToolsView.tsx:163-219` (assignments card)
- `StudyToolsView.tsx:227-267` (calendar card)
- `StudyToolsView.tsx:273-317` (graduation card)
- `AdminAuditDashboard.tsx` (multiple metric cards)
- `HonorBoardView.tsx` (multiple stat cards)

All share the same internal structure: icon container + label + value + subtitle, but each reimplements it inline.

### 3.2 Input Component (Copy-Pasted)
The standard input pattern is repeated in:
- `UploadModal.tsx` (8+ inputs with identical classes)
- `AuthModal.tsx` (6+ inputs with identical classes)
- `CourseWorkspace.tsx:449-486` (search + selects)
- `CommunityView.tsx:440-499` (search + selects)
- `CampusHubView.tsx:296-304` (search)
- `AdminAuditDashboard.tsx` (multiple inputs)

### 3.3 Button Component (Copy-Pasted)
The "primary CTA" button pattern is repeated in:
- `App.tsx:1414`, `App.tsx:1579`, `App.tsx:1305`
- `CourseWorkspace.tsx:684`, `CourseWorkspace.tsx:725`
- `CommunityView.tsx:427`, `CommunityView.tsx:519`, `CommunityView.tsx:777`
- `CampusHubView.tsx:504`, `CampusHubView.tsx:869`
- `AdminModerationView.tsx` (multiple primary buttons)

### 3.4 Icon Container (Copy-Pasted)
The "icon in colored container" pattern is repeated in:
- `DashboardView.tsx:205-207`, `223-225`, `241-243` (3 instances)
- `CourseWorkspace.tsx:550` (file type icon)
- `EmptyState.tsx:29` (larger variant)
- `ErrorState.tsx:25` (rose variant)
- `CommunityView.tsx:412` (indigo variant)

### 3.5 Error/Empty State (Copy-Pasted)
`EmptyState` and `ErrorState` exist as shared components, but ad-hoc empty states are still inline in `CommunityView.tsx:505-523` and `CampusHubView.tsx:349-351`.

### 3.6 Modal Structure (Copy-Pasted)
Every modal reimplements the same overlay + panel + close button pattern:
- `AuthModal.tsx`, `UploadModal.tsx`, `ConfirmModal.tsx`, `AIAssistantModal.tsx`, `ProfileModal.tsx`, `OnboardingModal.tsx`, `BottomSheet.tsx`, `EventDetailsModal.tsx`

---

## 4. Current Responsive Behavior

### 4.1 Breakpoints in Use
- `sm:` (640px) — `px-3 sm:px-4`, `text-xs sm:text-sm`, `grid-cols-1 sm:grid-cols-2`
- `md:` (768px) — `md:flex`, `md:hidden`, `md:pb-8`, `md:grid-cols-2`
- `lg:` (1024px) — `lg:px-8`, `lg:w-80`, `lg:grid-cols-3`, `lg:block`
- `xl:` (1280px) — `xl:grid-cols-4`

### 4.2 Mobile Layout
- **Sidebar collapses to bottom nav** on `< md` (mobile). The bottom nav is `fixed bottom-0 left-0 right-0 z-40` with `md:hidden`.
- **Header actions collapse:** Language toggle, dark mode, notifications, and AI button remain visible. Search collapses to icon-only.
- **Content padding adjusts:** `px-3 sm:px-4 lg:px-8`, `pb-28 md:pb-8` (extra padding on mobile to clear bottom nav).

### 4.3 Tablet Layout
- **Sidebar expands** at `md:` (16px width) with labels hidden until `lg:`.
- **Grid layouts** switch from 1-col to 2-col at `md:` for most card grids.

### 4.4 Desktop Layout
- **Full sidebar** at `lg:` (64px → 256px with labels).
- **Max-width container** `max-w-7xl mx-auto` for main content.

### 4.5 Responsiveness Gaps
- **No `xl:` (1280px) breakpoint is consistently used.** Some views use `xl:grid-cols-4` (Dashboard), but most stop at `lg:`.
- **No `2xl:` (1536px) breakpoint usage.** On very large screens (1440px+), the layout may feel sparse but does not break.
- **Mobile bottom nav** uses `overflow-x-auto` which can feel cramped on 375px devices with many nav items.
- **No dedicated mobile-optimized layouts** for admin views (AdminModerationView, AdminAuditDashboard) — they appear to be desktop-first layouts that shrink.

---

## 5. Current State Coverage

### 5.1 Loading States
- **Global:** None. The app uses optimistic UI and immediate mock data rendering.
- **Per-component:** Minimal. `NotificationCenter.tsx` has `isLoading` state but no dedicated loading UI is visible in the read content. `AdminAuditDashboard.tsx` has loading state but no skeleton.

### 5.2 Empty States
- **Well-covered:** `EmptyState.tsx` is a reusable component used in `CourseWorkspace`, `StudyToolsView`, and potentially others.
- **Ad-hoc empty states:** `CommunityView.tsx:505-523` has an inline empty state. `CampusHubView.tsx:349-351` has an inline empty state. These should use the shared `EmptyState` component.

### 5.3 Error States
- **Well-covered:** `ErrorState.tsx` exists as a reusable component.
- **ErrorBoundary:** `ErrorPages.tsx` exports `ErrorBoundary` wrapping `main` in `App.tsx:1272`.
- **404/500 pages:** `NotFoundView` and `ServerErrorView` exist.

### 5.4 Missing States
- **No skeleton/loading shimmer** anywhere in the app.
- **No optimistic loading indicator** for button actions (most buttons have no loading state).
- **No "partial data" state** — if some API calls fail and others succeed, there's no merged state handling.

---

## 6. Arabic / Bilingual Typography Issues

### 6.1 What Currently Works
- **Font pairing:** Cairo (Arabic) + Plus Jakarta Sans (Latin) + JetBrains Mono (mono) is well-chosen and loaded correctly.
- **`.course-code` utility:** `direction: ltr; unicode-bidi: isolate; font-family: var(--font-mono);` correctly isolates Latin course codes in RTL flow.
- **`font-feature-settings: "cv02", "cv03", "cv04", "cv11", "tnum"`** on body enables nice Arabic typographic features and tabular figures.
- **`<bdi>` elements** are used in some places (e.g., `DashboardView.tsx:113`) for isolated text.

### 6.2 Issues Found
- **Inconsistent use of `dir="ltr"` / `<bdi>` for Latin codes:**
  - `DashboardView.tsx:113` uses `<bdi>{user?.name || "Student"}</bdi>` — but user names can be Arabic or Latin.
  - `CommunityView.tsx:591` uses `<span className="... course-code">{post.courseCode}</span>` — correct.
  - `CourseWorkspace.tsx:289` uses `className="dir-ltr text-xs..."` for course code — correct.
  - **But many places use raw Latin text without isolation:** dates like `"Fall 2026"`, `"Mon/Wed 10:00 - 11:30 AM"`, `"AIE 103"`, `"C++"` appear inline without `dir="ltr"` or `<bdi>`, which can cause RTL misalignment.

- **Mixed-direction text in badges:**
  - `DashboardView.tsx:108` shows `{activeDept ? activeDept.name : t.common.appName}` inside a badge — if the department name is Arabic but the badge context is LTR, alignment can shift.
  - `CourseWorkspace.tsx:166-169` has `anc.priority === "urgent" ? "🔥 إعلان رسمي عاجل" : "📢 إعلان هام"` — emoji + Arabic in what might be an LTR context.

- **Numbers in Arabic text:**
  - `DashboardView.tsx:211` shows `{userCourses.length}` inside RTL Arabic sentence — numbers display correctly but can cause line-breaking issues in narrow containers.
  - `StudyToolsView.tsx:187` shows `{asgn.courseCode}` in Arabic text without explicit isolation.

- **Font fallback chain:**
  - `--font-latin` falls back to `system-ui` which on some systems may not include Arabic glyphs. If Plus Jakarta Sans fails to load, Latin text may render in system-ui while Arabic falls back to Cairo — this is acceptable but not ideal.

---

## 7. Summary of Key Findings

### High-Impact Inconsistencies
1. **No single card/button/input/badge utility** — these are copy-pasted across 10+ components with minor variations.
2. **Focus ring colors vary** (indigo, amber, orange) — should be one brand color.
3. **Tab active states use different accent colors** (emerald in ScrollableTabs, indigo in CourseWorkspace, slate in Sidebar).
4. **Dark mode surface values are inconsistent** (`slate-900`, `slate-900/90`, `slate-950`, `slate-950/95`).
5. **Border radius values vary** (`xl` for buttons, `2xl` for cards, `3xl` for hero sections) but no documented rule for which tier applies to which element type.
6. **Spacing values are arbitrary** — `p-3.5`, `py-2.5`, `gap-1.5`, `space-y-3.5` appear throughout instead of drawing from a consistent scale.
7. **Latin/RTL isolation is inconsistent** — course codes and technical terms sometimes break flow.

### Opportunities for Tokenization
1. **Card styles** can be collapsed into 3-4 variants (base, elevated, flat, accent).
2. **Button styles** can be collapsed into primary, secondary, ghost, danger, success, and CTA-gradient.
3. **Input styles** can be a single shared pattern.
4. **Badge styles** can be a shared component with semantic variants.
5. **Icon containers** can be sized consistently (sm, md, lg).
6. **Modal/overlay patterns** can be unified.
7. **Focus ring color** should be amber (the existing brand accent) across all interactive elements.

---

*End of Phase B0 Audit Report*
