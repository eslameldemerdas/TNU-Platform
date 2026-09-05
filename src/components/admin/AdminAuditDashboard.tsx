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

import { Card, Button, Badge, Input, Select, Modal } from "../ui";

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

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
          <Badge variant="error" size="sm">
            {isAr ? "حرج" : "Critical"}
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="warning" size="sm">
            {isAr ? "تحذير" : "Warning"}
          </Badge>
        );
      default:
        return (
          <Badge variant="success" size="sm">
            {isAr ? "معلوماتي" : "Info"}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-ehb-text-primary">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card padding="md">
          <div className="flex items-center justify-between text-ehb-text-muted mb-2">
            <span className="text-xs font-bold">{isAr ? "إجمالي السجلات" : "Audit Records"}</span>
            <Database className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-xl font-black text-ehb-text-primary">{metrics.totalEvents || total}</div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold">{isAr ? "دخول ناجح" : "Auth Success"}</span>
            <CheckCircle className="w-4 h-4 shrink-0" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.successfulLogins}
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-bold">
              {isAr ? "محاولات دخول فاشلة" : "Failed Logins"}
            </span>
            <AlertTriangle className="w-4 h-4 shrink-0" />
          </div>
          <div className="text-xl font-black text-rose-500">{metrics.failedLogins}</div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold">{isAr ? "حظر المعدل" : "Rate Limits"}</span>
            <ShieldAlert className="w-4 h-4 shrink-0" />
          </div>
          <div className="text-xl font-black text-amber-500">{metrics.rateLimitTrips}</div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold">{isAr ? "تعديل صلاحيات" : "Role Updates"}</span>
            <Key className="w-4 h-4 shrink-0" />
          </div>
          <div className="text-xl font-black text-purple-500">{metrics.roleChanges}</div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-cyan-500 mb-2">
            <span className="text-xs font-bold">{isAr ? "استجابة الكاش" : "Cache Hit Ratio"}</span>
            <Server className="w-4 h-4 shrink-0" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
              {cacheStats.hitRatio}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlushCache}
              className="text-[10px] text-ehb-text-muted hover:text-cyan-500 underline"
            >
              {cacheFlushedMsg ? (isAr ? "تم!" : "Flushed!") : isAr ? "تفريغ" : "Flush"}
            </Button>
          </div>
        </Card>
      </div>

      <Card padding="lg" className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? "بحث في الفعاليات، المستخدمين، العناوين، الـ IP..."
                : "Search events, users, targets, IPs..."
            }
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Select
            size="sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "all", label: isAr ? "كل الأقسام" : "All Categories" },
              { value: "authentication", label: isAr ? "المصادقة وتأكيد الهوية" : "Authentication" },
              { value: "security", label: isAr ? "الأمان والحماية" : "Security" },
              { value: "administration", label: isAr ? "الإدارة والرتب" : "Administration" },
              { value: "moderation", label: isAr ? "الإشراف والمحتوى" : "Moderation" },
              { value: "ai", label: isAr ? "المساعد الذكي AI" : "AI Assistant" },
              { value: "system", label: isAr ? "النظام الداخلي" : "System" },
            ]}
          />

          <Select
            size="sm"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            options={[
              { value: "all", label: isAr ? "كل المستويات" : "All Severities" },
              { value: "info", label: isAr ? "معلوماتي" : "Info" },
              { value: "warning", label: isAr ? "تحذيري" : "Warning" },
              { value: "critical", label: isAr ? "حرج" : "Critical" },
            ]}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchLogs(page);
              fetchMetrics();
            }}
            disabled={loading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden border-ehb-default">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="bg-ehb-surface text-ehb-text-muted font-bold border-b border-ehb-subtle">
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
            <tbody className="divide-y divide-ehb-subtle font-medium">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ehb-text-muted">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>{isAr ? "جاري جلب سجلات الأمان..." : "Loading audit logs..."}</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ehb-text-muted">
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
                    className="hover:bg-ehb-surface-elevated transition-colors"
                  >
                    <td className="p-3.5 font-mono text-[11px] text-ehb-text-muted whitespace-nowrap">
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
                      <bdi dir="ltr">{log.eventType}</bdi>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-ehb-text-primary">{log.actorName}</div>
                      <div className="text-[10px] text-ehb-text-muted font-mono">
                        <bdi dir="ltr">{log.actorRole}</bdi>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {log.targetName || log.targetType ? (
                        <div>
                          <span className="font-bold text-ehb-text-primary">{log.targetName || log.targetType}</span>
                          {log.targetId && (
                            <span className="block text-[10px] text-ehb-text-muted font-mono">
                              <bdi dir="ltr">{log.targetId}</bdi>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ehb-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-ehb-text-muted">
                      <bdi dir="ltr">{log.ipAddress}</bdi>
                    </td>
                    <td className="p-3.5 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(log)}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title={isAr ? "معاينة التفاصيل الكاملة" : "View full details"}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-ehb-surface border-t border-ehb-subtle flex items-center justify-between text-xs">
          <div className="text-ehb-text-muted font-medium">
            {isAr
              ? `عرض صفحة ${page} من أصل ${totalPages} (إجمالي ${total} سجل)`
              : `Page ${page} of ${totalPages} (${total} total records)`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
            >
              {isAr ? "السابق" : "Previous"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages || loading}
            >
              {isAr ? "التالي" : "Next"}
            </Button>
          </div>
        </div>
      </Card>

      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={
            <span className="flex items-center gap-2">
              {getSeverityBadge(selectedEvent.severity)}
              <bdi dir="ltr">{selectedEvent.eventType}</bdi>
            </span>
          }
          description={<bdi dir="ltr" className="font-mono">{selectedEvent.id}</bdi>}
          size="xl"
          footer={
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <Card padding="lg" className="grid grid-cols-2 gap-4 border-ehb-subtle">
              <div>
                <span className="text-ehb-text-muted block mb-1">
                  {isAr ? "الفاعل (Actor):" : "Actor:"}
                </span>
                <div className="font-bold text-ehb-text-primary">{selectedEvent.actorName}</div>
                <div className="text-[11px] text-ehb-text-muted font-mono">
                  <bdi dir="ltr">{selectedEvent.actorRole} ({selectedEvent.actorId})</bdi>
                </div>
              </div>

              <div>
                <span className="text-ehb-text-muted block mb-1">
                  {isAr ? "عنوان IP والتاريخ:" : "IP & Timestamp:"}
                </span>
                <div className="font-bold text-ehb-text-primary font-mono">
                  <bdi dir="ltr">{selectedEvent.ipAddress}</bdi>
                </div>
                <div className="text-[11px] text-ehb-text-muted font-mono">
                  <bdi dir="ltr">{selectedEvent.timestamp}</bdi>
                </div>
              </div>
            </Card>

            {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
              <div>
                <span className="font-bold text-ehb-text-primary block mb-2">
                  {isAr ? "البيانات الوصفية (Metadata):" : "Metadata:"}
                </span>
                <pre className="p-3.5 rounded-ehb-md bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-ehb-default">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            )}

            {(selectedEvent.previousState || selectedEvent.newState) && (
              <div className="grid grid-cols-2 gap-3">
                {selectedEvent.previousState && (
                  <div>
                    <span className="font-bold text-ehb-text-primary block mb-1">
                      {isAr ? "الحالة السابقة:" : "Previous State:"}
                    </span>
                    <pre className="p-3 rounded-ehb-md bg-ehb-surface text-ehb-text-primary font-mono text-[10px] overflow-x-auto border border-ehb-subtle">
                      {JSON.stringify(selectedEvent.previousState, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedEvent.newState && (
                  <div>
                    <span className="font-bold text-ehb-text-primary block mb-1">
                      {isAr ? "الحالة الجديدة:" : "New State:"}
                    </span>
                    <pre className="p-3 rounded-ehb-md bg-ehb-surface text-ehb-text-primary font-mono text-[10px] overflow-x-auto border border-ehb-subtle">
                      {JSON.stringify(selectedEvent.newState, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
