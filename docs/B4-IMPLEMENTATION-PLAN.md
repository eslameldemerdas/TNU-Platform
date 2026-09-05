# EngHub Phase B4 — Core Experience Implementation Plan

**Date:** 2026-09-04  
**Scope:** Student-facing page redesign using B1 tokens and B2 components.  
**Source of Truth:** `docs/B0-AUDIT-REPORT.md`, `docs/B1-DESIGN-TOKENS.md`, `docs/B2-CORE-COMPONENT-REPORT.md`, `docs/B3-GLOBAL-LAYOUT-NAVIGATION-REPORT.md`, `src/theme/tokens.ts`, `src/index.css`, `src/components/ui/*`

---

## 1. Discovery Summary

### Pages Modified
1. `src/components/dashboard/DashboardView.tsx` — Dashboard
2. `src/components/courses/CourseWorkspace.tsx` — Course workspace, materials, discussions
3. `src/components/community/CommunityView.tsx` — Community posts & discussions
4. `src/components/study/ExamsQuizzesEngine.tsx` — Exams/quizzes engine
5. `src/components/study/StudyToolsView.tsx` — Study tools (assignments, calendar, graduation)
6. `src/components/campus/CampusHubView.tsx` — Campus hub (announcements, events, marketplace, lost & found, clubs)

### Pages NOT Modified (Out of Scope for B4)
- Admin views (`AdminModerationView.tsx`, `AdminAuditDashboard.tsx`)
- AI Assistant modal (`AIAssistantModal.tsx`)
- Notification center (`NotificationCenter.tsx`)
- Auth/Profile/Upload modals
- Error pages (`NotFoundView`, `ServerErrorView`)

---

## 2. B4.1 — Dashboard Redesign

### Current State
- Welcome banner with gradient background
- Pinned announcements with amber/rose badges
- 3 stat cards (enrolled courses, pending assignments, reward points) using `<Card>` + `<IconContainer>` (B2 already adopted)
- Course cards grid (4 max) with hover lift
- Today's schedule list
- Upcoming deadlines list
- Recent files feed with preview buttons

### Target Improvements
1. **Hierarchy:** Welcome banner becomes a compact context strip (no heavy gradient). Priority actions surface immediately.
2. **Stat Cards:** Already using B2 `<Card>` + `<IconContainer>`. Keep but standardize spacing and add subtle `border-ehb-default`.
3. **Course Cards:** Replace inline `motion.div` + custom classes with `<Card variant="interactive">` + consistent image/badge treatment. Preserve hover behavior.
4. **Schedule & Deadlines:** Use `<Card>` for containers. Use `<Badge>` for course codes and status pills. Standardize empty/loading states.
5. **Recent Files:** Use `<Card>` for file rows. Use `<Button variant="secondary" size="sm">` for preview actions.
6. **Empty/Loading/Error:** Add `<Skeleton>` variants for loading. Use existing `<EmptyState>` for empty data.
7. **Responsive:** 
   - Mobile: Stack all sections vertically. Stat cards become 1-col. Course cards 1-col. Schedule/deadlines stack.
   - Tablet (768px): Stat cards 2-col. Course cards 2-col.
   - Desktop (1024px+): Stat cards 4-col. Course cards 2-col in left 2/3, schedule/deadlines in right 1/3.
8. **RTL:** Ensure all course codes use `course-code` class. Badges and chips use `bdi-isolate` where needed.

### Components to Modify
- `src/components/dashboard/DashboardView.tsx`

### B2 Components to Reuse
- `<Card>`, `<IconContainer>`, `<Button>`, `<Badge>`, `<Skeleton>`, `<EmptyState>`

---

## 3. B4.2 — Course Workspace Redesign

### Current State
- Back button + action buttons (AI, edit, delete, upload)
- Course banner header with gradient overlay
- Sticky context bar with course code + `ScrollableTabs`
- 7 sub-tabs: overview, lectures, sections/labs, assignments, files, summaries/questions, exams, discussions
- Overview: syllabus, prerequisites, grading scheme, instructor contact
- Files tabs: search + category/verification filters + file grid
- Discussions: new discussion form + post list + expandable comments

