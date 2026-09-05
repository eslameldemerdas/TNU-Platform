import {
  LayoutDashboard,
  BookOpen,
  Calculator,
  MessageSquare,
  Building2,
  Bot,
  ShieldAlert,
  PlusCircle,
  X,
  GraduationCap,
} from "lucide-react";
import React from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { UserRole } from "../types";

export type SidebarTab =
  | "dashboard"
  | "courses"
  | "study_tools"
  | "community"
  | "campus"
  | "ai_assistant"
  | "admin"
  | "not_found"
  | "server_error";

interface SidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  userRole: UserRole;
  onUploadFileClick: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  onUploadFileClick,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  const desktopNavItems: {
    id: SidebarTab;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: "dashboard",
      label: t.nav.dashboard,
      shortLabel: t.nav.dashboardShort,
      icon: LayoutDashboard,
    },
    { id: "courses", label: t.nav.courses, shortLabel: t.nav.coursesShort, icon: BookOpen },
    {
      id: "study_tools",
      label: t.nav.studyTools,
      shortLabel: t.nav.studyToolsShort,
      icon: Calculator,
    },
    {
      id: "community",
      label: t.nav.community,
      shortLabel: t.nav.communityShort,
      icon: MessageSquare,
    },
    { id: "campus", label: t.nav.campus, shortLabel: t.nav.campusShort, icon: Building2 },
    { id: "ai_assistant", label: t.nav.aiAssistant, shortLabel: t.nav.aiAssistantShort, icon: Bot },
    ...(userRole !== "student"
      ? [
          {
            id: "admin" as SidebarTab,
            label: t.nav.admin,
            shortLabel: t.nav.adminShort,
            icon: ShieldAlert,
          },
        ]
      : []),
  ];

  const renderNavItem = (item: typeof desktopNavItems[0], isMobile = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const baseClasses = isMobile
      ? "relative flex flex-col items-center justify-center px-2.5 py-1.5 rounded-ehb-md transition-all shrink-0 min-h-[48px] min-w-[58px] snap-center focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      : "w-full flex items-center gap-3 px-3 py-2.5 rounded-ehb-md text-xs font-semibold transition-all group relative min-h-[44px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none";

    const activeClasses = isActive
      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-ehb-sm"
      : "text-ehb-text-primary hover:bg-ehb-surface-elevated-2 hover:text-ehb-text-primary";

    const iconClasses = `shrink-0 ${isActive ? "text-amber-400 dark:text-amber-600" : "text-ehb-text-muted group-hover:text-amber-500"}`;

    return (
      <button
        key={item.id}
        onClick={() => {
          onSelectTab(item.id);
          if (isMobile && onClose) onClose();
        }}
        className={`${baseClasses} ${activeClasses}`}
      >
        <div className="relative">
          <Icon className={`w-4 h-4 ${iconClasses}`} />
          {item.badge && (
            <span
              className={`absolute -top-1.5 -right-3 px-1 py-0.2 text-[8px] font-black rounded-full leading-none tracking-tight ${
                isActive
                  ? "bg-amber-400 text-slate-950 dark:bg-amber-500 dark:text-slate-950 shadow-ehb-xs"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              {item.badge}
            </span>
          )}
        </div>

        <span className={`${isMobile ? "text-[10px] mt-1 whitespace-nowrap leading-tight" : "hidden lg:inline truncate flex-1 ltr:text-left rtl:text-right"}`}>
          {isMobile ? (item.shortLabel || item.label) : item.label}
        </span>

        {isActive && isMobile && (
          <span className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-600 mt-0.5" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[var(--z-modal)] md:hidden"
          onClick={onClose}
        />
      )}

      {/* DESKTOP & TABLET SIDEBAR (Hidden on Mobile < md) */}
      <aside
        className="hidden md:flex w-16 lg:w-64 border-r border-ehb-default bg-ehb-surface-elevated/50 backdrop-blur-md flex-col justify-between py-4 transition-all shrink-0"
      >
        <div className="space-y-6">
          {/* Quick Action: Upload Resource Button (Restricted to Overseers & Admins) */}
          {userRole !== "student" && (
            <div className="px-2 lg:px-4">
              <button
                onClick={onUploadFileClick}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-ehb-md bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-ehb-sm transition-all active:scale-95 group min-h-[44px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                <PlusCircle className="w-4 h-4 text-amber-400 dark:text-amber-600 group-hover:rotate-90 transition-transform" />
                <span className="hidden lg:inline truncate">{t.nav.uploadResource}</span>
              </button>
            </div>
          )}

          {/* Primary Navigation */}
          <nav className="px-2 lg:px-3 space-y-1">
            <div className="hidden lg:block px-3 pb-1 text-[11px] font-bold text-ehb-text-muted uppercase tracking-wider">
              {t.nav.academicSpace}
            </div>
            {desktopNavItems.map((item) => renderNavItem(item))}
          </nav>
        </div>
      </aside>

      {/* MOBILE DRAWER (Visible on Mobile < md, slides from left) */}
      <div
        className={`fixed inset-y-0 left-0 z-[var(--z-modal)] w-72 bg-ehb-surface-elevated border-r border-ehb-default shadow-ehb-xl transform transition-transform duration-[var(--duration-normal)] ease-[var(--ease-default)] md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer header */}
          <div className="flex items-center justify-between p-4 border-b border-ehb-default">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-ehb-md bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-amber-400 dark:text-amber-600 font-bold shadow-ehb-sm">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-tight text-ehb-text-primary">EngHub</div>
                <div className="text-[10px] text-ehb-text-muted font-medium">v1.0</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ehb-text-muted hover:bg-ehb-surface-elevated-2 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold text-ehb-text-muted uppercase tracking-wider">
              {t.nav.academicSpace}
            </div>
            {desktopNavItems.map((item) => renderNavItem(item, true))}

            {/* Quick Upload action for elevated roles in mobile drawer */}
            {userRole !== "student" && (
              <button
                onClick={() => {
                  onUploadFileClick();
                  if (onClose) onClose();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-ehb-md bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-ehb-sm transition-all active:scale-95 mt-2"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>{t.nav.uploadResource}</span>
              </button>
            )}
          </nav>

          {/* Drawer footer */}
          <div className="p-3 border-t border-ehb-default">
            <div className="text-[10px] text-ehb-text-muted text-center">
              EngHub v1.0 &copy; 2026
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible on Mobile < md, Fixed at Bottom) */}
      <nav
        id="mobile-bottom-navbar"
        className="fixed bottom-0 left-0 right-0 z-[var(--z-mobile-nav)] bg-ehb-surface-elevated/95 backdrop-blur-xl border-t border-ehb-default md:hidden px-2 py-1.5 shadow-ehb-lg safe-area-pb"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-0.5">
          {desktopNavItems.map((item) => renderNavItem(item, true))}

          {/* Quick Upload action button for elevated roles on mobile if available */}
          {userRole !== "student" && (
            <button
              onClick={onUploadFileClick}
              className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-ehb-md bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-ehb-sm transition-all shrink-0 min-h-[48px] min-w-[56px] snap-center active:scale-95"
              title={t.nav.uploadResource}
            >
              <PlusCircle className="w-5 h-5 text-white" />
              <span className="text-[9px] mt-1 whitespace-nowrap leading-tight">رفع</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
