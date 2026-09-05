import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import React from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  technicalDetails?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "حدث خطأ أثناء تحميل البيانات",
  message = "تعذر الاتصال بالخادم أو استرجاع المحتوى المطلوب. يرجى المحاولة مرة أخرى.",
  onRetry,
  technicalDetails,
  className = "",
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-ehb-2xl border border-rose-500/30 bg-rose-500/10 transition-all ${className}`}
    >
      <div className="w-14 h-14 rounded-ehb-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-ehb-sm">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-ehb-error mb-1 max-w-md">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-ehb-text-muted max-w-sm mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-ehb-md bg-ehb-error hover:bg-ehb-error-hover active:bg-ehb-error text-ehb-error-text text-xs font-bold shadow-ehb-md transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
      )}

      {technicalDetails && (
        <div className="mt-6 w-full max-w-md text-right">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ehb-text-muted hover:text-ehb-text-primary transition-colors"
          >
            <span>تفاصيل تقنية للمطورين</span>
            {showDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showDetails && (
          <pre className="mt-2 p-3 rounded-ehb-md bg-ehb-surface border border-ehb-default text-ehb-text-muted text-[10px] font-mono text-left overflow-x-auto">
            {technicalDetails}
          </pre>
          )}
        </div>
      )}
    </div>
  );
};
