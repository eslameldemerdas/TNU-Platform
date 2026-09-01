import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Department, UserProfile } from '../types';
import { parseApiError } from '../utils/errorUtils';
import { setSessionToken } from '../lib/storage';

export type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  departments,
  onAuthSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-cmp-01');
  const [level, setLevel] = useState('Year 1 (Freshman)');

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Messaging
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset errors when mode changes
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [mode]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Live Password Strength Calculations
  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const getStrengthScore = () => {
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasNumberOrSymbol) score += 1;
    if (hasLetter) score += 1;
    if (hasUpper) score += 1;
    return score;
  };

  const strengthScore = getStrengthScore();

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setIsLoading(true);

    // Timeout safety protection (6 seconds max)
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrorMessage('انتهت مهلة الطلب. يرجى التحقق من اتصال الشبكة وإعادة المحاولة.');
    }, 6000);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(parseApiError(data, 'فشل تسجيل الدخول. يرجى التأكد من صحة البيانات.'));
        setIsLoading(false);
        return;
      }

      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
      }

      setSuccessMessage(data.message || 'تم تسجيل الدخول بنجاح!');
      setTimeout(() => {
        setIsLoading(false);
        onAuthSuccess(data.user);
        onClose();
      }, 600);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setErrorMessage('Unable to connect to authentication server.');
    }
  };

  // Handle Signup Submit
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('يرجى إدخال بريد إلكتروني أكاديمي صحيح.');
      return;
    }

    const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      setErrorMessage('يرجى إدخال رقم هاتف صحيح (مثال: +201012345678).');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }

    if (!hasNumberOrSymbol || !hasLetter) {
      setErrorMessage('يجب أن تحتوي كلمة المرور على حرف واحد ورقم أو رمز على الأقل.');
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrorMessage('انتهت مهلة الإنشاء. يرجى إعادة المحاولة.');
    }, 6000);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          password,
          passwordConfirm,
          departmentId,
          level
        })
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(parseApiError(data, 'فشل عملية التسجيل.'));
        setIsLoading(false);
        return;
      }

      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
      }

      setSuccessMessage(data.message || 'تم إنشاء الحساب بنجاح! مرحباً بك في EngHub.');
      setTimeout(() => {
        setIsLoading(false);
        onAuthSuccess(data.user);
        onClose();
      }, 700);
    } catch (err) {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setErrorMessage('Network connection error during signup.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-2xl shadow-2xl p-5 sm:p-6 min-h-screen sm:min-h-0 flex flex-col justify-between"
      >
        <div>
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {mode === 'login' ? 'تسجيل الدخول إلى EngHub' : 'إنشاء حساب طالب جديد'}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  جامعة طنطا الأهلية - كلية الهندسة (TNU)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 mb-4">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              إنشاء حساب
            </button>
          </div>



          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-snug">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Banner */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <div className="space-y-1">
                  <p className="font-semibold leading-snug">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM BODY */}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني الأكاديمي
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="student@tnu.edu.eg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full ltr:pl-9 ltr:pr-10 rtl:pr-9 rtl:pl-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 min-h-[44px] transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3 max-h-[60vh] overflow-y-auto ltr:pr-1 rtl:pl-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم بالكامل
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="أدخل اسمك بالكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الأكاديمي
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="student@tnu.edu.eg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+201012345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    القسم العلمي
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الفرقة الدراسية
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  >
                    <option value="Year 1 (Freshman)">السنة الأولى (إعدادي)</option>
                    <option value="Year 2 (Sophomore)">السنة الثانية - الفصل الدراسي الأول (الترم الأول)</option>
                  </select>
                </div>
              </div>

              {/* Password Fields & Live Validator */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="أنشئ كلمة مرور قوية"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full ltr:pl-9 ltr:pr-10 rtl:pr-9 rtl:pl-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">قوة كلمة المرور:</span>
                      <span
                        className={
                          strengthScore <= 1
                            ? 'text-rose-500'
                            : strengthScore <= 3
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }
                      >
                        {strengthScore <= 1 ? 'ضعيفة' : strengthScore <= 3 ? 'متوسطة' : 'قوية جداً'}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all flex-1 ${
                          strengthScore >= 1
                            ? strengthScore <= 1
                              ? 'bg-rose-500'
                              : strengthScore <= 3
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full transition-all flex-1 ${
                          strengthScore >= 2
                            ? strengthScore <= 3
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full transition-all flex-1 ${
                          strengthScore >= 3 ? 'bg-emerald-500' : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full transition-all flex-1 ${
                          strengthScore >= 4 ? 'bg-emerald-500' : 'bg-transparent'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                      <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>8+ أحرف</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasNumberOrSymbol ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>رقم أو رمز خاص</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasLetter ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>حرف واحد على الأقل</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>حرف كبير (Capital)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="أعد كتابة كلمة المرور"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full ltr:pl-9 ltr:pr-10 rtl:pr-9 rtl:pl-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 min-h-[44px] transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري إنشاء الحساب...</span>
                  </>
                ) : (
                  <>
                    <span>إكمال التسجيل (+25 نقطة)</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>حماية مشفرة بنظام Bcrypt ونظام حماية معدل الطلبات الأكاديمي</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
