import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Utensils, 
  Calendar, 
  BarChart3, 
  User, 
  ArrowLeft, 
  Bell,
  Plus,
  MessageCircle,
  Receipt,
  Users,
  ShieldCheck,
  ChevronRight,
  Download,
  Share2,
  Edit2,
  Trash2,
  Mail,
  Lock,
  Eye,
  LogOut,
  CheckCircle2,
  Info,
  AlertTriangle,
  History,
  CreditCard,
  XCircle,
  Clock,
  FileText,
  Palette,
  School,
  Star,
  Baby,
  ChevronLeft,
  Search,
  Filter,
  MoreHorizontal,
  Smartphone,
  Globe,
  MapPin,
  Brush,
  Theater,
  Laptop,
  Heart,
  Key,
  PartyPopper,
  Verified,
  ShieldAlert,
  RotateCcw,
  ArrowRight,
  LogIn,
  UserPlus
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Akış', icon: Home },
    { path: '/food', label: 'Yemek', icon: Utensils },
    { path: '/activities', label: 'Etkinlikler', icon: Calendar },
    { path: '/stats', label: 'İstatistikler', icon: BarChart3 },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-safe bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 rounded-t-[2rem] border-t-0">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-1.5 transition-all duration-150 active:translate-y-1",
              isActive 
                ? "bg-primary/10 text-primary rounded-2xl" 
                : "text-zinc-400 hover:text-primary"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
            <span className="font-headline text-[10px] font-semibold mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const Header = ({ title, showBack = false, rightElement }: { title: string, showBack?: boolean, rightElement?: React.ReactNode }) => {
  return (
    <header className="fixed top-0 w-full z-50 rounded-b-[2rem] bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between px-6 h-16 w-full max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button onClick={() => window.history.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-zinc-500" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZc4LEW49e0vdsBKHqrc__s5slEOgwQUCJD_SBE5PdwMJxFq4mpMZ9xeaGIyBIo_5umiNxAKADhq6Ya14fLmgukGkRbINZ80xnfXco-MfX9X2bpbVvtoM2wIhO7Tlg6T1lU1Lm9xZif1LgElb8tcn8UHhRCDahfyjFhKbaZ6L7ylud7Pqf-iKxnsFCtb1BjhcqBJ-etAPucOKazhxKWdvQcmXkftGMYT1WidqU9idQwpYTQa0xS4POw_7BdULpo81_UV7eOfMLMI0" 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="font-headline font-bold tracking-tight text-xl text-primary">{title}</h1>
        </div>
        {rightElement || (
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors">
            <Bell className="w-6 h-6 text-zinc-500" />
          </button>
        )}
      </div>
    </header>
  );
};

// --- Pages ---

const FeedPage = () => (
  <div className="pt-20 pb-32 px-4 max-w-md mx-auto space-y-6">
    <div className="flex p-1.5 bg-surface-container rounded-full mt-4">
      <button className="flex-1 py-2.5 px-4 rounded-full bg-surface-container-lowest text-primary font-headline font-bold text-sm shadow-sm">
        Genel
      </button>
      <button className="flex-1 py-2.5 px-4 rounded-full text-on-surface-variant font-headline font-semibold text-sm hover:bg-surface-container-high">
        Okullar
      </button>
    </div>

    <article className="bg-surface-container-lowest rounded-lg p-5 border-2 border-surface-container-high relative overflow-hidden shadow-[0_6px_0_0_#e7e8e8]">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-tertiary-container flex items-center justify-center font-headline font-black text-on-tertiary-container text-lg">
          GS
        </div>
        <div>
          <h3 className="font-headline font-bold text-base leading-tight">Güneş Sınıfı Etkinliği</h3>
          <p className="text-on-surface-variant text-xs font-medium">1 saat önce</p>
        </div>
        <button className="ml-auto text-on-surface-variant">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>
      <p className="text-on-surface mb-4 leading-relaxed font-medium">Bugün Gökkuşağı deneyini yaparken çok eğlendik!</p>
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-4">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGGZ7yYhjFfZwaoWBFKpsE_ughhdYqkbV_N_s__gjkt0oXxDeDATy17vv3i4nRLEGzKlx-FbIRb4cJr55A-YzpF9bJSLe4f3kGpWRYsKRhkWV03012WiaDKb8-0CBe99sEVM_EAQ51sqIrya2tmwSojup-ZBIarfEqKp3UlzHhErH5ygoNESbRW1ozhkVUYVUdJjftT2vDczpN0BkvmGCNDgSgKIos6iMM4BsUJShUmeE25_47k4dT-WmNKqr90XgK9LK6zsbFX50" 
          alt="Activity" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex items-center gap-6 pt-2 border-t border-surface-container">
        <button className="flex items-center gap-2 group">
          <Heart className="w-6 h-6 text-zinc-400 group-hover:text-primary" />
          <span className="text-sm font-bold text-on-surface-variant">24</span>
        </button>
        <button className="flex items-center gap-2 group">
          <MessageCircle className="w-6 h-6 text-zinc-400 group-hover:text-secondary" />
          <span className="text-sm font-bold text-on-surface-variant">8</span>
        </button>
      </div>
    </article>

    <article className="bg-surface-container-lowest rounded-lg p-5 border-2 border-surface-container-high relative shadow-[0_6px_0_0_#e7e8e8]">
      <div className="absolute -top-1 -right-1 bg-tertiary-container p-2 rounded-bl-2xl rounded-tr-lg">
        <Star className="w-5 h-5 text-on-tertiary-container fill-current" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-on-secondary-container" />
        </div>
        <div className="pr-8">
          <h3 className="font-headline font-bold text-base leading-tight">Önemli Duyuru: Veli Toplantısı</h3>
          <p className="text-on-surface-variant text-xs font-medium">3 saat önce • Duyuru</p>
        </div>
      </div>
      <div className="bg-surface-container-low rounded-lg p-4 mb-4">
        <p className="text-on-surface text-sm leading-relaxed font-medium">
          Sayın velilerimiz, dönemin ilk genel değerlendirme toplantısı bu Cuma saat 17:00'de konferans salonunda gerçekleşecektir. Katılımınızı önemle rica ederiz.
        </p>
      </div>
      <div className="flex gap-3">
        <button className="flex-1 py-3 px-4 bg-primary rounded-lg text-on-primary font-headline font-bold text-sm text-center shadow-[0_4px_0_0_#235b00] active:translate-y-1 active:shadow-none transition-all">
          Takvime Ekle
        </button>
        <button className="py-3 px-6 bg-secondary-container rounded-lg text-on-secondary-container font-headline font-bold text-sm">
          Detaylar
        </button>
      </div>
    </article>

    <div className="relative py-8 flex justify-center overflow-visible">
      <p className="text-on-surface-variant font-headline font-semibold text-sm italic">Hepsini gördünüz! 🎉</p>
    </div>

    <button className="fixed bottom-24 right-6 w-14 h-14 bg-tertiary-container text-on-tertiary-container rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-40 border-b-4 border-tertiary-dim">
      <Edit2 className="w-6 h-6" />
    </button>
  </div>
);

