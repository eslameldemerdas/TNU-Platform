import {
  Shield,
  ShieldAlert,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  Database,
  Server,
  Key,
  Eye,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { getAuthHeaders } from "../../lib/storage";

export interface AuditEventItem {
  id: string;
  category: "authentication" | "security" | "administration" | "moderation" | "ai" | "system";
  eventType: string;
  severity: "info" | "warning" | "critical";
  actorId: string;
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  targetId?: string;
  targetType?: string;
  targetName?: string;
  previousState?: any;
  newState?: any;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AdminAuditDashboardProps {
  currentUser?: any;
  userRole?: string;
}

export const AdminAuditDashboard: React.FC<AdminAuditDashboardProps> = ({
  _currentUser,
  _userRole,
}) => {
  const { _t, language } = useTranslation();
  const isAr = language === "ar";

  const [logs, setLogs] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Metrics
  const [metrics, setMetrics] = useState<{
    totalEvents: number;
    successfulLogins: number;
    failedLogins: number;
    roleChanges: number;
    rateLimitTrips: number;
    aiQueries: number;
    criticalEvents: number;
  }>({
    totalEvents: 0,
    successfulLogins: 0,
    failedLogins: 0,
    roleChanges: 0,
    rateLimitTrips: 0,
    aiQueries: 0,
    criticalEvents: 0,
  });

  const [cacheStats, setCacheStats] = useState<{
    size: number;
    hits: number;
    misses: number;
    hitRatio: string;
  }>({ size: 0, hits: 0, misses: 0, hitRatio: "0.000" });

  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);
  const [cacheFlushedMsg, setCacheFlushedMsg] = useState(false);

  const fetchLogs = async (currentPage = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: "15",
        category: categoryFilter,
        severity: severityFilter,
        search: searchQuery,
      });

      const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.events || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/security-metrics", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (data.cache) setCacheStats(data.cache);
      }
    } catch (err) {
      console.error("Failed to fetch security metrics:", err);
    }
  };

  const handleFlushCache = async () => {
    try {
      const res = await fetch("/api/admin/cache/clear", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        setCacheFlushedMsg(true);
        fetchMetrics();
        setTimeout(() => setCacheFlushedMsg(false), 3000);
      }
    } catch (err) {
      console.error("Failed to flush cache:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, severityFilter, searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMetrics();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            {isAr ? "حرج" : "Critical"}
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {isAr ? "تحذير" : "Warning"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {isAr ? "معلوماتي" : "Info"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* Top Security & Performance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">{isAr ? "إجمالي السجلات" : "Audit Records"}</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black">{metrics.totalEvents || total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold">{isAr ? "دخول ناجح" : "Auth Success"}</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.successfulLogins}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-bold">
              {isAr ? "محاولات دخول فاشلة" : "Failed Logins"}
            </span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-rose-500">{metrics.failedLogins}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold">{isAr ? "حظر المعدل" : "Rate Limits"}</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-amber-500">{metrics.rateLimitTrips}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold">{isAr ? "تعديل صلاحيات" : "Role Updates"}</span>
            <Key className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-purple-500">{metrics.roleChanges}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-500 mb-2">
            <span className="text-xs font-bold">{isAr ? "استجابة الكاش" : "Cache Hit Ratio"}</span>
            <Server className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
              {cacheStats.hitRatio}
            </span>
            <button
              onClick={handleFlushCache}
              title={isAr ? "تفريغ الكاش" : "Flush Cache"}
              className="text-[10px] text-slate-400 hover:text-cyan-500 underline"
            >
              {cacheFlushedMsg ? (isAr ? "تم!" : "Flushed!") : isAr ? "تفريغ" : "Flush"}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                isAr
                  ? "بحث في الفعاليات، المستخدمين، العناوين، الـ IP..."
                  : "Search events, users, targets, IPs..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
          >
            <option value="all">{isAr ? "كل الأقسام" : "All Categories"}</option>
            <option value="authentication">
              {isAr ? "المصادقة وتأكيد الهوية" : "Authentication"}
            </option>
            <option value="security">{isAr ? "الأمان والحماية" : "Security"}</option>
            <option value="administration">{isAr ? "الإدارة والرتب" : "Administration"}</option>
            <option value="moderation">{isAr ? "الإشراف والمحتوى" : "Moderation"}</option>
            <option value="ai">{isAr ? "المساعد الذكي AI" : "AI Assistant"}</option>
            <option value="system">{isAr ? "النظام الداخلي" : "System"}</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
          >
            <option value="all">{isAr ? "كل المستويات" : "All Severities"}</option>
            <option value="info">{isAr ? "معلوماتي" : "Info"}</option>
            <option value="warning">{isAr ? "تحذيري" : "Warning"}</option>
            <option value="critical">{isAr ? "حرج" : "Critical"}</option>
          </select>

          <button
            onClick={() => {
              fetchLogs(page);
              fetchMetrics();
            }}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{isAr ? "تحديث" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">{isAr ? "الوقت" : "Timestamp"}</th>
                <th className="p-3.5">{isAr ? "المستوى" : "Severity"}</th>
                <th className="p-3.5">{isAr ? "نوع الحدث" : "Event"}</th>
                <th className="p-3.5">{isAr ? "الفاعل" : "Actor"}</th>
                <th className="p-3.5">{isAr ? "الهدف" : "Target"}</th>
                <th className="p-3.5">{isAr ? "عنوان IP" : "IP Address"}</th>
                <th className="p-3.5 text-center">{isAr ? "التفاصيل" : "Details"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>{isAr ? "جاري جلب سجلات الأمان..." : "Loading audit logs..."}</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <span>
                      {isAr
                        ? "لا توجد سجلات تطابق الفلتر المحدد."
                        : "No audit records match the selected filter."}
                    </span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(isAr ? "ar-EG" : "en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">{getSeverityBadge(log.severity)}</td>
                    <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold whitespace-nowrap">
                      {log.eventType}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {log.actorName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                    </td>
                    <td className="p-3.5">
                      {log.targetName || log.targetType ? (
                        <div>
                          <span className="font-bold">{log.targetName || log.targetType}</span>
                          {log.targetId && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {log.targetId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{log.ipAddress}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedEvent(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title={isAr ? "معاينة التفاصيل الكاملة" : "View full details"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            {isAr
              ? `عرض صفحة ${page} من أصل ${totalPages} (إجمالي ${total} سجل)`
              : `Page ${page} of ${totalPages} (${total} total records)`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-bold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isAr ? "السابق" : "Previous"}
            </button>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-bold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isAr ? "التالي" : "Next"}
            </button>
          </div>
        </div>
      </div>

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getSeverityBadge(selectedEvent.severity)}
                  <h3 className="font-black text-slate-900 dark:text-slate-100">
                    {selectedEvent.eventType}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-mono">{selectedEvent.id}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">
                    {isAr ? "الفاعل (Actor):" : "Actor:"}
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedEvent.actorName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {selectedEvent.actorRole} ({selectedEvent.actorId})
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">
                    {isAr ? "عنوان IP والتاريخ:" : "IP & Timestamp:"}
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {selectedEvent.ipAddress}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {selectedEvent.timestamp}
                  </div>
                </div>
              </div>

              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    {isAr ? "البيانات الوصفية (Metadata):" : "Metadata:"}
                  </span>
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {(selectedEvent.previousState || selectedEvent.newState) && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedEvent.previousState && (
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isAr ? "الحالة السابقة:" : "Previous State:"}
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-[10px] overflow-x-auto">
                        {JSON.stringify(selectedEvent.previousState, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedEvent.newState && (
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isAr ? "الحالة الجديدة:" : "New State:"}
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-[10px] overflow-x-auto">
                        {JSON.stringify(selectedEvent.newState, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
