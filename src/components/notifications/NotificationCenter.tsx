import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCheck,
  BookOpen,
  MessageSquare,
  Trophy,
  Shield,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap
} from 'lucide-react';
import { AppNotification, NotificationCategory } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any, targetId?: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    userId: "usr-alex-101",
    category: "academic",
    type: "new_exam",
    title: "New Practice Exams for AIE 103",
    titleAr: "تمت إضافة نماذج امتحانات جديدة لمقرر AIE 103",
    message: "Midterm & Final exam practice questions with model step-by-step solutions are now available.",
    messageAr: "نماذج امتحانات نصف الفصل والنهائي مع الحلول النموذجية المفصلة أصبحت متاحة الآن في بنك الامتحانات.",
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    actionTab: "study_tools",
    actionTargetId: "exam-aie103-midterm"
  },
  {
    id: "notif-2",
    userId: "usr-alex-101",
    category: "community",
    type: "answer_accepted",
    title: "Answer Accepted as Solution (+10 Pts)",
    titleAr: "تم اعتماد إجابتك كحل نموذجي (+10 نقاط)",
    message: "Layla marked your answer on K-Map Don't Care Conditions as the official verified solution.",
    messageAr: "قامت ليلى باعتماد إجابتك على سؤال حالات Don't Care في خريطة كارنوف كحل نموذجي معتمد.",
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    actionTab: "community",
    actionTargetId: "disc-101"
  }
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onUnreadCountChange
}) => {
  const { t, language } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch notifications from server API
  const fetchNotifications = useCallback(async (silent = true) => {
    if (!silent) setIsLoading(true);
    setIsError(false);
    try {
      const url = new URL('/api/notifications', window.location.origin);
      if (activeCategory !== 'all') {
        url.searchParams.set('category', activeCategory);
      }
      if (filterUnreadOnly) {
        url.searchParams.set('unreadOnly', 'true');
      }
      url.searchParams.set('limit', '30');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to load notifications');
      const data = await res.json();
      if (data.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);
      }
      setUnreadCount(data.unreadCount ?? 0);
      if (onUnreadCountChange) {
        onUnreadCountChange(data.unreadCount ?? 0);
      }
    } catch {
      // If we have cached/initial notifications, don't show an intrusive error screen
      if (notifications.length === 0) {
        setIsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, filterUnreadOnly, notifications.length, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true);
    }
  }, [isOpen, fetchNotifications]);

  // Mark single as read
  const handleMarkAsRead = async (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    if (notif.read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    const newCount = Math.max(0, unreadCount - 1);
    setUnreadCount(newCount);
    if (onUnreadCountChange) onUnreadCountChange(newCount);

    try {
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: 'POST'
      });
    } catch {
      // Non-blocking rollback
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    if (onUnreadCountChange) onUnreadCountChange(0);

    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST'
      });
    } catch {}
  };

  // Click notification to navigate
  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      if (onUnreadCountChange) onUnreadCountChange(newCount);
      try {
        fetch(`/api/notifications/${notif.id}/read`, { method: 'POST' });
      } catch {}
    }

    if (notif.actionTab && onNavigateTab) {
      onNavigateTab(notif.actionTab, notif.actionTargetId);
      onClose();
    }
  };

  // Category Icon & Color Mapping
  const getCategoryMeta = (cat: NotificationCategory) => {
    switch (cat) {
      case 'academic':
        return {
          label: language === 'ar' ? 'أكاديمي ودراسي' : 'Academic & Courses',
          icon: GraduationCap,
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        };
      case 'community':
        return {
          label: language === 'ar' ? 'المجتمع والأسئلة' : 'Community & Q&A',
          icon: MessageSquare,
          badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
        };
      case 'study':
        return {
          label: language === 'ar' ? 'جلسات التركيز' : 'Focus Sessions',
          icon: BookOpen,
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        };
      case 'gamification':
        return {
          label: language === 'ar' ? 'الأوسمة والنقاط' : 'Badges & Points',
          icon: Trophy,
          badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        };
      case 'system':
        return {
          label: language === 'ar' ? 'تنبيهات النظام' : 'System Alerts',
          icon: Shield,
          badgeBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
        };
      default:
        return {
          label: language === 'ar' ? 'إشعار عام' : 'Notification',
          icon: Bell,
          badgeBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
        };
    }
  };

  // Format Relative Timestamp
  const formatTimestamp = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return language === 'ar' ? 'الآن' : 'Just now';
      if (mins < 60) return language === 'ar' ? `منذ ${mins} دقيقة` : `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
    } catch {
      return dateStr;
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          id="enghub-notification-center-portal"
          className="fixed inset-0 z-[100] flex items-start justify-end p-2 sm:p-4 md:p-6 overflow-hidden pointer-events-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Panel Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={language === 'ar' ? 'مركز الإشعارات الأكاديمية' : 'Academic Notification Center'}
            initial={{ opacity: 0, y: -15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, duration: 0.2 }}
            className="relative z-[101] w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden mt-14 sm:mt-16"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {language === 'ar' ? 'مركز الإشعارات الأكاديمية' : 'Academic Notification Center'}
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-600 text-white animate-pulse">
                        {unreadCount} {language === 'ar' ? 'غير مقروء' : 'unread'}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'ar'
                      ? 'تحديثات الدروس، الامتحانات، الردود، والإنجازات'
                      : 'Course updates, exams, discussions, and badges'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title={language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{language === 'ar' ? 'قراءة الكل' : 'Mark All'}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900">
              {(
                [
                  { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                  { id: 'academic', label: language === 'ar' ? 'أكاديمي' : 'Academic' },
                  { id: 'community', label: language === 'ar' ? 'المجتمع' : 'Community' },
                  { id: 'study', label: language === 'ar' ? 'التركيز' : 'Study' },
                  { id: 'gamification', label: language === 'ar' ? 'الأوسمة' : 'Badges' },
                  { id: 'system', label: language === 'ar' ? 'النظام' : 'System' }
                ] as const
              ).map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}

              <button
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                className={`ms-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border transition-all cursor-pointer ${
                  filterUnreadOnly
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
                    : 'text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {language === 'ar' ? 'غير المقروء فقط' : 'Unread only'}
              </button>
            </div>

            {/* Notification List Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading && notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'جاري تحميل الإشعارات الأكاديمية...' : 'Loading academic notifications...'}
                  </p>
                </div>
              ) : isError && notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {language === 'ar' ? 'تعذر تحميل الإشعارات حالياً' : 'Failed to load notifications'}
                  </p>
                  <button
                    onClick={() => fetchNotifications(false)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-indigo-500 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                      {language === 'ar'
                        ? 'أنت مطلع على أحدث التحديثات والدروس والأنشطة الأكاديمية!'
                        : "You're caught up with all academic updates!"}
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const meta = getCategoryMeta(notif.category);
                  const IconComponent = meta.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`pt-2.5 first:pt-0 p-2.5 rounded-2xl transition-all cursor-pointer group flex items-start gap-3 relative ${
                        !notif.read
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-s-4 border-indigo-600 dark:border-indigo-500 shadow-xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Category Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.badgeBg}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {meta.label} • {formatTimestamp(notif.createdAt)}
                          </span>
                          {!notif.read && (
                            <span
                              onClick={(e) => handleMarkAsRead(e, notif)}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              {language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-xs font-bold mt-0.5 leading-snug line-clamp-1 ${
                            !notif.read
                              ? 'text-slate-900 dark:text-white font-extrabold'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {language === 'ar' ? notif.titleAr || notif.title : notif.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                          {language === 'ar' ? notif.messageAr || notif.message : notif.message}
                        </p>
                      </div>

                      {/* Action Indicator */}
                      {notif.actionTab && (
                        <div className="shrink-0 self-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Status */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>{language === 'ar' ? 'منصة EngHub الأكاديمية • إشعارات فورية' : 'EngHub Academic Notifications'}</span>
              <button
                onClick={() => fetchNotifications(false)}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