const FoodPage = () => (
  <div className="max-w-md mx-auto pt-20 pb-32 px-4 space-y-6">
    <section className="mt-4">
      <button className="w-full bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between shadow-sm border-b-4 border-surface-variant tactile-button">
        <div className="flex items-center gap-3">
          <Baby className="w-6 h-6 text-primary" />
          <div className="text-left">
            <p className="font-headline font-bold text-on-surface">Ayşe Yılmaz</p>
            <p className="font-label text-on-surface-variant text-xs font-semibold">Güneş Sınıfı</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-outline rotate-90" />
      </button>
    </section>

    <section className="flex items-center justify-center gap-6 py-2">
      <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary tactile-button border-b-primary-dim border-b-4">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <div className="bg-primary-container px-6 py-2 rounded-full border-b-4 border-primary-dim">
        <span className="font-headline font-extrabold text-on-primary-container tracking-tight">Mart 2026</span>
      </div>
      <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary tactile-button border-b-primary-dim border-b-4">
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>

    <section className="bg-surface-container-low p-4 rounded-lg flex justify-between items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-primary"></div>
        <span className="text-[10px] font-bold font-label uppercase text-on-surface-variant">Düşük Risk</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-tertiary-container"></div>
        <span className="text-[10px] font-bold font-label uppercase text-on-surface-variant">Orta Risk</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-error"></div>
        <span className="text-[10px] font-bold font-label uppercase text-on-surface-variant">Yüksek Risk</span>
      </div>
    </section>

    <div className="space-y-4">
      <article className="bg-surface-container-lowest rounded-lg border-b-4 border-primary shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-md">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-headline font-extrabold text-white text-lg leading-none">14 Mart, CUM</p>
              <p className="font-label text-on-primary text-[10px] font-bold tracking-widest uppercase mt-1">Bugünkü Menü</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white -rotate-90" />
        </div>
        <div className="p-5 space-y-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center border-2 border-dashed border-tertiary-container">
                <Utensils className="w-6 h-6 text-tertiary" />
              </div>
              <div className="w-0.5 h-full bg-surface-variant mt-2"></div>
            </div>
            <div className="flex-1 pb-4">
              <h3 className="font-headline font-bold text-on-surface-variant text-sm mb-2">Kahvaltı</h3>
              <div className="flex flex-wrap gap-2">
                {['Peynir', 'Zeytin', 'Bal'].map(item => (
                  <span key={item} className="bg-surface-container px-3 py-1 rounded-full text-xs font-medium">{item}</span>
                ))}
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">Süt</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center border-2 border-primary">
                <Utensils className="w-6 h-6 text-primary" />
              </div>
              <div className="w-0.5 h-full bg-surface-variant mt-2"></div>
            </div>
            <div className="flex-1 pb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-headline font-bold text-on-surface text-sm">Öğle Yemeği</h3>
                <div className="bg-error px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-tighter">Yüksek Risk</div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-on-surface">Mercimek Çorbası, Tavuk Sote, Pilav</p>
                <div className="flex items-center gap-2 p-3 bg-error/5 rounded-md border-l-4 border-error">
                  <AlertTriangle className="w-5 h-5 text-error" />
                  <p className="text-xs font-bold text-error">Alerjen Uyarısı: Süt içerir!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <section className="relative overflow-hidden bg-secondary rounded-lg p-6 border-b-4 border-secondary-dim text-white">
      <div className="relative z-10">
        <h2 className="font-headline font-bold text-xl mb-1">Haftalık Rapor</h2>
        <p className="text-secondary-fixed text-sm mb-4">Ayşe bu hafta protein ağırlıklı beslendi.</p>
        <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
          <div className="bg-primary-fixed h-full w-[75%] rounded-full shadow-[0_0_10px_rgba(132,251,66,0.5)]"></div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">%75 Sağlıklı Tercih</span>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    </section>
  </div>
);

