import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Department, PointsLedgerEntry } from '../types';
import {
  X,
  User,
  Award,
  Shield,
  CheckCircle2,
  GraduationCap,
  Edit3,
  BookOpen,
  Key,
  Smartphone,
  Laptop,
  Trash2,
  AlertCircle,
  Camera,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Lock,
  Mail,
  Hash,
  Building,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { parseApiError } from '../utils/errorUtils';
import { getAuthHeaders } from '../lib/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  departments: Department[];
  ledger: PointsLedgerEntry[];
  onUpdateBio?: (bio: string) => void;
  onUpdateProfile?: (updatedData: { name: string; avatar: string; bio: string }) => void;
}

interface SessionItem {
  id: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent?: boolean;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  departments,
  ledger,
  onUpdateBio,
  onUpdateProfile
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Editable Profile States (Only Name, Avatar, and Bio)
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [avatarInput, setAvatarInput] = useState(user?.avatar || '');
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security Form State (Preserved intact)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [secLoading, setSecLoading] = useState(false);
  const [secMessage, setSecMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sessions State (Preserved intact)
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setAvatarInput(user.avatar || '');
      setBioInput(user.bio || '');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && activeTab === 'security' && user) {
      fetchSessions();
    }
  }, [isOpen, activeTab, user]);

  if (!isOpen || !user) return null;

  const dept = departments.find((d) => d.id === user.departmentId);

  // Handle Image File Upload (auto-compresses and resizes to lightweight data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isAr ? 'يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).' : 'Please choose a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(isAr ? 'حجم الصورة يجب ألا يتجاوز 10 ميغابايت.' : 'Image size must not exceed 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const resultStr = loadEvt.target?.result as string;
      if (!resultStr) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarInput(compressedDataUrl);
          setShowAvatarPicker(false);
        } else {
          setAvatarInput(resultStr);
          setShowAvatarPicker(false);
        }
      };
      img.onerror = () => {
        setAvatarInput(resultStr);
        setShowAvatarPicker(false);
      };
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      alert(isAr ? 'يرجى إدخال اسم صحيح.' : 'Please provide a valid name.');
      return;
    }

    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    const updatedData = {
      userId: user.id,
      name: nameInput.trim(),
      avatar: avatarInput.trim(),
      bio: bioInput.trim()
    };

    try {
      // 1. Immediately apply to local state & persistent storage
      if (onUpdateProfile) {
        onUpdateProfile({
          name: updatedData.name,
          avatar: updatedData.avatar,
          bio: updatedData.bio
        });
      } else if (onUpdateBio) {
        onUpdateBio(updatedData.bio);
      }

      // 2. Synchronize with server
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(updatedData)
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.user && onUpdateProfile) {
            onUpdateProfile({
              name: resData.user.name || updatedData.name,
              avatar: resData.user.avatar || updatedData.avatar,
              bio: resData.user.bio || updatedData.bio
            });
          }
        }
      } catch (networkErr) {
        // Network sync warning, local state already saved
        console.warn('Backend profile sync deferred, local changes persisted:', networkErr);
      }

      setProfileSuccessMsg(isAr ? 'تم حفظ بيانات الملف الشخصي بنجاح!' : 'Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const hasProfileChanges =
    nameInput.trim() !== (user.name || '').trim() ||
    avatarInput.trim() !== (user.avatar || '').trim() ||
    bioInput.trim() !== (user.bio || '').trim();

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch(`/api/auth/sessions?userId=${encodeURIComponent(user.id)}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 8) {
      setSecMessage({ text: isAr ? 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.' : 'New password must be at least 8 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecMessage({ text: isAr ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.', type: 'error' });
      return;
    }

    setSecLoading(true);
    setSecMessage(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSecMessage({ text: data.message || (isAr ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!'), type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSessions();
      } else {
        setSecMessage({ text: parseApiError(data, isAr ? 'فشل تغيير كلمة المرور.' : 'Failed to change password.'), type: 'error' });
      }
    } catch (e) {
      setSecMessage({ text: isAr ? 'حدث خطأ في الاتصال بالخادم.' : 'Server connection error.', type: 'error' });
    } finally {
      setSecLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}?userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSecMessage({ text: isAr ? 'تم إنهاء الجلسة بنجاح.' : 'Session revoked successfully.', type: 'success' });
      }
    } catch (e) {
      console.error('Failed to revoke session:', e);
    }
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
        className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header Title */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isAr ? 'الملف الأكاديمي وإعدادات الحساب' : 'Academic Profile & Settings'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'تعديل بيانات الحساب، الصورة الشخصية، والأمان' : 'Manage your profile, avatar, and security'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isAr ? 'الملف الشخصي والإنجازات' : 'Profile & Achievements'}</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isAr ? 'كلمة المرور والأمان' : 'Password & Security'}</span>
          </button>
        </div>

        {/* TAB 1: PROFILE, EDITABLE INFO & ACHIEVEMENTS */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {profileSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Editable Profile Header (Avatar & Name) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-950 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Avatar with Edit Camera Overlay */}
                <div className="relative group shrink-0">
                  <img
                    src={avatarInput || user.avatar}
                    alt={nameInput || user.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-md transition-all group-hover:opacity-90"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg transition-transform active:scale-90"
                    title={isAr ? 'تغيير الصورة الشخصية' : 'Change profile picture'}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Name & Role Header */}
                <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-1.5 w-full">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start rtl:sm:justify-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                      {user.role.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {dept?.name || (isAr ? 'كلية الهندسة' : 'Faculty of Engineering')}
                    </span>
                  </div>

                  {/* Name Edit Input */}
                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'الاسم المعروض (قابل للتعديل)' : 'Display Name (Editable)'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder={isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-xs"
                      />
                      <Edit3 className="w-3.5 h-3.5 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Picker Drawer / Options */}
              <AnimatePresence>
                {showAvatarPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-500" />
                        <span>{isAr ? 'تحديد الصورة الشخصية' : 'Select Profile Picture'}</span>
                      </h4>
                      <button
                        onClick={() => setShowAvatarPicker(false)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {isAr ? 'إغلاق' : 'Close'}
                      </button>
                    </div>

                    {/* Direct Device Upload Area */}
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 border-dashed border-amber-500/50 hover:border-amber-500 bg-amber-500/10 hover:bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs transition-all active:scale-98 shadow-sm"
                      >
                        <Upload className="w-5 h-5" />
                        <span>{isAr ? 'رفع واختيار صورة مباشرة من جهازك (تصفح الملفات)' : 'Upload image directly from your device'}</span>
                      </button>
                    </div>

                    {/* Preset Avatars Gallery */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {isAr ? 'أو اختر من النماذج الجاهزة:' : 'Or choose a preset avatar:'}
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAvatarInput(url);
                              setShowAvatarPicker(false);
                            }}
                            className={`relative shrink-0 w-11 h-11 rounded-xl overflow-hidden ring-2 transition-all ${
                              avatarInput === url
                                ? 'ring-amber-500 scale-105 shadow-sm'
                                : 'ring-transparent hover:ring-slate-300 dark:hover:ring-slate-700 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                            {avatarInput === url && (
                              <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-amber-500 drop-shadow" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bio Edit Section */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'النبذة الأكاديمية والاهتمامات (قابلة للتعديل)' : 'Academic Bio & Interests (Editable)'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{bioInput.length}/500</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب نبذة عن اهتماماتك الهندسية، مشاريعك، أو مجالات تميزك الأكاديمي...'
                      : 'Share your engineering passions, project focuses, and academic goals...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium resize-none shadow-xs"
                />
              </div>

              {/* Save Profile Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {hasProfileChanges
                    ? isAr
                      ? 'لديك تعديلات غير محفوظة'
                      : 'You have unsaved changes'
                    : isAr
                    ? 'البيانات الشخصية محدثة'
                    : 'Profile details up to date'}
                </span>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || !nameInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSavingProfile
                      ? isAr
                        ? 'جاري الحفظ...'
                        : 'Saving...'
                      : isAr
                      ? 'حفظ التعديلات'
                      : 'Save Profile Changes'}
                  </span>
                </button>
              </div>
            </div>

            {/* Official Academic Details (Locked & Read-Only) */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {isAr ? 'البيانات والسجل الأكاديمي الرسمي (للقراءة فقط)' : 'Official Academic Records (Locked / Read-Only)'}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {isAr ? 'موثق' : 'Verified'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Student ID / Code */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">{isAr ? 'الرقم الجامعي' : 'Student ID'}</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.studentId}</span>
                    </div>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* University Email */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[10px] text-slate-400 font-bold">{isAr ? 'البريد الجامعي' : 'University Email'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{user.email}</span>
                    </div>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>

                {/* Academic Department */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">{isAr ? 'القسم العلمي' : 'Department'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{dept?.name || 'كلية الهندسة'}</span>
                    </div>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Level / Year */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">{isAr ? 'الفرقة الدراسية' : 'Academic Level'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user.level}</span>
                    </div>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                {isAr
                  ? '🔒 تنبيه: البيانات الأكاديمية الرسمية (القسم، الفرقة، الرقم الجامعي) موثقة ولا يمكن تعديلها إلا بمراجعة شؤون الطلاب.'
                  : '🔒 Note: Official academic registration details are institutionally verified and managed via student affairs.'}
              </p>
            </div>

            {/* Badges Earned */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {isAr ? 'الأوسمة والشهادات التقديرية' : 'Earned Recognition Badges'} ({(user.badges || []).length})
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Award className="w-4 h-4" />
                  <span>{user.points} {isAr ? 'نقطة' : 'total pts'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(user.badges || []).map((b) => (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border ${b.color} flex flex-col justify-between space-y-1`}
                  >
                    <div className="flex items-center justify-between">
                      <Award className="w-5 h-5" />
                      <span className="text-[10px] font-bold opacity-80">{b.earnedAt}</span>
                    </div>
                    <div className="font-bold text-xs">{b.name}</div>
                    <p className="text-[10px] opacity-90 line-clamp-2">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ledger History */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {isAr ? 'سجل النقاط والمساهمات' : 'Contribution Points History'}
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {ledger.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{entry.description}</p>
                      <p className="text-[10px] text-slate-400">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-extrabold text-emerald-500">+{entry.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY & ACTIVE SESSIONS (UNTOUCHED & PRESERVED EXACTLY AS IS) */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in text-xs">
            {secMessage && (
              <div
                className={`p-3 rounded-xl border font-bold flex items-center gap-2 ${
                  secMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{secMessage.text}</span>
              </div>
            )}

            {/* Password Change Form */}
            <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</span>
              </h4>

              <div>
                <label className="block text-slate-500 mb-1">{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">{isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeOtherSessions}
                  onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {isAr ? 'تسجيل الخروج من جميع الأجهزة والجلسات الأخرى فور التغيير' : 'Sign out of all other devices and sessions upon update'}
                </span>
              </label>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={secLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 text-white dark:text-slate-900 font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {secLoading ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
                </button>
              </div>
            </form>

            {/* Active Sessions */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'الأجهزة والجلسات النشطة' : 'Active Sessions & Devices'}</span>
                </h4>
                <button
                  onClick={fetchSessions}
                  className="text-xs text-amber-500 hover:underline font-bold"
                >
                  {isAr ? 'تحديث' : 'Refresh'}
                </button>
              </div>

              {loadingSessions ? (
                <p className="text-slate-400 text-center py-4">{isAr ? 'جاري فحص الجلسات...' : 'Loading sessions...'}</p>
              ) : sessions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">{isAr ? 'جلسة واحدة نشطة حالياً.' : '1 active current session.'}</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {s.userAgent?.includes('Mobile') ? '📱 Smartphone' : '💻 Browser Client'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{s.ipAddress}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {isAr ? 'نشط منذ:' : 'Last active:'} {new Date(s.lastActiveAt).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                        title={isAr ? 'إنهاء هذه الجلسة' : 'Revoke session'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

