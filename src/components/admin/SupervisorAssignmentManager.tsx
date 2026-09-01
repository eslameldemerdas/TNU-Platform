import React, { useState, useRef } from 'react';
import { Assignment, Course, Department, UserProfile } from '../../types';
import { isWithinSupervisorScope, getSupervisorScopeLabel } from '../../utils/permissionUtils';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Calendar,
  Award,
  Link as LinkIcon,
  ShieldCheck,
  Lock,
  FileText,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Upload,
  RefreshCw
} from 'lucide-react';

interface SupervisorAssignmentManagerProps {
  user: UserProfile | null;
  assignments: Assignment[];
  courses: Course[];
  departments: Department[];
  onAddAssignment: (asgn: Partial<Assignment>) => void;
  onUpdateAssignment: (id: string, asgn: Partial<Assignment>) => void;
  onDeleteAssignment: (id: string) => void;
}

export const SupervisorAssignmentManager: React.FC<SupervisorAssignmentManagerProps> = ({
  user,
  assignments,
  courses,
  departments,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Form Fields
  const [fCourseId, setFCourseId] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [fDueDate, setFDueDate] = useState('');
  const [fTotalPoints, setFTotalPoints] = useState<number>(20);
  const [fWeightPercent, setFWeightPercent] = useState<number>(10);
  const [fAttachmentUrl, setFAttachmentUrl] = useState('');
  const [fAttachmentName, setFAttachmentName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [isAttachmentDragging, setIsAttachmentDragging] = useState(false);

  const handleAttachmentFile = (file: File) => {
    setFAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFAttachmentUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter courses user can manage based on scope
  const allowedCourses = courses.filter((c) =>
    isWithinSupervisorScope(user, {
      departmentId: c.departmentId,
      level: c.level,
      courseId: c.id
    })
  );

  const scopeLabel = getSupervisorScopeLabel(user, departments);

  const openCreateModal = () => {
    setEditingAssignment(null);
    const defaultCourse = allowedCourses[0] || courses[0];
    setFCourseId(defaultCourse?.id || '');
    setFTitle('');
    setFDescription('');
    setFDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFTotalPoints(20);
    setFWeightPercent(10);
    setFAttachmentUrl('');
    setFAttachmentName('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (asgn: Assignment) => {
    const course = courses.find((c) => c.id === asgn.courseId);
    const canEdit = isWithinSupervisorScope(user, {
      departmentId: asgn.departmentId || course?.departmentId,
      level: asgn.level || course?.level,
      courseId: asgn.courseId
    });

    if (!canEdit) {
      alert('عذراً، هذا التكليف خارج نطاق اختصاصك الأكاديمي المخصص.');
      return;
    }

    setEditingAssignment(asgn);
    setFCourseId(asgn.courseId);
    setFTitle(asgn.title);
    setFDescription(asgn.description || '');
    setFDueDate(asgn.dueDate);
    setFTotalPoints(asgn.totalPoints || 20);
    setFWeightPercent(asgn.weightPercent || 10);
    setFAttachmentUrl(asgn.attachmentUrl || '');
    setFAttachmentName(asgn.attachmentName || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim()) {
      setErrorMessage('يرجى إدخال عنوان التكليف الدراسي.');
      return;
    }

    const selectedCourse = courses.find((c) => c.id === fCourseId);
    if (!selectedCourse) {
      setErrorMessage('يرجى اختيار مقرر دراسي صحيح.');
      return;
    }

    // Check scope permission before saving
    const hasPermission = isWithinSupervisorScope(user, {
      departmentId: selectedCourse.departmentId,
      level: selectedCourse.level,
      courseId: selectedCourse.id
    });

    if (!hasPermission) {
      setErrorMessage('ليس لديك صلاحية لإضافة أو تعديل التكليفات لهذا المقرر خارج نطاق اختصاصك.');
      return;
    }

    const payload: Partial<Assignment> = {
      courseId: selectedCourse.id,
      courseCode: selectedCourse.code,
      title: fTitle.trim(),
      description: fDescription.trim(),
      dueDate: fDueDate,
      totalPoints: Number(fTotalPoints) || 20,
      weightPercent: Number(fWeightPercent) || 10,
      attachmentUrl: fAttachmentUrl.trim() || undefined,
      attachmentName: fAttachmentName.trim() || undefined,
      departmentId: selectedCourse.departmentId,
      level: selectedCourse.level,
      createdByName: user?.name || 'مشرف المقرر',
      createdByRole: user?.role
    };

    if (editingAssignment) {
      onUpdateAssignment(editingAssignment.id, payload);
    } else {
      onAddAssignment({
        ...payload,
        status: 'todo'
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (asgn: Assignment) => {
    const course = courses.find((c) => c.id === asgn.courseId);
    const canDelete = isWithinSupervisorScope(user, {
      departmentId: asgn.departmentId || course?.departmentId,
      level: asgn.level || course?.level,
      courseId: asgn.courseId
    });

    if (!canDelete) {
      alert('ليس لديك صلاحية لحذف تكليفات المواد الخارجيّة عن تخصصك.');
      return;
    }

    if (window.confirm(`هل أنت أصلًا متأكد من حذف التكليف "${asgn.title}"؟`)) {
      onDeleteAssignment(asgn.id);
    }
  };

  // Filtered Assignments List
  const filteredAssignments = assignments.filter((asgn) => {
    const course = courses.find((c) => c.id === asgn.courseId);
    const matchesDept = selectedDeptId === 'all' || course?.departmentId === selectedDeptId || asgn.departmentId === selectedDeptId;
    const matchesCourse = selectedCourseId === 'all' || asgn.courseId === selectedCourseId;
    const matchesStatus = statusFilter === 'all' || asgn.status === statusFilter;
    const matchesSearch =
      asgn.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asgn.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asgn.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesCourse && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Scope Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/20 text-white space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30">
              <CheckSquare className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">إدارة وترفيع التكليفات والواجبات الأكاديمية</h2>
              <p className="text-xs text-purple-200 mt-0.5">{scopeLabel}</p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تكليف / واجب جديد</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بعنوان التكليف أو كود المادة..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">كل الأقسام الكلية</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">جميع المقررات</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">كافة حالات التسليم</option>
              <option value="todo">قيد الانتظار (تاريخ مستقبلي)</option>
              <option value="in_progress">جاري التنفيذ والتطبيق</option>
              <option value="submitted">مكتمل / تم التسليم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <CheckSquare className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد تكليفات مطابقة للبحث حالياً</h3>
          <p className="text-xs text-slate-500">يمكنك إضافة أول واجب دراسي للمقررات التابعة لنطاق إشرافك.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((asgn) => {
            const course = courses.find((c) => c.id === asgn.courseId);
            const canManage = isWithinSupervisorScope(user, {
              departmentId: asgn.departmentId || course?.departmentId,
              level: asgn.level || course?.level,
              courseId: asgn.courseId
            });

            return (
              <div
                key={asgn.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3 transition-all hover:border-purple-500/40"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-[11px]">
                      {asgn.courseCode}
                    </span>

                    {canManage ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        <span>ضمن اختصاصك</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <Lock className="w-3 h-3" />
                        <span>خارج النطاق</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                    {asgn.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {asgn.description || 'لا توجد تعليمات إضافية مذكورة لهذا التكليف.'}
                  </p>

                  {asgn.attachmentName && (
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[11px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                      <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{asgn.attachmentName}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>موعد التسليم: <strong className="text-slate-800 dark:text-slate-200">{asgn.dueDate}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>الدرجات: <strong className="text-amber-600 font-bold">{asgn.totalPoints} درجات</strong> ({asgn.weightPercent}%)</span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => openEditModal(asgn)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-700 dark:text-slate-200 hover:text-purple-600 text-xs font-bold transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      <button
                        onClick={() => handleDelete(asgn)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white text-xs font-bold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form for Add/Edit Assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {editingAssignment ? 'تعديل التكليف الأكاديمي' : 'رفع تكليف / واجب دراسي جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Course Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المقرر الدراسي (المسموح لنطاق إشرافك):
                </label>
                <select
                  value={fCourseId}
                  onChange={(e) => setFCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {courses.map((c) => {
                    const isAllowed = isWithinSupervisorScope(user, {
                      departmentId: c.departmentId,
                      level: c.level,
                      courseId: c.id
                    });
                    return (
                      <option key={c.id} value={c.id} disabled={!isAllowed}>
                        {c.code} - {c.title} {!isAllowed ? '(خارج نطاق إشرافك)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Assignment Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان التكليف / الشيت / الواجب:
                </label>
                <input
                  type="text"
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  placeholder="مثال: شيت التكليف الثاني - خوارزميات المصفوفات والفرز"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Instructions / Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  التعليمات والمتطلبات والشروط التفصيلية:
                </label>
                <textarea
                  rows={3}
                  value={fDescription}
                  onChange={(e) => setFDescription(e.target.value)}
                  placeholder="اكتب الخطوات والمطلوب تسليمه (كود، تقرير PDF، أو حزمة ZIP)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Due Date & Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    آخر موعد للتسليم (Due Date):
                  </label>
                  <input
                    type="date"
                    value={fDueDate}
                    onChange={(e) => setFDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    درجة التكليف الإجمالية:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={fTotalPoints}
                    onChange={(e) => setFTotalPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    النسبة من أعمال السنة (%):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={fWeightPercent}
                    onChange={(e) => setFWeightPercent(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Attachment File from Device */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  إرفاق ملف أو شيت التكليف (من جهازك مباشرة - PDF، Word، كود، أو صورة):
                </label>

                <input
                  type="file"
                  ref={attachmentInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAttachmentFile(file);
                  }}
                  className="hidden"
                />

                {fAttachmentUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                        {fAttachmentName || 'ملف التكليف المرفق'}
                      </span>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400">
                        تم إرفاق الملف من جهازك بنجاح
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 text-xs font-bold hover:bg-purple-50 transition-all flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تغيير</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFAttachmentUrl('');
                          setFAttachmentName('');
                          if (attachmentInputRef.current) attachmentInputRef.current.value = '';
                        }}
                        className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all"
                        title="إزالة المرفق"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => attachmentInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsAttachmentDragging(true);
                    }}
                    onDragLeave={() => setIsAttachmentDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsAttachmentDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleAttachmentFile(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-3.5 text-center cursor-pointer transition-all ${
                      isAttachmentDragging
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-purple-50/50 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                      <Upload className="w-4 h-4" />
                      <span className="text-xs font-bold">رفع ملف أو شيت التكليف من جهازك (تصفح / سحب)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      انقر لاختيار ملف (PDF, DOCX, ZIP, PNG) أو اسحبه هنا
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg transition-all"
                >
                  {editingAssignment ? 'حفظ التعديلات' : 'نشر التكليف الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