const ActivitiesPage = () => (
  <div className="pt-20 pb-32 px-4 max-w-md mx-auto min-h-screen">
    <div className="flex gap-2 p-1.5 bg-surface-container rounded-2xl mb-8">
      <button className="flex-1 py-3 px-2 rounded-xl bg-surface-container-lowest shadow-sm text-sm font-headline font-bold text-primary text-center">
        Okul Etkinlikleri
      </button>
      <Link to="/activity-classes" className="flex-1 py-3 px-2 rounded-xl text-sm font-headline font-bold text-on-surface-variant text-center hover:bg-surface-variant/50 transition-colors">
        Etkinlik Sınıfları
      </Link>
    </div>

    <div className="relative mb-6">
      <h2 className="font-headline text-2xl font-extrabold tracking-tight mb-2">Yaklaşan Etkinlikler</h2>
      <div className="absolute -top-4 -right-2 opacity-20">
        <PartyPopper className="w-20 h-20 text-zinc-400" />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <div className="group relative bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col transition-all duration-300">
        <div className="relative h-48 overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKzNzBULrqNFZMaBuFfb04DzrK1ovUcmYGPPITYxiHp__AzUJTobqKf0t8QhoCEe8_K9Zzf__jcTzKa055dzsxPRcuDv1ccZ0Bh8Ig9u-eDIFj4spr9gKjXkkIC5CcDK3SmJeQL5fCWskgdihNtcgHaIXvW57nfCZ0Hr_i88-ilU9lkSwsxgRlAQAPvnLSwtOTD6ZEqXYIBbvkrPPWdh5kXre49sEib3HLgGjZZnfryhoKeHaBMdIkzW81qz4cQPd0G7dRQKP8Jt4" 
            alt="Festival" 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 fill-current" />
              Katıldınız
            </span>
            <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
              Ücretsiz
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">23 Nisan Şenliği</h3>
            <div className="text-right">
              <p className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Tarih</p>
              <p className="text-xs font-bold text-on-surface-variant">21 Nis - 24 Nis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-on-surface-variant">Tüm Okul</span>
          </div>
          <button className="w-full py-4 bg-primary rounded-xl text-on-primary font-headline font-extrabold tracking-wide uppercase shadow-[0_4px_0_0_#235b00] active:translate-y-1 active:shadow-none transition-all">
            Detayları Gör
          </button>
        </div>
      </div>

      <div className="group relative bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col transition-all duration-300">
        <div className="relative h-48 overflow-hidden grayscale-[0.5] opacity-90">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiR0Fb0BI2qJBeACkCysdicp96Gzv8fSjkGQ66NCUX1EZCuWDkcwytnQ8SetIZtrhHH3-9qVY4MqYd8llr5fOti5B8HWXGoZ7aJdTLQ8xu782ZrIFWoJw22zCNNCPup5DOyUp6W0zGhz-WY27OZ2NMD-QUsEk-Zr4Xdrmw7pQ4RMqYZBr45LBKH3tL4f0nIGHnGnp_9joXLBut5FNXcPiTlZqHaofkvANHVuUCxyiYPn580YsKjb8caUykQokx65rFwnqXguzGuug" 
            alt="Basketball" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-md mb-2">
              <Lock className="w-8 h-8 fill-current" />
            </div>
            <span className="font-headline font-black text-lg tracking-widest uppercase">Kilitli</span>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-headline text-xl font-extrabold text-on-surface mb-4">Basketbol Kursu</h3>
          <button className="w-full py-4 bg-zinc-200 rounded-xl text-zinc-500 font-headline font-extrabold tracking-wide uppercase cursor-not-allowed flex items-center justify-center gap-2">
            <Key className="w-5 h-5" />
            Kilidi Aç
          </button>
        </div>
      </div>
    </div>
  </div>
);

