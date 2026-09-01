import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Department, AcademicLevel, Semester, UserProfile } from '../types';
import { GraduationCap, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface OnboardingModalProps {
  departments: Department[];
  currentUser: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  departments,
  currentUser,
  onSaveProfile,
  onClose
}) => {
  const { isRTL } = useTranslation();
  const [name, setName] = useState(currentUser.name);
  const [studentId, setStudentId] = useState(currentUser.studentId);
  const [deptId, setDeptId] = useState(currentUser.departmentId);
  const [level, setLevel] = useState<AcademicLevel>(currentUser.level);
  const [semester, setSemester] = useState<Semester>(currentUser.semester);

  const levels: { value: AcademicLevel; label: string }[] = [
    { value: 'Year 1 (Freshman)', label: 'السنة الأولى (إعدادي)' },
    { value: 'Year 2 (Sophomore)', label: 'السنة الثانية - الفصل الدراسي الأول (الترم الأول)' }
  ];

  const semesters: { value: Semester; label: string }[] = [
    { value: 'Fall 2026', label: 'الفصل الدراسي الأول (خريف 2026)' },
    { value: 'Spring 2026', label: 'الفصل الدراسي الثاني (ربيع 2026)' },
    { value: 'Summer 2026', label: 'الفصل الدراسي الصيفي (صيف 2026)' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserProfile = {
      ...currentUser,
      name,
      studentId,
      departmentId: deptId,
      level,
      semester
    };
    onSaveProfile(updatedUser);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 lg:p-8 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-600 mx-auto flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            مرحباً بك في منصة EngHub الأكاديمية
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            خصص ملفك الأكاديمي لمنصة كلية الهندسة بجامعة طنطا الأهلية (TNU).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الاسم بالكامل
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك كما في الكارنيه الجامعي"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الرقم الجامعي (Student ID)
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="مثال: 202604812"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              اختر القسم العلمي (كلية الهندسة - جامعة طنطا الأهلية)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {departments.map((d) => {
                const isSelected = deptId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDeptId(d.id)}
                    className={`p-3.5 rounded-xl border text-right transition-all relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-slate-100 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        {d.code}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="font-bold text-xs">{d.name}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {d.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic Level & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الفرقة الدراسية
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as AcademicLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {levels.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الفصل الدراسي الحالي
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as Semester)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {semesters.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[44px]"
          >
            <span>حفظ البيانات والبدء في استخدام EngHub</span>
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
