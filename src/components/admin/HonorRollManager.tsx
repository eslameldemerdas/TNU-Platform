import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Save,
  X,
  Award,
  GraduationCap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  Flame,
  Crown,
  Sparkles,
  Medal,
  Heart,
  Upload,
  FileText,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { UserProfile, Department, HonorStudent, HonorCategory } from "../../types";
import { ConfirmModal } from "../common/ConfirmModal";

interface HonorRollManagerProps {
  departments: Department[];
  currentUser: UserProfile;
}

const CATEGORY_META: Record<
  HonorCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  academic_excellence: { label: "تفوق دراسي", icon: GraduationCap, color: "text-blue-600" },
  hackathon_competition: { label: "هاكاثونات", icon: Flame, color: "text-purple-600" },
  scientific_research: { label: "أبحاث", icon: BookOpen, color: "text-emerald-600" },
  graduation_project: { label: "مشاريع تخرج", icon: Award, color: "text-indigo-600" },
  robotics_ai: { label: "روبوتات/ذكاء اصطناعي", icon: Sparkles, color: "text-cyan-600" },
  innovation_patents: { label: "ابتكارات", icon: Crown, color: "text-amber-600" },
  student_leadership: { label: "قيادة طلابية", icon: Medal, color: "text-rose-600" },
  community_impact: { label: "خدمة مجتمعية", icon: Heart, color: "text-teal-600" },
};