const StatsPage = () => (
  <div className="pt-20 pb-32 px-4 max-w-md mx-auto space-y-8">
    <section className="mt-4">
      <div className="flex overflow-x-auto gap-4 py-2 px-2 no-scrollbar">
        <button className="flex-shrink-0 flex items-center gap-3 bg-primary-container text-on-primary-container px-4 py-2.5 rounded-full border-b-4 border-primary-dim transition-all active:translate-y-1">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMKBwdCFr2o2uP40YT4rOBMgHX3yBCM2WLkvul-2TaJEmchwKxKKS2_lIr9r6yGl4XsDC38o-SK3SOoIySpBT-tfa-BTHHwcge-R5PNO49tdH9Q-BVElGWJbmxbcS3AkTUgTOSjC2GsYUA_qRkMyd0GkVMCukGDIhCZswE0C-lLocYUJVjh90wvbAqCuXyhZL7gzk4AKPpuVYleFg3PcX_zr2W2S4JieCEuIoA1RrHUPiiGzvV5YHOeLghP1x47Y3myoAPoWe6Z4E" alt="Can" className="w-full h-full object-cover" />
          </div>
          <span className="font-headline font-bold text-sm tracking-tight">Can</span>
        </button>
      </div>
    </section>

    <section className="relative overflow-hidden bg-primary rounded-xl p-6 text-on-primary shadow-sm">
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-container/20 rounded-full blur-2xl"></div>
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 opacity-90">
            <School className="w-4 h-4" />
            <span className="text-xs font-label font-semibold tracking-wider uppercase">Okul Bilgisi</span>
          </div>
          <h2 className="text-xl font-headline font-extrabold tracking-tight">Atatürk İlkokulu</h2>
          <p className="text-primary-container font-medium text-sm">3-B Sınıfı • Bahar Dönemi</p>
        </div>
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
          <Star className="w-8 h-8 fill-current" />
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-4">
      {[
        { label: 'GELDİ', value: 84, icon: CheckCircle2, color: 'text-primary', bg: 'bg-lime-100' },
        { label: 'GELMEDİ', value: 4, icon: XCircle, color: 'text-error', bg: 'bg-red-100' },
        { label: 'GEÇ GELDİ', value: 2, icon: Clock, color: 'text-tertiary', bg: 'bg-amber-100' },
        { label: 'İZİNLİ', value: 5, icon: FileText, color: 'text-secondary', bg: 'bg-blue-100' },
      ].map(stat => (
        <div key={stat.label} className="bg-surface-container-lowest p-5 rounded-lg flex flex-col items-center gap-3 transition-transform hover:scale-[1.02]">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border-b-4 border-current/20", stat.bg, stat.color)}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div className="text-center">
            <span className="block text-2xl font-headline font-black text-on-surface">{stat.value}</span>
            <span className="text-xs font-label text-on-surface-variant font-bold">{stat.label}</span>
          </div>
        </div>
      ))}
    </section>

    <section className="bg-surface-container-low p-6 rounded-lg space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-headline font-bold text-on-surface">Devam Durumu</h3>
        <span className="text-xs font-label font-bold text-on-surface-variant bg-white px-2 py-1 rounded-full">TOPLAM: 95 GÜN</span>
      </div>
      <div className="h-4 w-full bg-surface-container rounded-full overflow-hidden flex">
        <div className="h-full bg-primary" style={{ width: '88.4%' }}></div>
        <div className="h-full bg-tertiary" style={{ width: '2.1%' }}></div>
        <div className="h-full bg-error" style={{ width: '4.2%' }}></div>
        <div className="h-full bg-secondary" style={{ width: '5.3%' }}></div>
      </div>
    </section>
  </div>
);

const ProfilePage = () => (
  <div className="pt-24 pb-32 px-4 max-w-md mx-auto space-y-6">
    <section className="flex flex-col items-center text-center space-y-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
          <span className="text-on-primary-container font-headline text-3xl font-extrabold">AK</span>
        </div>
        <div className="absolute bottom-0 right-0 bg-tertiary-container p-1.5 rounded-full border-2 border-white shadow-sm">
          <Edit2 className="w-3 h-3 font-bold" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          <h2 className="font-headline font-bold text-2xl tracking-tight">Ahmet Kaya</h2>
          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Verified className="w-3 h-3 fill-current" />
            Doğrulandı
          </span>
        </div>
        <p className="text-on-surface-variant font-medium text-sm">ahmet.kaya@email.com</p>
      </div>
    </section>

    <div className="bg-tertiary-container/20 border-l-4 border-tertiary-container p-4 rounded-r-xl flex items-start gap-4 shadow-sm">
      <AlertTriangle className="w-5 h-5 text-tertiary mt-0.5 fill-current" />
      <div className="flex-1">
        <p className="font-headline font-bold text-tertiary-dim text-sm">Ödenmemiş Faturalar</p>
        <p className="text-on-tertiary-container text-xs mt-1 leading-relaxed">Mart ayı okul taksit ödemeniz gecikmiştir. Lütfen mali işlemleri kontrol edin.</p>
      </div>
      <Link to="/invoices" className="text-tertiary font-bold text-xs underline underline-offset-4">Gözat</Link>
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="px-2 font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest">Hesap</h3>
        <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm">
          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 group-hover:bg-white transition-colors">
                <User className="w-5 h-5" />
              </div>
              <span className="font-headline font-semibold text-sm">Kişisel Bilgiler</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border-t border-zinc-50 hover:bg-surface-container transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 group-hover:bg-white transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <span className="font-headline font-semibold text-sm">Güvenlik ve Şifre</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="px-2 font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest">Çocuklar & Okullar</h3>
        <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm">
          <Link to="/family" className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary group-hover:bg-white transition-colors">
                <Baby className="w-5 h-5" />
              </div>
              <span className="font-headline font-semibold text-sm">Öğrenci Profilleri</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="px-2 font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest">Mali İşlemler</h3>
        <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm">
          <Link to="/invoices" className="w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 flex items-center justify-center text-tertiary group-hover:bg-white transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-headline font-semibold text-sm">Ödemeler ve Faturalar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              <ChevronRight className="w-5 h-5 text-zinc-300" />
            </div>
          </Link>
        </div>
      </div>
    </div>

    <button className="w-full mt-8 mb-4 py-4 px-6 bg-error shadow-[0_4px_0_0_#b92902] active:translate-y-1 active:shadow-none transition-all rounded-xl flex items-center justify-center gap-3 text-on-error font-headline font-extrabold tracking-wide uppercase text-sm">
      <LogOut className="w-5 h-5" />
      Çıkış Yap
    </button>
  </div>
);

