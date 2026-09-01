import React, { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Announcement,
  CampusEvent,
  LostFoundItem,
  MarketplaceItem,
  StudentClub,
  Department
} from '../../types';
import {
  Building2,
  Bell,
  Calendar,
  Search,
  Tag,
  ShoppingBag,
  Plus,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  Phone,
  Pin,
  AlertCircle,
  Eye,
  UserCheck,
  Award,
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  MessageCircle,
  Trash2,
  Camera,
  ExternalLink
} from 'lucide-react';
import { EventDetailsModal } from './EventDetailsModal';
import { ScrollableTabs, ScrollableTabItem } from '../common/ScrollableTabs';

interface CampusHubViewProps {
  announcements: Announcement[];
  events: CampusEvent[];
  lostFound: LostFoundItem[];
  marketplace: MarketplaceItem[];
  clubs: StudentClub[];
  departments: Department[];
  onToggleRSVP: (eventId: string) => void;
  onToggleClubJoin: (clubId: string) => void;
  onAddMarketplaceItem: (item: Partial<MarketplaceItem>) => void;
  onAddLostFoundItem: (item: Partial<LostFoundItem>) => void;
}

export const CampusHubView: React.FC<CampusHubViewProps> = ({
  announcements,
  events,
  lostFound,
  marketplace,
  clubs,
  departments,
  onToggleRSVP,
  onToggleClubJoin,
  onAddMarketplaceItem,
  onAddLostFoundItem
}) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'announcements' | 'events' | 'marketplace' | 'lost_found' | 'clubs'>('announcements');
  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({});

  // Event Details Modal & Filter State
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [selectedEventCat, setSelectedEventCat] = useState<string>('all');
  const [selectedModalEvent, setSelectedModalEvent] = useState<CampusEvent | null>(null);

  // Marketplace Modal
  const [showMktModal, setShowMktModal] = useState(false);
  const [mktTitle, setMktTitle] = useState('');
  const [mktPrice, setMktPrice] = useState<number>(25);
  const [mktCategory, setMktCategory] = useState<'textbook' | 'hardware_kit' | 'drawing_gear' | 'components' | 'other'>('textbook');
  const [mktCondition, setMktCondition] = useState<'like_new' | 'good' | 'fair'>('good');
  const [mktDesc, setMktDesc] = useState('');
  const [mktContact, setMktContact] = useState('');
  const [mktWhatsapp, setMktWhatsapp] = useState('');
  const [mktImages, setMktImages] = useState<string[]>([]);
  const [mktError, setMktError] = useState<string | null>(null);
  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<string, number>>({});

  // Lost & Found Modal
  const [showLafModal, setShowLafModal] = useState(false);
  const [lafTitle, setLafTitle] = useState('');
  const [lafLocation, setLafLocation] = useState('');
  const [lafDesc, setLafDesc] = useState('');
  const [lafContact, setLafContact] = useState('');
  const [lafType, setLafType] = useState<'lost' | 'found'>('lost');

  const toggleContactReveal = (id: string) => {
    setRevealedContacts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let processedCount = 0;
    const newImages: string[] = [];

    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
        }
        processedCount++;
        if (processedCount === fileList.length) {
          setMktImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeMktImage = (index: number) => {
    setMktImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateMarketplace = (e: React.FormEvent) => {
    e.preventDefault();
    setMktError(null);

    const cleanWhatsapp = mktWhatsapp.trim();
    if (!mktTitle.trim()) {
      setMktError('Please provide an item title.');
      return;
    }
    if (!cleanWhatsapp) {
      setMktError('WhatsApp number is mandatory to post a listing so buyers can message you directly.');
      return;
    }

    onAddMarketplaceItem({
      title: mktTitle.trim(),
      price: mktPrice || 0,
      description: mktDesc.trim(),
      category: mktCategory,
      condition: mktCondition,
      contactInfo: mktContact.trim() || `WhatsApp: ${cleanWhatsapp}`,
      whatsappNumber: cleanWhatsapp,
      images: mktImages,
      image: mktImages.length > 0 ? mktImages[0] : undefined
    });

    setMktTitle('');
    setMktPrice(25);
    setMktCategory('textbook');
    setMktCondition('good');
    setMktDesc('');
    setMktContact('');
    setMktWhatsapp('');
    setMktImages([]);
    setMktError(null);
    setShowMktModal(false);
  };

  const handleCreateLostFound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lafTitle || !lafContact) return;
    onAddLostFoundItem({
      title: lafTitle,
      location: lafLocation,
      description: lafDesc,
      contactInfo: lafContact,
      type: lafType,
      category: 'calculator'
    });
    setLafTitle('');
    setLafLocation('');
    setLafDesc('');
    setLafContact('');
    setShowLafModal(false);
  };

  const campusTabs: ScrollableTabItem[] = [
    {
      id: 'announcements',
      label: t.campus.announcementsSubTab,
      icon: <Bell className="w-4 h-4" />
    },
    {
      id: 'events',
      label: t.campus.eventsSubTab,
      icon: <Calendar className="w-4 h-4" />
    },
    {
      id: 'marketplace',
      label: t.campus.marketplaceSubTab,
      icon: <ShoppingBag className="w-4 h-4" />
    },
    {
      id: 'lost_found',
      label: t.campus.lostFoundSubTab,
      icon: <Search className="w-4 h-4" />
    },
    {
      id: 'clubs',
      label: t.campus.clubsSubTab,
      icon: <Users className="w-4 h-4" />
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Sub Tab Selection Bar using ScrollableTabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <ScrollableTabs
          tabs={campusTabs}
          activeTab={activeSubTab}
          onTabChange={(id) => setActiveSubTab(id as any)}
          ariaLabel="شريط تبويبات الحياة الجامعية"
        />
      </div>

      {/* 1. ANNOUNCEMENTS */}
      {activeSubTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {t.campus.facultyAnnouncements}
            </h3>
          </div>

          <div className="space-y-3">
            {announcements.map((anc) => (
              <div
                key={anc.id}
                className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm space-y-2 ${
                  anc.isPinned ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/10' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {anc.isPinned && <Pin className="w-4 h-4 text-amber-500" />}
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {anc.scope} scope
                    </span>
                    <span className="text-xs text-slate-400">{anc.date}</span>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      anc.priority === 'urgent'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {anc.priority}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{anc.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{anc.content}</p>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  Issued by: {anc.authorName} ({anc.authorRole})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CAMPUS EVENTS */}
      {activeSubTab === 'events' && (
        <div className="space-y-6">
          
          {/* Header & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <span>الأنشطة الطلابية والفعاليات الأكاديمية المنشورة</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                استكشف الورش التدريبية، الهكاثونات، والندوات المتاحة وسجل حضورك بنقرة واحدة.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={eventSearchQuery}
                onChange={(e) => setEventSearchQuery(e.target.value)}
                placeholder="بحث في الفعاليات والورش..."
                className="w-full pr-9 pl-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'workshop', label: '💻 ورش عمل' },
              { id: 'hackathon', label: '⚡ هكاثونات' },
              { id: 'guest_lecture', label: '🎤 ندوات ومحاضرات' },
              { id: 'field_trip', label: '🚌 رحلات ميدانية' },
              { id: 'competition', label: '🏆 مسابقات' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedEventCat(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedEventCat === cat.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {(() => {
            const filteredEvents = events.filter((evt) => {
              if (evt.status === 'draft' || evt.status === 'cancelled') return false;
              if (selectedEventCat !== 'all' && evt.category !== selectedEventCat) return false;
              if (eventSearchQuery.trim()) {
                const q = eventSearchQuery.toLowerCase();
                const matchTitle = evt.title.toLowerCase().includes(q);
                const matchDesc = evt.description.toLowerCase().includes(q);
                const matchSpeaker = evt.speaker?.toLowerCase().includes(q);
                return matchTitle || matchDesc || matchSpeaker;
              }
              return true;
            });

            if (filteredEvents.length === 0) {
              return (
                <div className="py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  لا توجد أفعاليات مطابقة للبحث حالياً.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((evt) => {
                  const cap = evt.maxCapacity || 50;
                  const rsvps = evt.rsvpCount || 0;
                  const seatsLeft = Math.max(0, cap - rsvps);
                  const isFull = seatsLeft === 0 && !evt.hasRsvped;

                  return (
                    <div
                      key={evt.id}
                      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
                    >
                      {/* Banner Image */}
                      {evt.image ? (
                        <div className="h-40 relative overflow-hidden bg-slate-900">
                          <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 flex items-end justify-between">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white uppercase border border-white/10">
                              {evt.category}
                            </span>

                            {evt.speaker && (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-600/90 backdrop-blur-md text-white flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                <span>{evt.speaker}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 bg-gradient-to-r from-indigo-900 to-slate-900 p-4 flex items-center justify-between text-white">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 uppercase">
                            {evt.category}
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                            {evt.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {evt.description}
                          </p>
                        </div>

                        {/* Event Details Row */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{evt.date} • {evt.time}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        </div>

                        {/* Seat Availability Bar */}
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-600 dark:text-slate-300">مقاعد المحجوزة:</span>
                            <span className="text-indigo-600 dark:text-indigo-400">
                              {rsvps} / {cap} ({seatsLeft > 0 ? `باقي ${seatsLeft}` : 'اكتمل'})
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFull ? 'bg-rose-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${Math.min(100, Math.round((rsvps / cap) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => setSelectedModalEvent(evt)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض التفاصيل</span>
                          </button>

                          <button
                            onClick={() => onToggleRSVP(evt.id)}
                            disabled={isFull}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                              evt.hasRsvped
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : isFull
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                            }`}
                          >
                            {evt.hasRsvped ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>مسجل بنجاح</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>حجز مقعد</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. STUDENT MARKETPLACE */}
      {activeSubTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-500" />
                <span>Peer Engineering Marketplace (Textbooks & Kits)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buy and sell used engineering textbooks, lab kits, calculators, and components directly with students.
              </p>
            </div>

            <button
              onClick={() => setShowMktModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Post Listing</span>
            </button>
          </div>

          {showMktModal && (
            <form onSubmit={handleCreateMarketplace} className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-4 text-xs shadow-lg">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  <span>Sell Textbook or Engineering Hardware</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowMktModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {mktError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-medium flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{mktError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Item Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Modern Control Systems (13th Ed) or Saleae Logic Analyzer Kit"
                  required
                  value={mktTitle}
                  onChange={(e) => setMktTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={mktCategory}
                    onChange={(e) => setMktCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100"
                  >
                    <option value="textbook">Textbook</option>
                    <option value="hardware_kit">Hardware / Lab Kit</option>
                    <option value="drawing_gear font-medium">Engineering Drawing Tools</option>
                    <option value="components">Electronic Components</option>
                    <option value="other">Other Gear</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={mktCondition}
                    onChange={(e) => setMktCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100"
                  >
                    <option value="like_new">Like New</option>
                    <option value="good">Good Condition</option>
                    <option value="fair">Fair / Used</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Price ($)"
                    required
                    min={0}
                    value={Number.isNaN(mktPrice) || mktPrice === undefined ? '' : mktPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setMktPrice(Number.isNaN(val) ? ('' as any) : val);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* MANDATORY WHATSAPP FIELD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div>
                  <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 fill-current text-emerald-600 shrink-0" viewBox="0 0 24 24">
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001L2 22l5.122-1.334c1.464.799 3.111 1.218 4.88 1.219h.005c5.507 0 9.991-4.479 9.992-9.986.001-2.667-1.033-5.173-2.913-7.054A9.923 9.923 0 0012.012 2zm.005 18.232h-.004a8.28 8.28 0 01-4.22-1.157l-.303-.18-3.136.818.835-3.058-.198-.314a8.272 8.272 0 01-1.267-4.357c.001-4.568 3.719-8.286 8.288-8.286 2.213 0 4.292.862 5.856 2.428a8.23 8.23 0 012.423 5.857c-.001 4.569-3.719 8.287-8.284 8.287zm4.542-6.204c-.249-.125-1.472-.726-1.7-.809-.228-.083-.394-.125-.56.125-.166.249-.643.809-.788.975-.145.166-.29.187-.539.062a6.793 6.793 0 01-1.998-1.231 7.483 7.483 0 01-1.383-1.722c-.145-.249-.015-.384.109-.508.112-.112.249-.29.373-.435.125-.145.166-.249.249-.415.083-.166.042-.311-.021-.435-.062-.125-.56-1.349-.767-1.846-.202-.485-.407-.419-.56-.427l-.477-.008c-.166 0-.435.062-.663.311-.228.249-.871.85-.871 2.074 0 1.224.891 2.406 1.015 2.572.125.166 1.752 2.675 4.244 3.752.593.256 1.056.409 1.417.524.595.189 1.136.162 1.564.098.477-.071 1.472-.601 1.679-1.182.207-.581.207-1.078.145-1.182-.062-.104-.228-.187-.477-.312z" />
                    </svg>
                    <span>WhatsApp Number (Required) <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +20 101 234 5678"
                    required
                    value={mktWhatsapp}
                    onChange={(e) => setMktWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Other Contact Info (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Telegram / Email / Campus spot"
                    value={mktContact}
                    onChange={(e) => setMktContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe condition, edition, included components or notes..."
                  value={mktDesc}
                  onChange={(e) => setMktDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* UPLOAD PHOTOS FROM DEVICE */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-500" />
                  <span>Upload Item Photos from Device</span>
                </label>

                <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-800/60 rounded-2xl p-4 text-center bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 transition-colors">
                  <input
                    type="file"
                    id="mkt-device-photos"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="mkt-device-photos"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold"
                  >
                    <Upload className="w-6 h-6 animate-bounce" />
                    <span>Choose photos from device</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Click to select image files (JPG, PNG, WEBP) from your phone or computer
                    </span>
                  </label>
                </div>

                {mktImages.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Uploaded Photos ({mktImages.length}):
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {mktImages.map((img, index) => (
                        <div key={index} className="relative group shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                          <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeMktImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-90 hover:opacity-100 shadow transition-opacity"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMktModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  Post Listing
                </button>
              </div>
            </form>
          )}

          {/* MARKETPLACE LISTINGS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketplace.map((item) => {
              const itemPhotos = item.images && item.images.length > 0
                ? item.images
                : item.image
                ? [item.image]
                : [];
              const selectedImgIdx = activeImageIndexes[item.id] || 0;
              const activePhoto = itemPhotos[selectedImgIdx] || itemPhotos[0];

              const formatWhatsappUrl = (phone: string, title: string) => {
                const digits = phone.replace(/[^0-9]/g, '');
                const message = encodeURIComponent(`Hello! I am interested in your item "${title}" on GNUE Engineering Marketplace.`);
                return digits ? `https://wa.me/${digits}?text=${message}` : `https://wa.me/?text=${message}`;
              };

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    {/* Item Photos Display */}
                    {itemPhotos.length > 0 ? (
                      <div className="space-y-2">
                        <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-100 dark:border-slate-800">
                          <img
                            src={activePhoto}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Thumbnail selector if multiple photos */}
                        {itemPhotos.length > 1 && (
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {itemPhotos.map((photo, pIdx) => (
                              <button
                                key={pIdx}
                                onClick={() => setActiveImageIndexes((prev) => ({ ...prev, [item.id]: pIdx }))}
                                className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                                  pIdx === selectedImgIdx
                                    ? 'border-indigo-600 scale-105 shadow-sm'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img src={photo} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-28 w-full rounded-xl bg-slate-100 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-1 text-slate-400 text-xs">
                        <ImageIcon className="w-6 h-6 opacity-40" />
                        <span>No photos uploaded</span>
                      </div>
                    )}

                    {/* Header: Title, Condition, Price */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                          {item.condition.replace('_', ' ')}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                        ${item.price}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer & Direct WhatsApp Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Seller: <strong className="text-slate-800 dark:text-slate-200">{item.sellerName}</strong></span>
                      <span className="text-[11px] text-slate-400">({item.sellerDepartment})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={formatWhatsappUrl(item.whatsappNumber || item.contactInfo || '', item.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001L2 22l5.122-1.334c1.464.799 3.111 1.218 4.88 1.219h.005c5.507 0 9.991-4.479 9.992-9.986.001-2.667-1.033-5.173-2.913-7.054A9.923 9.923 0 0012.012 2zm.005 18.232h-.004a8.28 8.28 0 01-4.22-1.157l-.303-.18-3.136.818.835-3.058-.198-.314a8.272 8.272 0 01-1.267-4.357c.001-4.568 3.719-8.286 8.288-8.286 2.213 0 4.292.862 5.856 2.428a8.23 8.23 0 012.423 5.857c-.001 4.569-3.719 8.287-8.284 8.287zm4.542-6.204c-.249-.125-1.472-.726-1.7-.809-.228-.083-.394-.125-.56.125-.166.249-.643.809-.788.975-.145.166-.29.187-.539.062a6.793 6.793 0 01-1.998-1.231 7.483 7.483 0 01-1.383-1.722c-.145-.249-.015-.384.109-.508.112-.112.249-.29.373-.435.125-.145.166-.249.249-.415.083-.166.042-.311-.021-.435-.062-.125-.56-1.349-.767-1.846-.202-.485-.407-.419-.56-.427l-.477-.008c-.166 0-.435.062-.663.311-.228.249-.871.85-.871 2.074 0 1.224.891 2.406 1.015 2.572.125.166 1.752 2.675 4.244 3.752.593.256 1.056.409 1.417.524.595.189 1.136.162 1.564.098.477-.071 1.472-.601 1.679-1.182.207-.581.207-1.078.145-1.182-.062-.104-.228-.187-.477-.312z" />
                        </svg>
                        <span>Contact WhatsApp: {item.whatsappNumber || item.contactInfo}</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. LOST & FOUND */}
      {activeSubTab === 'lost_found' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Faculty Lost & Found Hub
            </h3>

            <button
              onClick={() => setShowLafModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Report Lost / Found Gear</span>
            </button>
          </div>

          {showLafModal && (
            <form onSubmit={handleCreateLostFound} className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-3 text-xs">
              <h4 className="font-bold text-indigo-950 dark:text-indigo-200">Report Lost or Found Item</h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-1">
                  <input type="radio" checked={lafType === 'lost'} onChange={() => setLafType('lost')} /> Lost
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" checked={lafType === 'found'} onChange={() => setLafType('found')} /> Found
                </label>
              </div>
              <input
                type="text"
                placeholder="Item Title (e.g. TI-Nspire Calculator)"
                required
                value={lafTitle}
                onChange={(e) => setLafTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                placeholder="Location (e.g. Computer Lab 4)"
                required
                value={lafLocation}
                onChange={(e) => setLafLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <textarea
                placeholder="Details or contact info..."
                required
                value={lafContact}
                onChange={(e) => setLafContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowLafModal(false)} className="px-3 py-1 text-slate-500">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold">
                  Submit Report
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lostFound.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      item.type === 'lost'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-400">{item.date}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                <p className="text-[11px] text-indigo-400 font-semibold">Location: {item.location}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => toggleContactReveal(item.id)}
                    className="text-xs font-bold text-indigo-500 hover:underline"
                  >
                    {revealedContacts[item.id] ? item.contactInfo : 'Contact Reporter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. STUDENT CLUBS */}
      {activeSubTab === 'clubs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Student Engineering Clubs & Societies
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clubs.map((club) => (
              <div key={club.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{club.name}</h4>
                    <p className="text-xs text-indigo-500 font-medium mt-0.5">{club.tagline}</p>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">{club.memberCount} Members</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{club.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400">Lead: {club.leadName}</span>

                  <button
                    onClick={() => onToggleClubJoin(club.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      club.isJoined
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    }`}
                  >
                    {club.isJoined ? 'Joined Member ✔' : 'Join Chapter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedModalEvent}
        isOpen={!!selectedModalEvent}
        onClose={() => setSelectedModalEvent(null)}
        onToggleRSVP={(id) => {
          onToggleRSVP(id);
          // Keep modal state in sync
          if (selectedModalEvent && selectedModalEvent.id === id) {
            const updatedRsvp = !selectedModalEvent.hasRsvped;
            setSelectedModalEvent({
              ...selectedModalEvent,
              hasRsvped: updatedRsvp,
              rsvpCount: updatedRsvp
                ? (selectedModalEvent.rsvpCount || 0) + 1
                : Math.max(0, (selectedModalEvent.rsvpCount || 0) - 1)
            });
          }
        }}
      />
    </div>
  );
};
