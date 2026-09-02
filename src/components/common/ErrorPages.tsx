import { Home, Compass, RefreshCw, ShieldAlert, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { useTranslation } from "../../i18n/LanguageContext";

interface NotFoundProps {
  onGoHome: () => void;
}

export const NotFoundView: React.FC<NotFoundProps> = ({ onGoHome }) => {
  const { isRTL } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Visual Graphic Badge */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/10 dark:bg-amber-500/20 animate-ping" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-xl backdrop-blur-md">
            <Compass className="w-12 h-12" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            خطأ 404 • الصفحة غير موجودة
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            تائه في أروقة الكلية؟
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            عذراً، الرابط أو الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها. يسعدنا إرشادك
            للعودة إلى اللوحة الرئيسية.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onGoHome}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>العودة إلى اللوحة الرئيسية</span>
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface ServerErrorProps {
  onGoHome: () => void;
  onRetry?: () => void;
}

export const ServerErrorView: React.FC<ServerErrorProps> = ({ onGoHome, onRetry }) => {
  const { _isRTL } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Visual Graphic Badge */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-500/10 dark:bg-rose-500/20 animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500/20 via-amber-500/10 to-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-xl backdrop-blur-md">
            <ShieldAlert className="w-12 h-12" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            خطأ 500 • خطأ داخلي في الخادم
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            عذراً، حدث استثناء غير متوقع
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            تم تسجيل تقرير المشكلة تلقائياً لحماية سرية البيانات والأنظمة. يمكنك المحاولة مجدداً أو
            الانتقال للصفحة الرئيسية.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة محاولة الاتصال</span>
            </button>
          )}

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in EngHub application:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ServerErrorView
          onGoHome={() => {
            this.handleReset();
            window.location.hash = "#dashboard";
          }}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