const InvoicesPage = () => (
  <div className="pt-20 pb-32 px-4 max-w-md mx-auto space-y-8">
    <section className="grid grid-cols-3 gap-3">
      {[
        { label: 'Bekleyen', value: 4, color: 'text-secondary', bg: 'bg-surface-container-lowest' },
        { label: 'Gecikmiş', value: 1, color: 'text-on-error-container', bg: 'bg-error-container' },
        { label: 'Ödendi', value: 12, color: 'text-on-primary-container', bg: 'bg-primary-container' },
      ].map(stat => (
        <div key={stat.label} className={cn("p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-1", stat.bg)}>
          <span className={cn("font-headline font-extrabold text-2xl", stat.color)}>{stat.value}</span>
          <span className={cn("text-[10px] font-label leading-tight uppercase font-bold opacity-80", stat.color)}>{stat.label}</span>
        </div>
      ))}
    </section>

    <section className="space-y-4">
      <h2 className="font-headline font-bold text-lg px-2">Fatura Geçmişi</h2>
      <div className="space-y-3">
        <Link to="/invoice-details" className="bg-surface-container-lowest rounded-lg overflow-hidden flex shadow-sm relative group border-b-4 border-surface-container">
          <div className="w-3 bg-error shrink-0"></div>
          <div className="p-4 flex-1 flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-on-surface">FAT-2023-089</span>
                <span className="bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Gecikmiş!</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant text-sm">
                <Baby className="w-4 h-4" />
                <span>Ali Yılmaz</span>
              </div>
              <div className="text-xs text-error font-medium">Son Ödeme: 12.10.2023</div>
            </div>
            <div className="text-right">
              <div className="font-headline font-extrabold text-xl text-on-surface">₺1.250</div>
              <button className="mt-2 bg-error text-on-error text-xs font-bold px-4 py-2 rounded-full shadow-[0_4px_0_0_#b92902] active:shadow-none active:translate-y-1 transition-all">
                ŞİMDİ ÖDE
              </button>
            </div>
          </div>
        </Link>
      </div>
    </section>
  </div>
);

const InvoiceDetailsPage = () => (
  <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-6">
    <section className="relative bg-surface-container-lowest rounded-lg p-8 shadow-sm border-b-4 border-surface-container-highest overflow-hidden text-center">
      <div className="absolute -right-4 -top-4 w-32 h-32 opacity-10 rotate-12">
        <Receipt className="w-32 h-32 text-primary" />
      </div>
      <div className="flex justify-between items-start mb-6">
        <div className="text-left">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Fatura No</span>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface">#IST-2023-0892</h1>
        </div>
        <div className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full font-headline font-bold text-sm border-b-2 border-primary-dim/20">
          ÖDENDİ
        </div>
      </div>
      <div className="space-y-1">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Toplam Tutar</span>
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-headline text-5xl font-black text-primary tracking-tight">1.450</span>
          <span className="font-headline text-2xl font-bold text-primary">TL</span>
        </div>
      </div>
      <div className="mt-8 flex gap-3">
        <button className="flex-1 bg-primary text-on-primary font-headline font-extrabold py-3 rounded-lg border-b-4 border-primary-dim tactile-button shadow-lg">
          MAKBUZ İNDİR
        </button>
        <button className="flex items-center justify-center w-14 bg-surface-container text-on-surface-variant font-extrabold rounded-lg border-b-4 border-outline-variant/30 tactile-button">
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-4">
      <div className="bg-surface-container-low rounded-lg p-5 border-b-4 border-surface-container-high">
        <div className="flex items-center gap-2 mb-3 text-secondary">
          <Baby className="w-4 h-4" />
          <span className="font-headline font-bold text-xs uppercase tracking-wider">Öğrenci</span>
        </div>
        <div className="flex items-center gap-3">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvEFYaCSBJdp9M1wxkfTl4rKIu5h3tGWfCLO1RVL3lh1rwWwteyEN6QDSp8O88qXM6KIZep46JzN3_Gpme5ndlLz-WK7ksylT5Ro_iqDMi9-fYjQEQUoKJPwvR1kuFdYG66sNLfTlDH87v2iLPvzfgzaZhyHbiGhS5ey-TiN3v9jNDc2FY-MH4U9bllX4i2AtULx1PtpxwTuEJg3yf_KzafZVewWeMeSmt60FL6OcNnzOXs6ZPdNlVHziaZs3yhhwjQC5hr2OQbxA" alt="Can" className="w-10 h-10 rounded-full bg-secondary-container p-1" />
          <p className="font-headline font-extrabold text-on-surface">Can Yılmaz</p>
        </div>
      </div>
      <div className="bg-surface-container-low rounded-lg p-5 border-b-4 border-surface-container-high">
        <div className="flex items-center gap-2 mb-3 text-tertiary">
          <Calendar className="w-4 h-4" />
          <span className="font-headline font-bold text-xs uppercase tracking-wider">Tarih</span>
        </div>
        <div className="space-y-0.5">
          <p className="font-headline font-extrabold text-on-surface text-sm">12 Ekim 2023</p>
          <p className="font-label text-[10px] text-on-surface-variant font-medium">Son Ödeme: 15 Ekim</p>
        </div>
      </div>
    </section>
  </div>
);

