import {
  LayoutDashboard,
  BookOpen,
  Calculator,
  MessageSquare,
  Building2,
  Bot,
  ShieldAlert,
  PlusCircle,
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  onUploadFileClick,
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

  return (
    <>
      {/* DESKTOP & TABLET SIDEBAR (Hidden on Mobile < md) */}
      <aside className="hidden md:flex w-16 lg:w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md flex-col justify-between py-4 transition-all shrink-0">
        <div className="space-y-6">
          {/* Quick Action: Upload Resource Button (Restricted to Overseers & Admins) */}
          {userRole !== "student" && (
            <div className="px-2 lg:px-4">
              <button
                onClick={onUploadFileClick}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-md transition-all active:scale-95 group min-h-[44px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                <PlusCircle className="w-4 h-4 text-amber-400 dark:text-amber-600 group-hover:rotate-90 transition-transform" />
                <span className="hidden lg:inline truncate">{t.nav.uploadResource}</span>
              </button>
            </div>
          )}

          {/* Primary Navigation */}
          <nav className="px-2 lg:px-3 space-y-1">
            <div className="hidden lg:block px-3 pb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.nav.academicSpace}
            </div>
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative min-h-[44px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    isActive
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-400 dark:text-amber-600" : "text-slate-400 group-hover:text-amber-500"}`}
                  />
                  <span className="hidden lg:inline truncate flex-1 ltr:text-left rtl:text-right">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`hidden lg:inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible on Mobile < md, Fixed at Bottom) */}
      <nav
        id="mobile-bottom-navbar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 md:hidden px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] safe-area-pb"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-0.5">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl transition-all shrink-0 min-h-[48px] min-w-[58px] snap-center focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                  isActive
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-sm scale-100"
                    : "text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? "text-amber-400 dark:text-amber-600"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  {item.badge && (
                    <span
                      className={`absolute -top-1.5 -right-3 px-1 py-0.2 text-[8px] font-black rounded-full leading-none tracking-tight ${
                        isActive
                          ? "bg-amber-400 text-slate-950 dark:bg-amber-500 dark:text-slate-950 shadow-xs"
                          : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] mt-1 whitespace-nowrap leading-tight">
                  {item.shortLabel || item.label}
                </span>

                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-600 mt-0.5" />
                )}
              </button>
            );
          })}

          {/* Quick Upload action button for elevated roles on mobile if available */}
          {userRole !== "student" && (
            <button
              id="mobile-nav-upload-quick"
              onClick={onUploadFileClick}
              className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all shrink-0 min-h-[48px] min-w-[56px] snap-center active:scale-95"
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