export const HonorRollManager: React.FC<HonorRollManagerProps> = ({
  departments,
  _currentUser,
}) => {
  const [entries, setEntries] = useState<HonorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HonorStudent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HonorStudent | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);
  const [certificateFileName, setCertificateFileName] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarFileName, setAvatarFileName] = useState("");

  const [form, setForm] = useState({
    userId: "",
    name: "",
    studentId: "",
    email: "",
    avatar: "",
    departmentId: departments[0]?.id || "",
    departmentName: "",
    level: "",
    semester: "",
    achievementTitle: "",
    category: "academic_excellence" as HonorCategory,
    description: "",
    honoredDate: "",
    academicYear:
      new Date().getFullYear().toString() + "/" + (new Date().getFullYear() + 1).toString(),
    gpaOrMetric: "",
    badgeLabel: "",
    certificateUrl: "",
    projectUrl: "",
    supervisorName: "",
    featured: false,
    tags: "",
  });

  const resetForm = () => {
    setForm({
      userId: "",
      name: "",
      studentId: "",
      email: "",
      avatar: "",
      departmentId: departments[0]?.id || "",
      departmentName: "",
      level: "",
      semester: "",
      achievementTitle: "",
      category: "academic_excellence",
      description: "",
      honoredDate: "",
      academicYear:
        new Date().getFullYear().toString() + "/" + (new Date().getFullYear() + 1).toString(),
      gpaOrMetric: "",
      badgeLabel: "",
      certificateUrl: "",
      projectUrl: "",
      supervisorName: "",
      featured: false,
      tags: "",
    });
    setCertificateFileName("");
    if (certificateInputRef.current) certificateInputRef.current.value = "";
    setAvatarFileName("");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setEditingEntry(null);
    setShowForm(false);
  };

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/honor-board?limit=200");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries();
  }, []);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("يرجى اختيار ملف صورة أو PDF صالح.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("حجم الملف يجب ألا يتجاوز 10 ميغابايت.");
      return;
    }

    setCertificateFileName(file.name);

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const resultStr = (loadEvt.target as FileReader)?.result as string;
      if (!resultStr) return;
      setForm({ ...form, certificateUrl: resultStr });
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("حجم الصورة يجب ألا يتجاوز 10 ميغابايت.");
      return;
    }

    setAvatarFileName(file.name);

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const resultStr = (loadEvt.target as FileReader)?.result as string;
      if (!resultStr) return;
      setForm({ ...form, avatar: resultStr });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (!payload.honoredDate) payload.honoredDate = new Date().toISOString().split("T")[0];

      const url = editingEntry ? `/api/honor-board/${editingEntry.id}` : "/api/honor-board";
      const method = editingEntry ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed");
      }

      resetForm();
      fetchEntries();
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/honor-board/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteTarget(null);
      fetchEntries();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (entry: HonorStudent) => {
    setEditingEntry(entry);
    setForm({
      userId: entry.userId,
      name: entry.name,
      studentId: entry.studentId || "",
      email: entry.email || "",
      avatar: entry.avatar || "",
      departmentId: entry.departmentId,
      departmentName: entry.departmentName || "",
      level: entry.level,
      semester: entry.semester || "",
      achievementTitle: entry.achievementTitle,
      category: entry.category,
      description: entry.description,
      honoredDate: new Date(entry.honoredDate).toISOString().split("T")[0],
      academicYear: entry.academicYear,
      gpaOrMetric: entry.gpaOrMetric || "",
      badgeLabel: entry.badgeLabel || "",
      certificateUrl: entry.certificateUrl || "",
      projectUrl: entry.projectUrl || "",
      supervisorName: entry.supervisorName || "",
      featured: entry.featured,
      tags: (entry.tags || []).join(", "),
    });
    setCertificateFileName(entry.certificateUrl ? "الشهادة الحالية" : "");
    setAvatarFileName(entry.avatar ? "الصورة الشخصية الحالية" : "");
    setShowForm(true);
  };

  const filtered = entries.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.achievementTitle.toLowerCase().includes(q);
    }
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(entries.map((e) => e.category)));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            إدارة لوحة الشرف والطلاب المتميزين
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {entries.length} سجل مسجل
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          إضافة طالب متميز
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث عن طالب أو إنجاز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="all">كل الفئات</option>
          {categories.map((c) => {
            const meta = CATEGORY_META[c as HonorCategory];
            return (
              <option key={c} value={c}>
                {meta?.label || c}
              </option>
            );
          })}
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
        <div className="text-center py-12 text-slate-400 text-xs">لا توجد سجلات</div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const meta = CATEGORY_META[entry.category] || {
              label: entry.category,
              icon: Award,
              color: "text-slate-600",
            };
            const Icon = meta.icon;
            const isExpanded = expandedId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${entry.featured ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"}`}
                  >
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt=""
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${entry.featured ? "text-amber-500" : "text-slate-500"}`}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {entry.name}
                      </h4>
                      {entry.featured && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-semibold">
                      {entry.achievementTitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${entry.featured ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 text-amber-700 dark:text-amber-300" : "bg-slate-50 dark:bg-slate-700 border-slate-200 text-slate-600 dark:text-slate-300"}`}
                      >
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{entry.academicYear}</span>
                      {entry.badgeLabel && (
                        <span className="text-[10px] text-amber-600 font-bold">
                          {entry.badgeLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(entry)}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(entry)}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-slate-500 hover:text-red-600 transition-all"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-all"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/30">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">القسم</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {entry.departmentName || entry.departmentId}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">المستوى</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {entry.level}
                          {entry.semester ? " - " + entry.semester : ""}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">البريد</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {entry.email || "—"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">تاريخ التكريم</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {new Date(entry.honoredDate).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">المشرف</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {entry.supervisorName || "—"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">التهنئات</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {entry.applauseCount} 👏
                        </p>
                      </div>
                    </div>
                    {entry.gpaOrMetric && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-100">
                        النتيجة: {entry.gpaOrMetric}
                      </div>
                    )}
                    {entry.description && (
                      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {entry.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {entry.certificateUrl && (
                        <a
                          href={entry.certificateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-600 hover:underline"
                        >
                          الشهادة
                        </a>
                      )}
                      {entry.projectUrl && (
                        <a
                          href={entry.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-600 hover:underline"
                        >
                          المشروع
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full my-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 sticky top-0">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                {editingEntry ? "تعديل سجل لوحة الشرف" : "إضافة طالب متميز جديد"}
              </h3>
              <button
                onClick={resetForm}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    الاسم الكامل *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    القسم *
                  </label>
                  <select
                    required
                    value={form.departmentId}
                    onChange={(e) => {
                      const dept = departments.find((d) => d.id === e.target.value);
                      setForm({
                        ...form,
                        departmentId: e.target.value,
                        departmentName: dept?.name || "",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    المستوى *
                  </label>
                  <input
                    required
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    الفئة *
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as HonorCategory })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {Object.entries(CATEGORY_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    السنة الأكاديمية *
                  </label>
                  <input
                    required
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  الصورة الشخصية للطالب
                </label>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                {form.avatar ? (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <img
                      src={form.avatar}
                      alt="Avatar"
                      className="w-10 h-10 rounded-lg object-cover border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block truncate">
                        {avatarFileName || "الصورة الشخصية"}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        تم اختيار الصورة بنجاح
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-[11px] font-bold hover:bg-slate-50"
                      >
                        تغيير
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, avatar: "" });
                          setAvatarFileName("");
                          if (avatarInputRef.current) avatarInputRef.current.value = "";
                        }}
                        className="p-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                        title="إزالة الصورة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-500/5 transition-all"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Upload className="w-4 h-4" />
                      <span className="text-[11px] font-bold">رفع صورة شخصية من جهازك</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  عنوان الإنجاز *
                </label>
                <input
                  required
                  value={form.achievementTitle}
                  onChange={(e) => setForm({ ...form, achievementTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  الوصف *
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    تاريخ التكريم
                  </label>
                  <input
                    type="date"
                    value={form.honoredDate}
                    onChange={(e) => setForm({ ...form, honoredDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    المعدل / النتيجة
                  </label>
                  <input
                    value={form.gpaOrMetric}
                    onChange={(e) => setForm({ ...form, gpaOrMetric: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  الشارة
                </label>
                <input
                  value={form.badgeLabel}
                  onChange={(e) => setForm({ ...form, badgeLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  المشرف الأكاديمي
                </label>
                <input
                  value={form.supervisorName}
                  onChange={(e) => setForm({ ...form, supervisorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    الشهادة / الوثيقة
                  </label>
                  <input
                    ref={certificateInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleCertificateUpload}
                    className="hidden"
                  />
                  {form.certificateUrl ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {form.certificateUrl.startsWith("data:") ? (
                        <img
                          src={form.certificateUrl}
                          alt="Certificate"
                          className="w-10 h-10 rounded-lg object-cover border shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {certificateFileName || "الشهادة"}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          تم اختيار الملف بنجاح
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => certificateInputRef.current?.click()}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-[11px] font-bold hover:bg-slate-50"
                        >
                          تغيير
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForm({ ...form, certificateUrl: "" });
                            setCertificateFileName("");
                            if (certificateInputRef.current) certificateInputRef.current.value = "";
                          }}
                          className="p-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                          title="إزالة الشهادة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => certificateInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-500/5 transition-all"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Upload className="w-4 h-4" />
                        <span className="text-[11px] font-bold">رفع الشهادة من جهازك</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    رابط المشروع
                  </label>
                  <input
                    value={form.projectUrl}
                    onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  الوسوم (مفصولة بفاصلة)
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <label
                  htmlFor="featured"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  تثبيت في قسم المميزين (Featured)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  {editingEntry ? "حفظ التعديلات" : "إضافة للسجل"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="حذف سجل من لوحة الشرف"
          message={`هل أنت متأكد من حذف "${deleteTarget.name}" من لوحة الشرف؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          variant="danger"
        />
      )}
    </div>
  );
};