const ActivityClassesPage = () => (
  <div className="pt-20 pb-32 px-6 max-w-2xl mx-auto">
    <section className="mb-10 text-center relative">
      <div className="absolute -top-6 -right-4 w-24 h-24 opacity-20 pointer-events-none">
        <Brush className="w-20 h-20 text-primary fill-current" />
      </div>
      <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">Etkinlik Sınıfları</h2>
      <p className="text-on-surface-variant font-medium">Küçük keşifçiler için eğlence dolu öğrenme yolculukları</p>
    </section>

    <div className="grid grid-cols-1 gap-6">
      <Link to="/class-details" className="group relative bg-surface-container-lowest rounded-lg p-1 transition-all">
        <div className="absolute inset-0 bg-primary-container/20 rounded-lg translate-y-2 translate-x-1 -z-10"></div>
        <div className="bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col md:flex-row gap-4 p-4 border-b-4 border-surface-container-high">
          <div className="w-full md:w-40 h-40 rounded-xl overflow-hidden relative shrink-0">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCf-ZKRoP-LoO0TREG_HTC8jjaUPpxV2gB67sLZ-YF2St-q8RU8hPfbIPPk_UjA_OyIypsfH8FwPcd1FTj4vmNyIXkFxDNiuMPTB9n104C2uqNrZ4zMi89tfAp-19QTP5VPuYCmENUyU_wCILKRDomvBKEPjQb00P0fYxpy4DYuzsZwGuG6vfGppVGwer6HHJR5GijMPIqUO5_S_HGjZN23nvoviZ10kX2qzm6gmI50G30m0YI83n5fZO-ov-qMGlzbi8DOC5fIWdY" alt="Art" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
              <Globe className="w-3 h-3" />
              Türkçe
            </div>
          </div>
          <div className="flex flex-col justify-between flex-grow">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-headline text-xl font-bold text-on-surface">Minik Ressamlar Atölyesi</h3>
                <span className="bg-primary/10 text-primary text-[11px] font-bold px-3 py-1 rounded-full border border-primary/20">
                  12 Çocuk Kayıtlı
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-on-surface-variant text-sm font-medium">
                <div className="flex items-center gap-1">
                  <Baby className="w-4 h-4 text-primary" />
                  4-6 Yaş
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  Haftada 2 Gün
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-outline uppercase font-bold tracking-widest leading-none">Kapasite</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-container w-[75%] rounded-full"></div>
                  </div>
                  <span className="text-xs font-bold text-primary">15/20</span>
                </div>
              </div>
              <span className="bg-tertiary-container text-on-tertiary-container font-black px-4 py-2 rounded-xl text-lg shadow-[0_4px_0_0_#d1a300]">
                ₺450
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  </div>
);

