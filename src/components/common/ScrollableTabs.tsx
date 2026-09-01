import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface ScrollableTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

interface ScrollableTabsProps {
  tabs: ScrollableTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
  variant?: 'pills' | 'segmented' | 'underline';
}

export const ScrollableTabs: React.FC<ScrollableTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  ariaLabel = 'شريط التبويبات',
  variant = 'segmented'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showRightArrow, setShowRightArrow] = useState<boolean>(false);
  const [showLeftArrow, setShowLeftArrow] = useState<boolean>(false);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

  // Check scroll bounds intelligently with RTL browser support
  const checkScrollBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollWidth, clientWidth, scrollLeft } = el;
    const maxScroll = scrollWidth - clientWidth;
    const hasOverflow = maxScroll > 4;

    setIsOverflowing(hasOverflow);

    if (!hasOverflow) {
      setShowRightArrow(false);
      setShowLeftArrow(false);
      return;
    }

    // In RTL browsers:
    // Chromium/Firefox/WebKit: scrollLeft is 0 at the rightmost edge, and negative or positive towards the left.
    // Normalized scroll position:
    const absScroll = Math.abs(scrollLeft);

    // Right side (start in RTL): can scroll right if absScroll > 5
    // Left side (end in RTL): can scroll left if absScroll < maxScroll - 5
    setShowRightArrow(absScroll > 5);
    setShowLeftArrow(absScroll < maxScroll - 5);
  }, []);

  // Update on mount, resize, tabs change, or activeTab change
  useEffect(() => {
    checkScrollBounds();

    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      checkScrollBounds();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScrollBounds();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener('resize', checkScrollBounds);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [checkScrollBounds, tabs.length]);

  // Scroll active tab into view smoothly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const activeBtn = el.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
      setTimeout(checkScrollBounds, 350);
    }
  }, [activeTab, checkScrollBounds]);

  // Horizontal mouse wheel support
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el || !isOverflowing) return;

    // If scrolling vertically with wheel, convert to horizontal scroll
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      // In RTL, positive deltaY should scroll to left (increase absScroll)
      const isRtl = document.dir === 'rtl' || getComputedStyle(el).direction === 'rtl';
      const scrollStep = e.deltaY * (isRtl ? -1 : 1);
      el.scrollBy({ left: scrollStep, behavior: 'auto' });
    }
  };

  // Click scroll handlers
  const scrollRight = () => {
    const el = containerRef.current;
    if (!el) return;
    const isRtl = document.dir === 'rtl' || getComputedStyle(el).direction === 'rtl';
    const amount = el.clientWidth * 0.65;
    // In RTL, scrolling right moves towards 0 (positive if negative scrollLeft)
    el.scrollBy({ left: isRtl ? amount : -amount, behavior: 'smooth' });
  };

  const scrollLeft = () => {
    const el = containerRef.current;
    if (!el) return;
    const isRtl = document.dir === 'rtl' || getComputedStyle(el).direction === 'rtl';
    const amount = el.clientWidth * 0.65;
    // In RTL, scrolling left moves away from 0 (negative if negative scrollLeft)
    el.scrollBy({ left: isRtl ? -amount : amount, behavior: 'smooth' });
  };

  // Keyboard navigation across tabs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isRtl = document.dir === 'rtl';
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = isRtl ? Math.max(0, currentIndex - 1) : Math.min(tabs.length - 1, currentIndex + 1);
      onTabChange(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextIndex = isRtl ? Math.min(tabs.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
      onTabChange(tabs[nextIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onTabChange(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onTabChange(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div
      className={`relative flex items-center group w-full ${className}`}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Right Scroll Button (in RTL, this scrolls towards the beginning/right) */}
      {showRightArrow && (
        <div className="absolute right-0 z-20 flex items-center h-full pr-0.5">
          <button
            type="button"
            onClick={scrollRight}
            aria-label="الانتقال للتبويبات السابقة"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-200 shadow-md border border-slate-700/60 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right Gradient Fade */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-14 bg-gradient-to-l from-slate-950/80 via-slate-950/40 to-transparent dark:from-slate-950/90 pointer-events-none z-10" />
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        role="tablist"
        aria-label={ariaLabel}
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1 px-1 w-full select-none scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          let btnClass = '';
          if (variant === 'segmented') {
            btnClass = isActive
              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70';
          } else if (variant === 'pills') {
            btnClass = isActive
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700';
          } else {
            // underline
            btnClass = isActive
              ? 'text-emerald-500 border-b-2 border-emerald-500 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent';
          }

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab-id={tab.id}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${btnClass}`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                    tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300')
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Left Gradient Fade */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-14 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent dark:from-slate-950/90 pointer-events-none z-10" />
      )}

      {/* Left Scroll Button (in RTL, this scrolls towards the end/left) */}
      {showLeftArrow && (
        <div className="absolute left-0 z-20 flex items-center h-full pl-0.5">
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="الانتقال للتبويبات التالية"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-200 shadow-md border border-slate-700/60 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