### Target Improvements
1. **Course Header:** Reduce visual weight. Use `<Card>` with subtle background instead of full gradient banner. Use `<Badge>` for course code and status.
2. **Sticky Context Bar:** Already uses `ScrollableTabs`. Keep but ensure `z-index` uses `z-sticky` token.
3. **Overview Tab:** Use `<Card>` for syllabus items, prerequisites, grading scheme. Use `<Divider>` between sections.
4. **Files Tab:** Use `<Card>` for file items. Use `<SearchField>` for search. Use `<Badge>` for file type, verification status, category. Standardize empty state with `<EmptyState>`.
5. **Discussions Tab:** Use `<Card>` for discussion posts. Use `<Avatar>` for author. Use `<Badge>` for solved/pinned status. Standardize comment thread with `<Card>`.
6. **RTL:** All course codes use `course-code` class. Dates use `bdi-isolate`. Technical terms isolated.
7. **Responsive:**
   - Mobile: Stack all sections. Tabs scroll horizontally. File cards 1-col.
   - Tablet: 2-col file grid.
   - Desktop: 2-col overview layout (content left, grading/info right).

### Components to Modify
- `src/components/courses/CourseWorkspace.tsx`

### B2 Components to Reuse
- `<Card>`, `<Button>`, `<Badge>`, `<Avatar>`, `<SearchField>`, `<Divider>`, `<EmptyState>`, `<Skeleton>`

---

## 4. B4.3 — Community / Discussions Redesign

### Current State
- Top tabs: Posts & Q&A, Honor Roll
- Posts header with search + 4 filter dropdowns (category, department, status, sort)
- Post cards with author avatar, name, department, date, category badge, course code badge, title, content, tags
- Expanded replies with comment input
- Inline empty state for no posts

### Target Improvements
1. **Header:** Use `<Card>` for the filter bar container. Use `<SearchField>` for search. Use `<Badge>` for post count.
2. **Post Cards:** Use `<Card variant="interactive">` for post container. Use `<Avatar>` for author. Use `<Divider>` between post content and actions.
3. **Category Badges:** Use `<Badge>` with semantic variants (warning for questions, success for resources, etc.).
4. **Actions:** Use `<Button variant="ghost" size="sm">` for upvote, reply, share. Consistent min-heights.
5. **Comments:** Use `<Card>` for comment threads. Highlight solution comments with `<Badge variant="success" dot>`.
6. **Empty State:** Replace inline empty state with `<EmptyState>` component.
7. **Responsive:**
   - Mobile: Stack filters vertically. Post cards full-width. Actions wrap.
   - Tablet: 2-col filters where possible.
   - Desktop: Full filter bar in one row.
8. **RTL:** Avatars and badges are RTL-safe. Course codes use `course-code`. Dates use `bdi-isolate`.

### Components to Modify
- `src/components/community/CommunityView.tsx`

### B2 Components to Reuse
- `<Card>`, `<Button>`, `<Badge>`, `<Avatar>`, `<SearchField>`, `<Divider>`, `<EmptyState>`, `<Skeleton>`

---

## 5. B4.4 — Exams / Quizzes Redesign

### Current State
- `ExamsQuizzesEngine.tsx` (2044 lines)
- Top tabs: all, quizzes, past exams, mistakes, bookmarks, history
- Filter bar: search, course, difficulty, term type
- Quiz list cards with bookmarks, difficulty badges, start button
- Quiz taking UI: question card, option buttons, timer, flag, submit, review drawer
- Results view: score, correct/incorrect, retry/navigation
- AI explanation modal

