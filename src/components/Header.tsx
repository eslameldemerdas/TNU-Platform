import React, { useState, useEffect } from 'react';
import {
  Search,
  Bot,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Award,
  User,
  Shield,
  GraduationCap,
  Layers,
  Check,
  LogOut,
  LogIn,
  Globe
} from 'lucide-react';
import { UserProfile, Department } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { NotificationCenter } from './notifications/NotificationCenter';

interface HeaderProps {
  user: UserProfile | null;
  departments: Department[];
  activeDeptId: string;
  onSelectDepartment: (deptId: string) => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenProfile: () => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogout: () => void;
  onNavigateHome?: () => void;
  onNavigateTab?: (tab: any, targetId?: string) => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  departments,
  activeDeptId,
  onSelectDepartment,
  onOpenSearch,
  onOpenAI,
  isDarkMode,
  onToggleDarkMode,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  onNavigateHome,
  onNavigateTab,
  unreadCount: initialUnreadCount = 0
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDeptMenu, setShowDeptMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);

  // Fetch initial unread count from API
  useEffect(() => {
    const checkUnread = async () => {
      try {
        const res = await fetch('/api/notifications?limit=1');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
          }
        }
      } catch {}
    };
    checkUnread();
  }, [user]);

  const activeDept = departments.find((d) => d.id === activeDeptId);

  return (
    <>
      {(showDeptMenu || showRoleMenu) && (
        <div
          className="fixed inset-0 z-20 bg-transparent"
          onClick={() => {
            setShowDeptMenu(false);
            setShowRoleMenu(false);
          }}
        />
      )}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-2 sm:px-4 lg:px-6 flex items-center justify-between transition-colors w-full max-w-full overflow-visible">
      {/* Left: Brand & Department Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-5 shrink-0">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none text-left ltr:text-left rtl:text-right group"
          title="Go to Home / الصفحة الرئيسية"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-amber-400 dark:text-amber-600 font-bold shadow-md shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="hidden xs:block">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                EngHub
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-mono">
                v1.0
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[100px] sm:max-w-[150px] lg:max-w-none hidden md:block">
              {t.common.appSubtitle}
            </p>
          </div>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden xs:block" />

        {/* Department Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDeptMenu(!showDeptMenu);
              setShowRoleMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all min-h-[36px] sm:min-h-[42px]"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="max-w-[55px] xs:max-w-[85px] sm:max-w-[150px] truncate text-[11px] sm:text-xs">
              {activeDeptId === 'all' ? t.common.allDepts : activeDept ? activeDept.code : t.common.selectDept}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {showDeptMenu && (
            <div className="absolute top-full ltr:left-0 rtl:right-0 mt-2 w-60 sm:w-64 max-w-[calc(100vw-1rem)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-1.5 z-50">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t.common.selectDept}
              </div>
              <button
                onClick={() => {
                  onSelectDepartment('all');
                  setShowDeptMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeDeptId === 'all'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{t.common.allDepts}</span>
                {activeDeptId === 'all' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              </button>

              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => {
                    onSelectDepartment(dept.id);
                    setShowDeptMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeDeptId === dept.id
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 shrink-0 font-mono">
                      {dept.code}
                    </span>
                    <span className="truncate">{dept.name}</span>
                  </div>
                  {activeDeptId === dept.id && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Search Trigger (Cmd + K) */}
      <button
        onClick={onOpenSearch}
        className="hidden md:flex items-center gap-3 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 text-xs w-40 lg:w-80 transition-all min-h-[40px]"
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="flex-1 text-left font-normal truncate">{t.common.searchPlaceholder}</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
          ⌘K
        </kbd>
      </button>

      {/* Right: Actions, AI Buddy, Points, Language, Dark Mode */}
      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3 shrink-0">
        {/* Search button mobile */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-[0.98] min-h-[36px] sm:min-h-[40px]"
          title={t.common.aiBuddy}
        >
          <Bot className="w-3.5 h-3.5 shrink-0 text-slate-950" />
          <span className="hidden xs:inline">{t.common.aiBuddy}</span>
        </button>

        {/* User Points Badge */}
        {user && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold tabular-nums">
            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{user.points} {t.common.points}</span>
          </div>
        )}

        {/* Language Switcher (Arabic / English) */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 min-h-[36px] sm:min-h-[40px] shadow-xs"
          title={language === 'ar' ? 'التحويل إلى English' : 'تغيير إلى العربية'}
        >
          <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="font-extrabold">{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center relative group shadow-xs"
          title={isDarkMode ? 'Switch to Light Mode / الوضع المضيء' : 'Switch to Dark Mode / الوضع المظلم'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-800 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Notifications Button & Dropdown/Modal Center */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleMenu(false);
              setShowDeptMenu(false);
            }}
            className={`p-2 rounded-xl transition-all relative min-h-[40px] min-w-[40px] flex items-center justify-center ${
              showNotifications
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={language === 'ar' ? 'مركز الإشعارات الأكاديمية' : 'Academic Notification Center'}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className={`w-4 h-4 transition-transform ${showNotifications ? 'scale-110' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center shadow-xs font-mono">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onNavigateTab={onNavigateTab}
            onUnreadCountChange={(count) => setUnreadCount(count)}
          />
        </div>

        {/* Role & Profile Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowDeptMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[36px] sm:min-h-[40px]"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-2 ring-indigo-500/30 shrink-0"
              />
              <div className="hidden lg:block text-left ltr:text-left rtl:text-right">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-indigo-500 capitalize font-medium">
                  {user.role.replace('_', ' ')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block shrink-0" />
            </button>

            {showRoleMenu && (
              <div className="absolute top-full ltr:right-0 rtl:left-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50">
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-indigo-500 font-medium">{user.level}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onOpenProfile();
                    setShowRoleMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{t.common.myProfile}</span>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    onOpenAuth('signup');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.common.switchAccount}</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.common.signOut}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 min-h-[36px]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold hover:opacity-95 shadow-sm transition-all flex items-center gap-1.5 min-h-[36px]"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  </>
);
};

