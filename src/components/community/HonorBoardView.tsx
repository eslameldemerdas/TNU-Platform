import {
  Trophy,
  Award,
  Star,
  Search,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Medal,
  Crown,
  Flame,
  Heart,
  Building2,
  Calendar,
  User,
  Link2,
  BookOpen,
  Filter,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { UserProfile, Department, HonorStudent, HonorCategory } from "../../types";

interface HonorBoardViewProps {
  currentUser: UserProfile | null;
  departments: Department[];
}

const CATEGORY_META: Record<
  HonorCategory,
  { label: string; labelEn: string; color: string; bg: string; icon: React.ElementType }
> = {
  academic_excellence: {
    label: "تفوق وامتياز دراسي",
    labelEn: "Academic Excellence",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    icon: GraduationCap,
  },
  hackathon_competition: {
    label: "مسابقات وهاكاثونات",
    labelEn: "Hackathon",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    icon: Flame,
  },
  scientific_research: {
    label: "أبحاث علمية",
    labelEn: "Research",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    icon: BookOpen,
  },
  graduation_project: {
    label: "مشاريع تخرج مميزة",
    labelEn: "Graduation Project",
    color: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
    icon: Award,
  },
  robotics_ai: {
    label: "روبوتات وذكاء اصطناعي",
    labelEn: "Robotics & AI",
    color: "text-cyan-700 dark:text-cyan-300",
    bg: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800",
    icon: Sparkles,
  },
  innovation_patents: {
    label: "ابتكارات وبراءات اختراع",
    labelEn: "Innovation",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    icon: Crown,
  },
  student_leadership: {
    label: "قيادة طلابية",
    labelEn: "Leadership",
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    icon: Star,
  },
  community_impact: {
    label: "خدمة مجتمعية",
    labelEn: "Community Impact",
    color: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
    icon: Heart,
  },
};

const _RANK_ICONS = [Crown, Medal, Award];

export const HonorBoardView: React.FC<HonorBoardViewProps> = ({ currentUser, departments }) => {
  const [entries, setEntries] = useState<HonorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<HonorStudent | null>(null);
  const [applauseMap, setApplauseMap] = useState<Record<string, number>>({});
  const [applauseLoading, setApplauseLoading] = useState<string | null>(null);

  const _isAdmin =
    currentUser &&
    ["super_admin", "department_admin", "supervisor", "moderator"].includes(currentUser.role);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedDept !== "all") params.set("departmentId", selectedDept);
      params.set("limit", "100");

      const res = await fetch(`/api/honor-board?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setEntries(data.entries || []);
      const map: Record<string, number> = {};
      (data.entries || []).forEach((e: HonorStudent) => {
        map[e.id] = e.applauseCount;
      });
      setApplauseMap(map);
    } catch (err: any) {
      setError(err.message || "تعذر تحميل لوحة الشرف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedDept]);

  const handleApplause = async (entryId: string) => {
    setApplauseLoading(entryId);
    try {
      const res = await fetch(`/api/honor-board/${entryId}/applause`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setApplauseMap((prev) => ({ ...prev, [entryId]: data.applauseCount }));
        setSelectedEntry((prev) =>
          prev && prev.id === entryId ? { ...prev, applauseCount: data.applauseCount } : prev,
        );
      }
    } catch {
      setApplauseLoading(null);
    }
  };

  const filtered = entries.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.achievementTitle.toLowerCase().includes(q) ||
        (e.badgeLabel || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const featured = filtered.filter((e) => e.featured);
  const regular = filtered.filter((e) => !e.featured);

  const categories = Array.from(new Set(entries.map((e) => e.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            لوحة الشرف والتميز الأكاديمي
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            celebration وإنجازات أبناء الكلية — {filtered.length} سجل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث عن طالب أو إنجاز..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 pl-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedCategory === "all" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"}`}
        >
          الكل
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedCategory === cat ? meta.bg + " " + meta.color + " border shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </button>
          );
        })}

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="all">كل الأقسام</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-xs">لا توجد سجلات مطابقة للبحث</div>
      )}

      {/* Featured Section */}
      {!loading && !error && featured.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            المميزون في المنصة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map((entry) => (
              <HonorCard
                key={entry.id}
                entry={entry}
                onClick={() => setSelectedEntry(entry)}
                onApplause={handleApplause}
                applauseCount={applauseMap[entry.id] ?? entry.applauseCount}
                isApplauseLoading={applauseLoading === entry.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Grid */}
      {!loading && !error && regular.length > 0 && (
        <div className="space-y-3">
          {featured.length > 0 && (
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-6">
              جميع السجلات
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regular.map((entry) => (
              <HonorCard
                key={entry.id}
                entry={entry}
                onClick={() => setSelectedEntry(entry)}
                onApplause={handleApplause}
                applauseCount={applauseMap[entry.id] ?? entry.applauseCount}
                isApplauseLoading={applauseLoading === entry.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {selectedEntry.avatar ? (
                    <img
                      src={selectedEntry.avatar}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-lg">
                      {selectedEntry.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedEntry.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedEntry.departmentName || selectedEntry.departmentId} —{" "}
                      {selectedEntry.level}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 text-xs"
                >
                  ✕
                </button>
              </div>

              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold ${CATEGORY_META[selectedEntry.category]?.bg || "bg-slate-100"} ${CATEGORY_META[selectedEntry.category]?.color || "text-slate-700"}`}
              >
                {React.createElement(CATEGORY_META[selectedEntry.category]?.icon || Award, {
                  className: "w-3.5 h-3.5",
                })}
                {CATEGORY_META[selectedEntry.category]?.label || selectedEntry.category}
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {selectedEntry.achievementTitle}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedEntry.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedEntry.gpaOrMetric && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mb-0.5">
                      النتيجة / المعدل
                    </p>
                    <p className="text-sm font-black text-amber-900 dark:text-amber-100">
                      {selectedEntry.gpaOrMetric}
                    </p>
                  </div>
                )}
                {selectedEntry.badgeLabel && (
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mb-0.5">
                      الشارة
                    </p>
                    <p className="text-sm font-black text-indigo-900 dark:text-indigo-100">
                      {selectedEntry.badgeLabel}
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">
                    السنة الأكاديمية
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedEntry.academicYear}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">
                    تاريخ التكريم
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {new Date(selectedEntry.honoredDate).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>

              {selectedEntry.supervisorName && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4" />
                  <span>
                    المشرف الأكاديمي: <strong>{selectedEntry.supervisorName}</strong>
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleApplause(selectedEntry.id)}
                  disabled={applauseLoading === selectedEntry.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-60"
                >
                  <Heart className="w-4 h-4" />
                  {applauseMap[selectedEntry.id] ?? selectedEntry.applauseCount} تهنية
                </button>
                {selectedEntry.certificateUrl && (
                  <a
                    href={selectedEntry.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    الشهادة
                  </a>
                )}
                {selectedEntry.projectUrl && (
                  <a
                    href={selectedEntry.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    المشروع
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HonorCard: React.FC<{
  entry: HonorStudent;
  onClick: () => void;
  onApplause: (id: string) => void;
  applauseCount: number;
  isApplauseLoading: boolean;
}> = ({ entry, onClick, onApplause, applauseCount, isApplauseLoading }) => {
  const meta = CATEGORY_META[entry.category] || {
    label: entry.category,
    color: "text-slate-700",
    bg: "bg-slate-100",
    icon: Award,
  };
  const Icon = meta.icon;
  const isTop = entry.featured;

  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${isTop ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700"}`}
    >
      {isTop && (
        <div className="absolute top-3 left-3">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border ${meta.bg} ${meta.color} shrink-0`}
        >
          {entry.avatar ? (
            <img src={entry.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
              {entry.name}
            </h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${meta.bg} ${meta.color}`}
            >
              <Icon className="w-3 h-3 ml-1" />
              {meta.label}
            </span>
          </div>

          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1">
            {entry.achievementTitle}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {entry.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {entry.badgeLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                {entry.badgeLabel}
              </span>
            )}
            {entry.gpaOrMetric && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                {entry.gpaOrMetric}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(entry.honoredDate).toLocaleDateString("ar-EG", {
                month: "short",
                year: "numeric",
              })}
            </span>
            {entry.departmentName && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <Building2 className="w-3 h-3" />
                {entry.departmentName}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                {applauseCount}
              </span>
              {entry.projectUrl && <Link2 className="w-3.5 h-3.5 text-slate-400" />}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApplause(entry.id);
              }}
              disabled={isApplauseLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 transition-all disabled:opacity-60"
            >
              <Heart className="w-3.5 h-3.5" />
              أرسل تهنية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