### Target Improvements
1. **Quiz List:** Use `<Card>` for quiz items. Use `<Badge>` for difficulty and term type. Use `<Button>` for start/bookmark actions.
2. **Quiz Taking:** Use `<Card>` for question container. Use `<Button variant="secondary">` for unselected options, `<Button variant="primary">` for selected. Add clear correct/incorrect states after submission.
3. **Progress:** Add visual progress indicator (question X of Y) using token typography.
4. **Timer:** Use `<Badge>` with `variant="warning" dot` for timer display.
5. **Results:** Use `<Card>` for result summary. Use `<Badge>` for pass/fail. Use `<Button>` for retry/navigation.
6. **Empty/Loading:** Use `<Skeleton>` for loading states. Use `<EmptyState>` for no quizzes.
7. **Accessibility:** Ensure all option buttons have proper `aria-pressed` or `aria-checked`. Ensure keyboard navigation works. Ensure focus management on submit.
8. **Responsive:**
   - Mobile: Single column. Options stack vertically. Timer and progress at top.
   - Tablet: Options in 2-col grid.
   - Desktop: Options in 2-col grid, question on left, progress/nav on right sticky.
9. **RTL:** Question numbers use `bdi-isolate`. Course codes use `course-code`.

### Components to Modify
- `src/components/study/ExamsQuizzesEngine.tsx`

### B2 Components to Reuse
- `<Card>`, `<Button>`, `<Badge>`, `<Skeleton>`, `<EmptyState>`, `<Divider>`

---

## 6. B4.5 — Productivity Areas

### StudyToolsView
- Already uses `ScrollableTabs` for sub-tools.
- Assignments: Use `<Card>` for assignment items. Use `<Badge>` for course code and status. Use `<Button>` for submit/toggle.
- Calendar: Use `<Card>` for schedule items. Use `<Button variant="secondary">` for ICS export.
- Graduation: Use `<Card>` for progress section. Standardize progress bar styling with token colors.

### CampusHubView
- Announcements: Use `<Card>` for announcement items. Use `<Badge>` for priority and scope.
- Events: Use `<Card>` for event cards. Use `<Badge>` for category. Use `<Button>` for RSVP.
- Marketplace: Use `<Card>` for item listings. Use `<Badge>` for condition and category.
- Lost & Found: Use `<Card>` for items. Use `<Badge>` for type (lost/found).
- Clubs: Use `<Card>` for club cards. Use `<Button>` for join/leave.

### Components to Modify
- `src/components/study/StudyToolsView.tsx`
- `src/components/campus/CampusHubView.tsx`

### B2 Components to Reuse
- `<Card>`, `<Button>`, `<Badge>`, `<Avatar>`, `<Skeleton>`, `<EmptyState>`

---

## 7. B4.6 — Shared Page States

### Loading
- Add `<Skeleton>` and `<CardSkeleton>` / `<ListSkeleton>` to all pages that fetch data.
- Use `<Skeleton>` for course cards, file cards, post cards, quiz cards.
- Use `<ListSkeleton>` for lists (assignments, schedule, announcements).

### Empty
- Replace all inline empty states with `<EmptyState>` component.
- Provide clear action buttons where applicable.

### Error
- Use existing `<ErrorState>` component.
- Ensure error messages are user-friendly, not technical.

### Success
- Use existing `<Toast>` system sparingly.
- Do not overuse toasts for routine actions.

---

## 8. Implementation Order

1. DashboardView.tsx
2. CourseWorkspace.tsx
3. CommunityView.tsx
4. ExamsQuizzesEngine.tsx
5. StudyToolsView.tsx
6. CampusHubView.tsx
7. Verify all pages
8. Run regression tests
9. Produce B4 report

---

## 9. Verification Checklist

- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run build` — pass
- [ ] `npx tsx tests/persistence_test.ts` — 41/41 pass
- [ ] `npx tsx tests/regression_matrix.ts` — 53/53 pass
- [ ] `npx tsx tests/security_audit.ts` — 26/26 pass
- [ ] `npx tsx tests/upload_download_tests.ts` — 8/8 pass
- [ ] Responsive at 375px, 390px, 414px, 768px, 1024px, 1440px, 1920px
- [ ] RTL quality verified
- [ ] Accessibility verified (keyboard, focus, contrast)
- [ ] No backend files modified
- [ ] Git diff reviewed

---

*End of B4 Implementation Plan*
