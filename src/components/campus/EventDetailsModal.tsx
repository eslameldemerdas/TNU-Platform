import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  UserCheck,
  Award,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Tag,
  CheckCircle2,
  Share2,
  Sparkles,
} from "lucide-react";
import React from "react";
import { CampusEvent } from "../../types";

interface EventDetailsModalProps {
  event: CampusEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleRSVP: (eventId: string) => void;
  userEmail?: string;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onToggleRSVP,
  _userEmail,
}) => {
  if (!isOpen || !event) return null;

  const maxCap = event.maxCapacity || 50;
  const currentRsvp = event.rsvpCount || 0;
  const seatsLeft = Math.max(0, maxCap - currentRsvp);
  const isFull = seatsLeft === 0 && !event.hasRsvped;
  const capacityPercent = Math.min(100, Math.round((currentRsvp / maxCap) * 100));

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event.title,
          text: `انضم إلى فعالية "${event.title}" في ${event.location}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ رابط الفعالية إلى الحافظة!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Banner Header */}
        <div className="relative h-44 sm:h-56 bg-slate-950 shrink-0">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-indigo-400/30" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500 text-white shadow-md uppercase tracking-wide">
                {event.category}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all border border-white/10"
                  title="مشاركة الفعالية"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                {event.title}
              </h2>
              <p className="text-xs text-indigo-200 mt-1 font-semibold flex items-center gap-1.5">
                <span>الجهة المنظمة:</span>
                <span className="text-white">{event.organizer}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Logistics Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/30 border border-indigo-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                  التاريخ والوقت
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {event.date}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {event.time}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/30 border border-amber-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                  الموقع / القاعة
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {event.location}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                  السعة والحضور
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {currentRsvp} / {maxCap} مسجل
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                  {seatsLeft > 0 ? `متبقي ${seatsLeft} مقعد` : "اكتمل العدد"}
                </span>
              </div>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                نسبة المقاعد المحجوزة
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {capacityPercent}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPercent >= 100
                    ? "bg-rose-500"
                    : capacityPercent >= 80
                      ? "bg-amber-500"
                      : "bg-indigo-600"
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          {/* Speaker Spotlight */}
          {event.speaker && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-2 border border-indigo-500/30 shadow-md">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>المحاضر / الضيف الرئيس</span>
              </div>
              <h4 className="text-base font-black text-slate-100">{event.speaker}</h4>
              {event.speakerTitle && (
                <p className="text-xs text-indigo-200 font-medium">{event.speakerTitle}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>نبذة عن الفعالية والبرنامج</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
              {event.description}
            </p>
          </div>

          {/* Target Audience & Requirements */}
          {(event.targetAudience || event.requirements) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.targetAudience && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-500 block uppercase">
                    الفئة المستهدفة
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {event.targetAudience}
                  </p>
                </div>
              )}

              {event.requirements && (
                <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block uppercase flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>المتطلبات المسبقة</span>
                  </span>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {event.requirements}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Agenda Steps */}
          {event.agenda && event.agenda.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>الجدول الزمني للفعالية</span>
              </h3>
              <div className="space-y-2 border-r-2 border-indigo-500/30 pr-3 mr-2">
                {event.agenda.map((item, idx) => (
                  <div key={idx} className="relative pr-4">
                    <div className="absolute right-[-17px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                    <span className="text-[11px] font-extrabold text-indigo-500 block">
                      {item.time}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.topic}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {event.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Contact Info */}
          {(event.contactEmail || event.contactPhone) && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800">
              {event.contactEmail && (
                <a
                  href={`mailto:${event.contactEmail}`}
                  className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{event.contactEmail}</span>
                </a>
              )}
              {event.contactPhone && (
                <a
                  href={`tel:${event.contactPhone}`}
                  className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{event.contactPhone}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs">
            {event.hasRsvped ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>أنت مسجل بنجاح في هذه الفعالية</span>
              </span>
            ) : isFull ? (
              <span className="font-bold text-rose-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>عذراً، اكتمل العدد المخصص للفعالية</span>
              </span>
            ) : (
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                باقي {seatsLeft} مقعد متاح للحق بالحجز
              </span>
            )}
          </div>

          <button
            onClick={() => onToggleRSVP(event.id)}
            disabled={isFull}
            className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 min-h-[42px] ${
              event.hasRsvped
                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                : isFull
                  ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/20"
            }`}
          >
            {event.hasRsvped ? (
              <>
                <X className="w-4 h-4" />
                <span>إلغاء التسجيل</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>تأكيد التسجيل الآن</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