const ClassDetailsPage = () => (
  <div className="pt-20 pb-32 px-4 max-w-4xl mx-auto">
    <section className="relative mb-8 rounded-lg overflow-hidden bg-surface-container-lowest p-6 flex flex-col md:flex-row gap-6 items-center shadow-[0_6px_0_0_#e7e8e8]">
      <div className="relative w-full md:w-1/3 aspect-square rounded-lg overflow-hidden border-4 border-surface-container">
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmxrsRJKOM_667X-VU_CGGFUUVtp_9l5SPgoM2j69XNlDs1q_Ht_RXbz3EP0m1dPkZRd8eg4D7ViED-VL7Cj0sRn_mL2y3OGothkrXrPnRsZa8ffn6ZRSNx0klgqyhwvy9k9ljtFhU_JIiKul6WAQ0qWi5SfBVbbmKHUIcUAd30L1mfvKSM3ETTBLAXJqgU5VOF9syOQTvD58hUepftmDNQpYSTj0viXcvDjNfM5d50tiuWsu9GGtedsTCqCMbq8D-OCS0waouFIQ" alt="Class" className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">İNGİLİZCE</span>
          <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold">450 TL / AY</span>
        </div>
      </div>
      <div className="flex-1 text-center md:text-left">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-2 leading-tight tracking-tight">Mini Kaşifler Sanat Atölyesi</h2>
        <p className="text-on-surface-variant mb-6 text-lg">Çocukların hayal güçlerini renklerle ve dokularla keşfettiği, yaratıcılığın sınır tanımadığı bir öğrenme alanı.</p>
        <button className="bg-primary text-on-primary font-headline font-bold px-6 py-3 rounded-lg shadow-[0_4px_0_0_#235b00] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 mx-auto md:mx-0">
          <Palette className="w-5 h-5 fill-current" />
          Galeriye Göz At
        </button>
      </div>
    </section>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[
        { label: 'YAŞ GRUBU', value: '4 - 6 Yaş', icon: Baby, color: 'text-secondary', bg: 'bg-secondary-container' },
        { label: 'KAPASİTE', value: '12 / 15 Çocuk', icon: Users, color: 'text-primary', bg: 'bg-primary-container' },
        { label: 'PROGRAM', value: 'Salı - Perşembe', icon: Calendar, color: 'text-tertiary', bg: 'bg-tertiary-container' },
        { label: 'KONUM', value: 'B Blok, Kat 2', icon: MapPin, color: 'text-on-surface-variant', bg: 'bg-surface-container-high' },
      ].map(card => (
        <div key={card.label} className={cn("p-5 rounded-lg flex flex-col items-center justify-center text-center gap-2", card.bg)}>
          <card.icon className={cn("w-8 h-8", card.color)} />
          <div>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-70", card.color)}>{card.label}</p>
            <p className="font-headline font-bold text-on-surface">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FamilyPage = () => (
  <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
    <div className="flex items-center justify-between px-2">
      <h2 className="font-headline font-bold text-on-surface-variant text-sm tracking-widest uppercase">KAYITLI ÜYELER</h2>
      <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold">3 AKTİF</span>
    </div>

    <div className="space-y-4">
      {[
        { name: 'Ahmet Yılmaz', role: 'Baba', tag: 'Ana Veli', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsX2dt3zIhUCwhJ-c-HK5Wi_7OsG-CTjcwz2YnNhaxmw8uyVWtLp_4FeU6O00ZwASCFeQEylbMcCdL4WvENg61kKAgfeh1PFZB2PzxDsNal90Z-MRil2OeGqOH3jzhmfwtiwQLrUEPyHo8ZLEt3o5qRjkP9uhvXuxSEMG7N13e7OakBEpRuEkRhw1fa88t5obvhS0ZaLkjsMs5eCt7UFzAKrSunw_Ai6ykC_vwH8X9rLqAw4JXY4ADQJt2tWr_25--R8pQ371MGx0' },
        { name: 'Zeynep Yılmaz', role: 'Anne', tag: 'Eş Veli', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdxsw5Coguzgyf0nobQlR0JJCAc5W0LceoijtgOIg9HTQYurkdQJuXqJxxDEe4mbjkI957hKwtl7EzrdUc77OrhlZRSWA0VSgDDPFEZ6ksCMcF9LLiGWiho_sNTdYMk0ot1QRmo2qMlsJlpXin9d8aaQVzW98-JyE1VnliWr-Viw88SvGAiTDrai4y_YeVqYTd8kyxSweuV5MzyalTQL0IDNNa4LCzh3uKJ40O3RQjMHe4tAFyw94DJ5sdO068qafSQfMqsolIn1w' },
      ].map(member => (
        <div key={member.name} className="bg-surface-container-lowest p-5 rounded-lg flex items-center gap-4 shadow-sm border-b-4 border-surface-container">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shrink-0">
            <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-headline font-extrabold text-lg leading-tight">{member.name}</h3>
              <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">{member.tag}</span>
            </div>
            <p className="text-on-surface-variant text-sm font-medium">{member.role}</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-error-dim hover:bg-error/10 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const LoginPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
    <div className="flex flex-col items-center mb-12 text-center">
      <div className="relative mb-4">
        <div className="bg-primary-container p-4 rounded-xl rotate-3 flex items-center justify-center shadow-lg">
          <School className="w-12 h-12 text-primary fill-current" />
        </div>
        <div className="absolute -top-2 -right-4 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full font-headline text-xs font-bold -rotate-12 shadow-sm">
          YENİ!
        </div>
      </div>
      <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary mb-2">iStudy</h1>
      <p className="font-headline text-on-surface-variant text-lg font-semibold px-4 leading-tight">
        Eğitimin En Eğlenceli Hali!
      </p>
    </div>

    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div className="group">
          <label className="block font-headline text-sm font-bold text-on-surface-variant mb-2 ml-1">E-posta</label>
          <input className="w-full bg-surface-container-lowest border-2 border-surface-variant rounded-lg px-5 py-4 font-body text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all outline-none" placeholder="örnek@eposta.com" type="email" />
        </div>
        <div className="group">
          <label className="block font-headline text-sm font-bold text-on-surface-variant mb-2 ml-1">Şifre</label>
          <div className="relative">
            <input className="w-full bg-surface-container-lowest border-2 border-surface-variant rounded-lg px-5 py-4 font-body text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all outline-none" placeholder="••••••••" type="password" />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors">
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-right">
        <Link to="/forgot-password" title="Şifremi Unuttum" className="font-headline text-sm font-bold text-primary hover:text-primary-dim transition-colors">
          Şifremi Unuttum
        </Link>
      </div>

      <Link to="/" className="w-full py-4 bg-primary text-on-primary font-headline text-lg font-extrabold rounded-lg shadow-[0_4px_0_0_#235b00] active:translate-y-1 active:shadow-none transition-all flex justify-center">
        Giriş Yap
      </Link>

      <div className="text-center pt-8 border-t-2 border-surface-variant">
        <p className="font-body text-on-surface-variant text-sm font-medium mb-4">Hesabın yok mu?</p>
        <Link to="/register" className="w-full py-4 bg-white border-2 border-surface-variant text-secondary font-headline text-lg font-extrabold rounded-lg shadow-[0_4px_0_0_#dbdddd] active:translate-y-1 active:shadow-none transition-all flex justify-center">
          Kayıt Ol
        </Link>
      </div>
    </div>
  </div>
);

const RegisterPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
    <div className="text-center space-y-2 relative mb-8">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-primary-container rounded-lg flex items-center justify-center shadow-[0_6px_0_0_#235b00]">
          <School className="w-10 h-10 text-on-primary-container fill-current" />
        </div>
      </div>
      <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Hesap Oluştur</h1>
      <p className="text-on-surface-variant font-medium">iStudy ile öğrenme yolculuğuna başla</p>
    </div>

    <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border-b-4 border-surface-container w-full">
      <form className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-label text-[10px] font-bold text-on-surface-variant ml-1 uppercase">AD</label>
            <input className="w-full px-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-3 focus:ring-primary text-on-surface font-medium" placeholder="Can" type="text" />
          </div>
          <div className="space-y-1.5">
            <label className="font-label text-[10px] font-bold text-on-surface-variant ml-1 uppercase">SOYAD</label>
            <input className="w-full px-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-3 focus:ring-primary text-on-surface font-medium" placeholder="Yılmaz" type="text" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="font-label text-[10px] font-bold text-on-surface-variant ml-1 uppercase">E-POSTA</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
            <input className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-3 focus:ring-primary text-on-surface font-medium" placeholder="ornek@istudy.com" type="email" />
          </div>
        </div>
        <button type="button" className="w-full py-4 bg-primary text-on-primary font-headline font-extrabold text-lg rounded-md shadow-[0_4px_0_0_#235b00] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
          Kayıt Ol
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
    <p className="text-center mt-6 text-on-surface-variant font-medium">
      Zaten bir hesabın var mı? 
      <Link to="/login" className="text-primary font-bold hover:underline ml-1">Giriş Yap</Link>
    </p>
  </div>
);

const ForgotPasswordPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
    <section className="bg-surface-container-lowest rounded-lg p-8 relative overflow-hidden flex flex-col gap-8 shadow-sm w-full">
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center relative">
          <RotateCcw className="w-10 h-10 text-secondary" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Şifremi Unuttum</h1>
          <p className="text-on-surface-variant font-body leading-relaxed">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısını hemen gönderelim.
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="group">
          <label className="block font-label text-sm font-bold text-on-surface-variant mb-2 ml-2">E-posta Adresi</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
            <input className="w-full bg-surface-container-low border-none rounded-md py-4 pl-12 pr-4 text-on-surface outline-none focus:ring-4 focus:ring-primary/20 transition-all" placeholder="örnek@okul.com" type="email" />
          </div>
        </div>
        <button className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-md shadow-[0_4px_0_0_#235b00] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 group">
          <span>Sıfırlama Linki Gönder</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      <div className="text-center">
        <Link to="/login" className="text-primary font-label font-bold hover:underline text-sm">
          Giriş Ekranına Dön
        </Link>
      </div>
    </section>
  </div>
);

// --- Main App ---

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={<><Header title="Okul Günlüğü" /><FeedPage /><BottomNav /></>} />
          <Route path="/food" element={<><Header title="Yemek Günlüğü" /><FoodPage /><BottomNav /></>} />
          <Route path="/activities" element={<><Header title="Etkinlikler" /><ActivitiesPage /><BottomNav /></>} />
          <Route path="/stats" element={<><Header title="İstatistikler" /><StatsPage /><BottomNav /></>} />
          <Route path="/profile" element={<><Header title="Profil" /><ProfilePage /><BottomNav /></>} />
          <Route path="/invoices" element={<><Header title="Faturalarım" showBack /><InvoicesPage /></>} />
          <Route path="/invoice-details" element={<><Header title="Fatura Detayı" showBack /><InvoiceDetailsPage /></>} />
          <Route path="/activity-classes" element={<><Header title="Etkinlik Sınıfları" showBack /><ActivityClassesPage /></>} />
          <Route path="/class-details" element={<><Header title="Sınıf Detayları" showBack /><ClassDetailsPage /></>} />
          <Route path="/family" element={<><Header title="Aile Üyeleri" showBack /><FamilyPage /></>} />
        </Routes>
      </div>
    </Router>
  );
}
