import React, { useState } from 'react';
import { 
  School, 
  Search, 
  Bell, 
  Home, 
  Utensils, 
  Calendar, 
  BarChart3, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  MoreHorizontal, 
  Heart, 
  MessageCircle, 
  Star, 
  Megaphone, 
  Plus, 
  Edit3, 
  Languages, 
  Eye, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  Verified, 
  AlertTriangle, 
  LogOut, 
  ShieldCheck, 
  Users, 
  Trash2, 
  Download, 
  Share2, 
  FileText, 
  History, 
  CreditCard,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---
type Screen = 'login' | 'register' | 'forgot' | 'feed' | 'meals' | 'events' | 'stats' | 'profile' | 'invoice-list' | 'invoice-detail' | 'family' | 'emergency';

// --- Components ---

const ForgotPasswordScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-secondary-container rounded-lg flex items-center justify-center shadow-md border-b-4 border-secondary-dim">
            <Lock size={40} className="text-secondary" />
          </div>
        </div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Şifremi Unuttum</h1>
        <p className="text-on-surface-variant font-medium">E-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim.</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border-b-4 border-surface-container">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setScreen('login'); }}>
          <div className="space-y-1.5">
            <label className="font-headline text-xs font-bold text-on-surface-variant ml-1 uppercase">E-POSTA</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-2 focus:ring-secondary text-on-surface font-medium" placeholder="ornek@istudy.com" type="email" required />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-secondary text-on-secondary font-headline font-extrabold text-lg rounded-md shadow-md border-b-4 border-secondary-dim tactile-button">
            Bağlantı Gönder
          </button>
        </form>
      </div>

      <div className="text-center">
        <button onClick={() => setScreen('login')} className="text-on-surface-variant font-bold hover:text-primary flex items-center justify-center gap-2 mx-auto">
          <ChevronLeft size={20} /> Giriş Ekranına Dön
        </button>
      </div>
    </div>
  </div>
);

const EmergencyScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen bg-error-container/10 pb-24 pt-20">
    <Header title="Acil Durum" onBack={() => setScreen('profile')} />
    <main className="px-4 max-w-md mx-auto space-y-6">
      <div className="bg-error p-6 rounded-2xl text-white shadow-xl border-b-4 border-error-dim relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <AlertTriangle size={32} />
            </div>
            <h2 className="font-headline text-2xl font-black">ACİL YARDIM</h2>
          </div>
          <p className="font-medium text-error-container mb-6">Aşağıdaki butonlardan birine basarak anında yardım isteyebilir veya yetkililere ulaşabilirsiniz.</p>
          <button className="w-full py-6 bg-white text-error font-headline font-black text-xl rounded-2xl shadow-2xl animate-pulse flex items-center justify-center gap-3">
            <Phone size={28} className="fill-current" /> 112'Yİ ARA
          </button>
        </div>
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="space-y-4">
        <h3 className="font-headline font-bold text-on-surface-variant text-xs tracking-widest uppercase px-2">HIZLI ERİŞİM</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'Okul Güvenliği', phone: '0212 555 01 01', icon: ShieldCheck },
            { label: 'Sınıf Öğretmeni', phone: '0555 123 45 67', icon: User },
            { label: 'Okul Reviri', phone: '0212 555 01 02', icon: Heart },
          ].map(contact => (
            <button key={contact.label} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border-b-4 border-surface-container tactile-button">
              <div className="flex items-center gap-4">
                <div className="bg-surface-container p-3 rounded-xl text-primary">
                  <contact.icon size={24} />
                </div>
                <div className="text-left">
                  <p className="font-headline font-bold text-on-surface">{contact.label}</p>
                  <p className="text-on-surface-variant text-sm font-medium">{contact.phone}</p>
                </div>
              </div>
              <div className="bg-primary-container p-2 rounded-full text-primary">
                <Phone size={20} className="fill-current" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-b-4 border-surface-container shadow-sm space-y-4">
        <h3 className="font-headline font-bold text-on-surface">Konum Bilgisi</h3>
        <div className="aspect-video bg-surface-container rounded-xl flex items-center justify-center relative overflow-hidden">
          <img 
            className="w-full h-full object-cover opacity-50" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGGZ7yYhjFfZwaoWBFKpsE_ughhdYqkbV_N_s__gjkt0oXxDeDATy17vv3i4nRLEGzKlx-FbIRb4cJr55A-YzpF9bJSLe4f3kGpWRYsKRhkWV03012WiaDKb8-0CBe99sEVM_EAQ51sqIrya2tmwSojup-ZBIarfEqKp3UlzHhErH5ygoNESbRW1ozhkVUYVUdJjftT2vDczpN0BkvmGCNDgSgKIos6iMM4BsUJShUmeE25_47k4dT-WmNKqr90XgK9LK6zsbFX50" 
            alt="Map Placeholder"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="bg-primary p-2 rounded-full text-white shadow-lg mb-2">
              <Home size={24} />
            </div>
            <p className="font-bold text-on-surface text-sm">Okul Konumu: Atatürk İlkokulu</p>
            <p className="text-[10px] text-on-surface-variant font-medium">Merkez Mah. Okul Sok. No:1</p>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const BottomNav = ({ current, setScreen }: { current: Screen, setScreen: (s: Screen) => void }) => {
  const items = [
    { id: 'feed', icon: Home, label: 'Akış' },
    { id: 'meals', icon: Utensils, label: 'Yemek' },
    { id: 'events', icon: Calendar, label: 'Etkinlikler' },
    { id: 'stats', icon: BarChart3, label: 'İstatistikler' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-surface-container flex justify-around items-center px-4 pb-safe z-50 rounded-t-[2rem] shadow-lg">
      {items.map((item) => {
        const isActive = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as Screen)}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200",
              isActive ? "bg-primary-container/20 text-primary" : "text-on-surface-variant"
            )}
          >
            <item.icon size={24} className={cn(isActive && "fill-current")} />
            <span className="text-[10px] font-headline font-bold mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const Header = ({ title, onBack, rightElement }: { title: string, onBack?: () => void, rightElement?: React.ReactNode }) => (
  <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-container flex items-center justify-between px-6 z-50 rounded-b-[2rem] shadow-sm">
    <div className="flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 className="font-headline font-bold text-xl text-primary">{title}</h1>
    </div>
    {rightElement || (
      <button className="p-2 hover:bg-surface-container rounded-full transition-colors relative">
        <Bell size={24} className="text-on-surface-variant" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
      </button>
    )}
  </header>
);

// --- Screens ---

const LoginScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full bg-white">
    <div className="flex flex-col items-center mb-12 text-center">
      <div className="relative mb-4">
        <div className="bg-primary-container p-4 rounded-xl rotate-3 flex items-center justify-center shadow-md">
          <School size={48} className="text-primary" />
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
      <div className="relative h-24 w-full mb-8 overflow-visible flex justify-center">
        <img 
          className="w-32 h-32 object-contain" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvkAe9VmKyMKqagnIWZB4Zx3IsjCQICSHCU6XMbj9_MOj6oRyg07M8BSO2GmfPK-l3eXz0IhqydNysWkPjb6_A-LqOCJfmJyQxojR5kSZO2XAO9Px7q_zH6J8Tnz3fOKFd7oFK6yWXWlnUtit04uqvnQ3YL7IVFsFdbxDUppowMdUFHfAjSp93rCHCvy_TiIx-4JuvrWNhvWJVx83yBt7gEh4rcr1qrExUNprIppMDmuMCEhewxHtSvsVvY5_ISyL2SfvgMZvNluM" 
          alt="Character"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="space-y-4">
        <div className="group">
          <label className="block font-headline text-sm font-bold text-on-surface-variant mb-2 ml-1">E-posta</label>
          <div className="relative">
            <input 
              className="w-full bg-surface-container-low border-2 border-surface-container rounded-lg px-5 py-4 font-body text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all outline-none" 
              placeholder="örnek@eposta.com" 
              type="email"
            />
          </div>
        </div>
        <div className="group">
          <label className="block font-headline text-sm font-bold text-on-surface-variant mb-2 ml-1">Şifre</label>
          <div className="relative">
            <input 
              className="w-full bg-surface-container-low border-2 border-surface-container rounded-lg px-5 py-4 font-body text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all outline-none" 
              placeholder="••••••••" 
              type="password"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
              <Eye size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="text-right">
        <button 
          onClick={() => setScreen('forgot')}
          className="font-headline text-sm font-bold text-primary hover:text-primary-dim transition-colors"
        >
          Şifremi Unuttum
        </button>
      </div>

      <div className="pt-4">
        <button 
          onClick={() => setScreen('feed')}
          className="w-full py-4 bg-primary text-on-primary font-headline text-lg font-extrabold rounded-lg duo-shadow shadow-primary-dim tactile-button"
        >
          Giriş Yap
        </button>
      </div>

      <div className="text-center pt-8 border-t-2 border-surface-container">
        <p className="font-body text-on-surface-variant text-sm font-medium mb-4">
          Hesabın yok mu?
        </p>
        <button 
          onClick={() => setScreen('register')}
          className="w-full py-4 bg-white border-2 border-surface-container text-secondary font-headline text-lg font-extrabold rounded-lg duo-shadow shadow-surface-container tactile-button"
        >
          Kayıt Ol
        </button>
      </div>
    </div>
  </div>
);

const RegisterScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12">
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-2 relative">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary-container rounded-lg flex items-center justify-center shadow-md border-b-4 border-primary-dim">
            <School size={40} className="text-primary" />
          </div>
        </div>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Hesap Oluştur</h1>
        <p className="text-on-surface-variant font-medium">iStudy ile öğrenme yolculuğuna başla</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border-b-4 border-surface-container">
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setScreen('feed'); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-headline text-xs font-bold text-on-surface-variant ml-1 uppercase">AD</label>
              <input className="w-full px-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-2 focus:ring-primary text-on-surface font-medium" placeholder="Can" type="text" />
            </div>
            <div className="space-y-1.5">
              <label className="font-headline text-xs font-bold text-on-surface-variant ml-1 uppercase">SOYAD</label>
              <input className="w-full px-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-2 focus:ring-primary text-on-surface font-medium" placeholder="Yılmaz" type="text" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-headline text-xs font-bold text-on-surface-variant ml-1 uppercase">E-POSTA</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-2 focus:ring-primary text-on-surface font-medium" placeholder="ornek@istudy.com" type="email" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-headline text-xs font-bold text-on-surface-variant ml-1 uppercase">ŞİFRE</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input className="w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-md focus:ring-2 focus:ring-primary text-on-surface font-medium" placeholder="••••••••" type="password" />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Eye size={20} />
              </button>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-primary text-on-primary font-headline font-extrabold text-lg rounded-md shadow-md border-b-4 border-primary-dim tactile-button flex items-center justify-center gap-2">
            Kayıt Ol <ArrowRight size={20} />
          </button>
        </form>
      </div>

      <div className="text-center">
        <p className="text-on-surface-variant font-medium">
          Zaten bir hesabın var mı? 
          <button onClick={() => setScreen('login')} className="text-primary font-bold hover:underline ml-1">Giriş Yap</button>
        </p>
      </div>
    </div>
  </div>
);

const FeedScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen bg-surface pb-24 pt-20">
    <Header title="Okul Günlüğü" />
    <main className="px-4 max-w-md mx-auto space-y-6">
      <div className="flex p-1.5 bg-surface-container rounded-full mt-4">
        <button className="flex-1 py-2.5 px-4 rounded-full bg-white text-primary font-headline font-bold text-sm shadow-sm">
          Genel
        </button>
        <button className="flex-1 py-2.5 px-4 rounded-full text-on-surface-variant font-headline font-semibold text-sm">
          Okullar
        </button>
      </div>

      <article className="bg-white rounded-lg p-5 border-b-4 border-surface-container shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-tertiary-container flex items-center justify-center font-headline font-black text-on-tertiary-container text-lg shadow-sm">
            GS
          </div>
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">Güneş Sınıfı Etkinliği</h3>
            <p className="text-on-surface-variant text-xs font-medium">1 saat önce</p>
          </div>
          <button className="ml-auto text-on-surface-variant">
            <MoreHorizontal size={20} />
          </button>
        </div>
        <p className="text-on-surface mb-4 leading-relaxed font-medium">Bugün Gökkuşağı deneyini yaparken çok eğlendik!</p>
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-4">
          <img 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGGZ7yYhjFfZwaoWBFKpsE_ughhdYqkbV_N_s__gjkt0oXxDeDATy17vv3i4nRLEGzKlx-FbIRb4cJr55A-YzpF9bJSLe4f3kGpWRYsKRhkWV03012WiaDKb8-0CBe99sEVM_EAQ51sqIrya2tmwSojup-ZBIarfEqKp3UlzHhErH5ygoNESbRW1ozhkVUYVUdJjftT2vDczpN0BkvmGCNDgSgKIos6iMM4BsUJShUmeE25_47k4dT-WmNKqr90XgK9LK6zsbFX50" 
            alt="Activity"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex items-center gap-6 pt-2 border-t border-surface-container">
          <button className="flex items-center gap-2 group text-on-surface-variant hover:text-primary transition-colors">
            <Heart size={20} />
            <span className="text-sm font-bold">24</span>
          </button>
          <button className="flex items-center gap-2 group text-on-surface-variant hover:text-secondary transition-colors">
            <MessageCircle size={20} />
            <span className="text-sm font-bold">8</span>
          </button>
        </div>
      </article>

      <article className="bg-white rounded-lg p-5 border-b-4 border-surface-container shadow-sm relative">
        <div className="absolute -top-1 -right-1 bg-tertiary-container p-2 rounded-bl-2xl rounded-tr-lg shadow-sm">
          <Star size={18} className="text-on-tertiary-container fill-current" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center shadow-sm">
            <Megaphone size={24} className="text-secondary" />
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
          <button className="flex-1 py-3 px-4 bg-primary rounded-lg shadow-md border-b-4 border-primary-dim text-on-primary font-headline font-bold text-sm tactile-button">
            Takvime Ekle
          </button>
          <button className="py-3 px-6 bg-secondary-container rounded-lg text-on-secondary-container font-headline font-bold text-sm tactile-button">
            Detaylar
          </button>
        </div>
      </article>

      <div className="flex flex-col items-center justify-center py-8 opacity-60">
        <p className="text-on-surface-variant font-headline font-semibold text-sm italic">Hepsini gördünüz! 🎉</p>
      </div>
    </main>
    <button className="fixed bottom-24 right-6 w-14 h-14 bg-tertiary-container text-on-tertiary-container rounded-2xl flex items-center justify-center shadow-lg border-b-4 border-tertiary-dim z-40 tactile-button">
      <Edit3 size={24} />
    </button>
  </div>
);

const MealsScreen = () => (
  <div className="min-h-screen bg-surface pb-24 pt-20">
    <Header title="Yemek Günlüğü" />
    <main className="max-w-md mx-auto px-4 space-y-6">
      <section className="mt-4">
        <button className="w-full bg-white p-4 rounded-lg flex items-center justify-between shadow-sm border-b-4 border-surface-container tactile-button">
          <div className="flex items-center gap-3">
            <User size={24} className="text-primary" />
            <div className="text-left">
              <p className="font-headline font-bold text-on-surface">Ayşe Yılmaz</p>
              <p className="text-on-surface-variant text-xs font-semibold">Güneş Sınıfı</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-on-surface-variant" />
        </button>
      </section>

      <section className="flex items-center justify-center gap-6 py-2">
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary border-b-4 border-surface-container tactile-button">
          <ChevronLeft size={20} />
        </button>
        <div className="bg-primary-container px-6 py-2 rounded-full border-b-4 border-primary-dim shadow-sm">
          <span className="font-headline font-extrabold text-on-primary-container">Mart 2026</span>
        </div>
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary border-b-4 border-surface-container tactile-button">
          <ChevronRight size={20} />
        </button>
      </section>

      <article className="bg-white rounded-lg border-b-4 border-primary shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Calendar size={20} />
            <div>
              <p className="font-headline font-extrabold text-lg leading-none">14 Mart, CUM</p>
              <p className="text-[10px] font-bold tracking-widest uppercase mt-1 opacity-80">Bugünkü Menü</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center border-2 border-dashed border-tertiary-container">
                <Utensils size={20} className="text-tertiary" />
              </div>
              <div className="w-0.5 h-full bg-surface-container mt-2" />
            </div>
            <div className="flex-1 pb-4">
              <h3 className="font-headline font-bold text-on-surface-variant text-sm mb-2">Kahvaltı</h3>
              <div className="flex flex-wrap gap-2">
                {['Peynir', 'Zeytin', 'Bal'].map(t => (
                  <span key={t} className="bg-surface-container px-3 py-1 rounded-full text-xs font-medium">{t}</span>
                ))}
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">Süt</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center border-2 border-primary">
                <Utensils size={20} className="text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-headline font-bold text-on-surface text-sm">Öğle Yemeği</h3>
                <div className="bg-error px-2 py-0.5 rounded text-[9px] font-black text-white uppercase">Yüksek Risk</div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-on-surface">Mercimek Çorbası, Tavuk Sote, Pilav</p>
                <div className="flex items-center gap-2 p-3 bg-error/5 rounded-md border-l-4 border-error">
                  <AlertTriangle size={16} className="text-error" />
                  <p className="text-xs font-bold text-error">Alerjen Uyarısı: Süt içerir!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="bg-secondary rounded-lg p-6 border-b-4 border-secondary-dim text-white relative overflow-hidden shadow-md">
        <div className="relative z-10">
          <h2 className="font-headline font-bold text-xl mb-1">Haftalık Rapor</h2>
          <p className="text-on-secondary text-sm mb-4">Ayşe bu hafta protein ağırlıklı beslendi.</p>
          <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
            <div className="bg-primary-container h-full w-[75%] rounded-full shadow-lg" />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">%75 Sağlıklı Tercih</span>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
      </section>
    </main>
  </div>
);

const EventsScreen = () => (
  <div className="min-h-screen bg-surface pb-24 pt-20">
    <Header title="Etkinlikler" />
    <main className="px-4 max-w-md mx-auto space-y-8">
      <div className="flex gap-2 p-1.5 bg-surface-container rounded-2xl">
        <button className="flex-1 py-3 px-2 rounded-xl bg-white shadow-sm text-sm font-headline font-bold text-primary">
          Okul Etkinlikleri
        </button>
        <button className="flex-1 py-3 px-2 rounded-xl text-sm font-headline font-bold text-on-surface-variant">
          Etkinlik Sınıfları
        </button>
      </div>

      <div className="relative">
        <h2 className="font-headline text-2xl font-extrabold tracking-tight mb-6">Yaklaşan Etkinlikler</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg overflow-hidden border-b-4 border-surface-container shadow-sm group">
            <div className="relative h-48 overflow-hidden">
              <img 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKzNzBULrqNFZMaBuFfb04DzrK1ovUcmYGPPITYxiHp__AzUJTobqKf0t8QhoCEe8_K9Zzf__jcTzKa055dzsxPRcuDv1ccZ0Bh8Ig9u-eDIFj4spr9gKjXkkIC5CcDK3SmJeQL5fCWskgdihNtcgHaIXvW57nfCZ0Hr_i88-ilU9lkSwsxgRlAQAPvnLSwtOTD6ZEqXYIBbvkrPPWdh5kXre49sEib3HLgGjZZnfryhoKeHaBMdIkzW81qz4cQPd0G7dRQKP8Jt4" 
                alt="Event"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Verified size={12} /> Katıldınız
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
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Tarih</p>
                  <p className="text-xs font-bold text-on-surface-variant">21 Nis - 24 Nis</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4 text-on-surface-variant text-sm font-semibold">
                <Users size={18} className="text-primary" />
                <span>Tüm Okul</span>
              </div>
              <button className="w-full py-4 bg-primary text-on-primary font-headline font-extrabold tracking-wide uppercase rounded-xl shadow-md border-b-4 border-primary-dim tactile-button">
                Detayları Gör
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-tertiary-container/20 p-6 rounded-lg border-2 border-tertiary-container/30 flex items-center gap-4">
        <div className="bg-tertiary-container p-3 rounded-2xl shadow-sm">
          <Star size={24} className="text-on-tertiary-container fill-current" />
        </div>
        <div>
          <h4 className="font-headline font-bold text-on-surface">Yeni Rozetler Bekliyor!</h4>
          <p className="text-xs text-on-surface-variant font-medium">Etkinliklere katılarak "Sosyal Kelebek" rozetini kazanabilirsin.</p>
        </div>
      </div>
    </main>
  </div>
);

const StatsScreen = () => (
  <div className="min-h-screen bg-surface pb-24 pt-20">
    <Header title="İstatistikler" />
    <main className="px-4 max-w-md mx-auto space-y-8">
      <div className="flex overflow-x-auto gap-4 py-2 custom-scrollbar px-2">
        <button className="flex-shrink-0 flex items-center gap-3 bg-primary-container text-on-primary-container px-4 py-2.5 rounded-full border-b-4 border-primary-dim shadow-sm">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
            <User size={20} />
          </div>
          <span className="font-headline font-bold text-sm">Can</span>
        </button>
        {['Elif', 'Mert'].map(name => (
          <button key={name} className="flex-shrink-0 flex items-center gap-3 bg-white text-on-surface-variant px-4 py-2.5 rounded-full shadow-sm">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center overflow-hidden">
              <User size={20} />
            </div>
            <span className="font-headline font-semibold text-sm">{name}</span>
          </button>
        ))}
      </div>

      <section className="bg-primary rounded-xl p-6 text-on-primary shadow-md relative overflow-hidden border-b-4 border-primary-dim">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-90">
              <School size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Okul Bilgisi</span>
            </div>
            <h2 className="text-xl font-headline font-extrabold tracking-tight">Atatürk İlkokulu</h2>
            <p className="text-primary-container font-medium text-sm">3-B Sınıfı • Bahar Dönemi</p>
          </div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <Star size={32} className="fill-current" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'GELDİ', val: '84', color: 'primary', icon: Verified },
          { label: 'GELMEDİ', val: '4', color: 'error', icon: X },
          { label: 'GEÇ GELDİ', val: '2', color: 'tertiary', icon: History },
          { label: 'İZİNLİ', val: '5', color: 'secondary', icon: FileText },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-5 rounded-lg flex flex-col items-center gap-3 border-b-4 border-surface-container shadow-sm">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border-b-4", `bg-${stat.color}-container/20 text-${stat.color} border-${stat.color}/20`)}>
              <stat.icon size={24} />
            </div>
            <div className="text-center">
              <span className="block text-2xl font-headline font-black text-on-surface">{stat.val}</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-surface-container-low p-6 rounded-lg space-y-4 shadow-inner">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-on-surface">Devam Durumu</h3>
          <span className="text-[10px] font-bold text-on-surface-variant bg-white px-2 py-1 rounded-full shadow-sm">TOPLAM: 95 GÜN</span>
        </div>
        <div className="h-4 w-full bg-surface-container rounded-full overflow-hidden flex shadow-inner">
          <div className="h-full bg-primary" style={{ width: '88.4%' }} />
          <div className="h-full bg-tertiary" style={{ width: '2.1%' }} />
          <div className="h-full bg-error" style={{ width: '4.2%' }} />
          <div className="h-full bg-secondary" style={{ width: '5.3%' }} />
        </div>
        <div className="grid grid-cols-2 gap-y-2 pt-2">
          {[
            { c: 'bg-primary', l: '%88.4 Katılım' },
            { c: 'bg-error', l: '%4.2 Devamsız' },
            { c: 'bg-tertiary', l: '%2.1 Gecikme' },
            { c: 'bg-secondary', l: '%5.3 İzinli' },
          ].map(i => (
            <div key={i.l} className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant">
              <span className={cn("w-2 h-2 rounded-full", i.c)} /> {i.l}
            </div>
          ))}
        </div>
      </section>
    </main>
  </div>
);

const ProfileScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen bg-surface pb-24 pt-20">
    <Header title="Profil" />
    <main className="px-4 max-w-md mx-auto space-y-6">
      <section className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
            <span className="text-on-primary-container font-headline text-3xl font-extrabold">AK</span>
          </div>
          <button className="absolute bottom-0 right-0 bg-tertiary-container p-1.5 rounded-full border-2 border-white shadow-sm tactile-button">
            <Edit3 size={14} className="text-on-tertiary-container" />
          </button>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="font-headline font-bold text-2xl tracking-tight">Ahmet Kaya</h2>
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Verified size={12} className="fill-current" /> Doğrulandı
            </span>
          </div>
          <p className="text-on-surface-variant font-medium text-sm">ahmet.kaya@email.com</p>
        </div>
      </section>

      <div className="bg-tertiary-container/20 border-l-4 border-tertiary-container p-4 rounded-r-xl flex items-start gap-4 shadow-sm">
        <AlertTriangle size={20} className="text-tertiary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-headline font-bold text-tertiary-dim text-sm">Ödenmemiş Faturalar</p>
          <p className="text-on-tertiary-container text-xs mt-1 leading-relaxed">Mart ayı okul taksit ödemeniz gecikmiştir. Lütfen mali işlemleri kontrol edin.</p>
        </div>
        <button onClick={() => setScreen('invoice-list')} className="text-tertiary font-bold text-xs underline underline-offset-4">Gözat</button>
      </div>

      <div className="space-y-4">
        {[
          { title: 'Hesap', items: [
            { icon: User, label: 'Kişisel Bilgiler' },
            { icon: Lock, label: 'Güvenlik ve Şifre' },
          ]},
          { title: 'Çocuklar & Okullar', items: [
            { icon: Users, label: 'Öğrenci Profilleri', onClick: () => setScreen('family') },
            { icon: School, label: 'Okul Bilgileri' },
            { icon: AlertTriangle, label: 'Acil Durum Rehberi', onClick: () => setScreen('emergency') },
          ]},
          { title: 'Mali İşlemler', items: [
            { icon: CreditCard, label: 'Ödemeler ve Faturalar', onClick: () => setScreen('invoice-list'), badge: true },
          ]},
        ].map(section => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-2 font-headline font-bold text-on-surface-variant text-[10px] uppercase tracking-widest">{section.title}</h3>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border-b-4 border-surface-container">
              {section.items.map((item, idx) => (
                <button 
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "w-full flex items-center justify-between p-4 hover:bg-surface-container transition-colors group",
                    idx !== 0 && "border-t border-surface-container"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-white transition-colors">
                      <item.icon size={20} />
                    </div>
                    <span className="font-headline font-semibold text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && <span className="w-2 h-2 rounded-full bg-error animate-pulse" />}
                    <ChevronRight size={18} className="text-surface-container-highest" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => setScreen('login')}
        className="w-full mt-4 py-4 px-6 bg-error text-white rounded-xl shadow-lg border-b-4 border-error-dim flex items-center justify-center gap-3 font-headline font-extrabold tracking-wide uppercase text-sm tactile-button"
      >
        <LogOut size={20} /> Çıkış Yap
      </button>
    </main>
  </div>
);

const InvoiceListScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen bg-surface pb-24 pt-20">
    <Header title="Faturalarım" onBack={() => setScreen('profile')} />
    <main className="px-4 max-w-md mx-auto space-y-8">
      <section className="grid grid-cols-3 gap-3">
        {[
          { l: 'Bekleyen', v: '4', c: 'text-secondary', bg: 'bg-white' },
          { l: 'Gecikmiş', v: '1', c: 'text-on-error-container', bg: 'bg-error-container/20' },
          { l: 'Ödendi', v: '12', c: 'text-on-primary-container', bg: 'bg-primary-container/20' },
        ].map(s => (
          <div key={s.l} className={cn(s.bg, "p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm border-b-4 border-surface-container")}>
            <span className={cn(s.c, "font-headline font-black text-2xl")}>{s.v}</span>
            <span className="text-[10px] font-bold text-on-surface-variant leading-tight uppercase tracking-wider">{s.l}</span>
          </div>
        ))}
      </section>

      <div className="space-y-4">
        <h2 className="font-headline font-bold text-lg px-2">Fatura Geçmişi</h2>
        <div className="space-y-3">
          <div 
            onClick={() => setScreen('invoice-detail')}
            className="bg-white rounded-lg overflow-hidden flex shadow-sm border-b-4 border-surface-container cursor-pointer tactile-button"
          >
            <div className="w-3 bg-error shrink-0" />
            <div className="p-4 flex-1 flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-on-surface">FAT-2023-089</span>
                  <span className="bg-error text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Gecikmiş!</span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-sm font-medium">
                  <User size={14} /> <span>Ali Yılmaz</span>
                </div>
                <div className="text-[10px] text-error font-bold">Son Ödeme: 12.10.2023</div>
              </div>
              <div className="text-right">
                <div className="font-headline font-black text-xl text-on-surface">₺1.250</div>
                <button className="mt-2 bg-error text-white text-[10px] font-black px-4 py-2 rounded-full shadow-md border-b-4 border-error-dim">ŞİMDİ ÖDE</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const InvoiceDetailScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen bg-surface pb-24 pt-20">
    <Header title="Fatura Detayı" onBack={() => setScreen('invoice-list')} />
    <main className="px-4 max-w-md mx-auto space-y-6">
      <section className="relative bg-white rounded-lg p-8 shadow-md border-b-4 border-surface-container overflow-hidden text-center">
        <div className="absolute -right-4 -top-4 w-32 h-32 opacity-5 rotate-12">
          <FileText size={120} className="text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">FATURA NO: #INV-2024-089</p>
        <h2 className="font-headline text-5xl font-black text-on-surface mb-4">₺12.450<span className="text-2xl">,00</span></h2>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full font-headline font-bold text-sm border-b-2 border-primary-dim/20 shadow-sm">
          <Verified size={16} className="fill-current" /> ÖDENDİ
        </div>
      </section>

      <section className="bg-surface-container-low rounded-lg p-6 space-y-4 shadow-inner">
        <h3 className="font-headline font-black text-lg flex items-center gap-2">
          <FileText size={20} className="text-primary" /> Fatura Kalemleri
        </h3>
        <div className="bg-white rounded-lg p-4 space-y-4 shadow-sm">
          {[
            { l: 'Eğitim Ücreti', d: 'Mayıs 2024 Dönemi', p: '₺9.500,00' },
            { l: 'Servis Ücreti', d: 'Sabah/Akşam - Bölge 1', p: '₺2.250,00' },
            { l: 'Yemek Ücreti', d: '3 Öğün Tam Menü', p: '₺700,00' },
          ].map(item => (
            <div key={item.l} className="flex justify-between items-center pb-3 border-b border-surface-container last:border-0 last:pb-0">
              <div>
                <p className="font-bold text-sm">{item.l}</p>
                <p className="text-[10px] text-on-surface-variant font-medium">{item.d}</p>
              </div>
              <p className="font-black text-sm">{item.p}</p>
            </div>
          ))}
          <div className="pt-4 border-t-2 border-dashed border-surface-container flex justify-between items-center">
            <span className="font-headline font-bold text-on-surface-variant">Genel Toplam</span>
            <span className="font-headline font-black text-xl text-primary">₺12.450,00</span>
          </div>
        </div>
      </section>

      <button className="w-full h-14 bg-primary text-white rounded-lg font-headline font-black flex items-center justify-center gap-3 border-b-4 border-primary-dim shadow-lg tactile-button">
        <Download size={20} /> Faturayı İndir (PDF)
      </button>
    </main>
  </div>
);

const FamilyScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="min-h-screen bg-surface pb-24 pt-20">
    <Header title="Aile Üyeleri" onBack={() => setScreen('profile')} />
    <main className="px-4 max-w-md mx-auto space-y-8">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-headline font-bold text-on-surface-variant text-xs tracking-widest uppercase">KAYITLI ÜYELER</h2>
        <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold">3 AKTİF</span>
      </div>

      <div className="space-y-4">
        {[
          { name: 'Ahmet Yılmaz', role: 'Baba', tag: 'Ana Veli', color: 'primary' },
          { name: 'Zeynep Yılmaz', role: 'Anne', tag: 'Eş Veli', color: 'secondary' },
          { name: 'Mehmet Demir', role: 'Dede', tag: null, color: 'tertiary' },
        ].map(m => (
          <div key={m.name} className="bg-white p-5 rounded-lg flex items-center gap-4 shadow-sm border-b-4 border-surface-container relative overflow-hidden group">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden shrink-0", `bg-${m.color}-container`)}>
              <User size={32} className={cn(`text-${m.color}`)} />
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-headline font-extrabold text-lg leading-tight">{m.name}</h3>
                {m.tag && <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-md uppercase", m.tag === 'Ana Veli' ? "bg-tertiary-container text-on-tertiary-container" : "bg-secondary text-white")}>{m.tag}</span>}
              </div>
              <p className="text-on-surface-variant text-sm font-medium">{m.role}</p>
            </div>
            <button className="text-error-dim hover:bg-error/10 p-2 rounded-full transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <button className="w-full py-4 bg-primary text-on-primary font-headline font-extrabold rounded-xl border-b-4 border-primary-dim shadow-lg flex items-center justify-center gap-2 tactile-button">
        <Plus size={20} /> Üye Ekle
      </button>
    </main>
  </div>
);

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');

  const renderScreen = () => {
    switch (screen) {
      case 'login': return <LoginScreen setScreen={setScreen} />;
      case 'register': return <RegisterScreen setScreen={setScreen} />;
      case 'forgot': return <ForgotPasswordScreen setScreen={setScreen} />;
      case 'feed': return <FeedScreen setScreen={setScreen} />;
      case 'meals': return <MealsScreen />;
      case 'events': return <EventsScreen />;
      case 'stats': return <StatsScreen />;
      case 'profile': return <ProfileScreen setScreen={setScreen} />;
      case 'invoice-list': return <InvoiceListScreen setScreen={setScreen} />;
      case 'invoice-detail': return <InvoiceDetailScreen setScreen={setScreen} />;
      case 'family': return <FamilyScreen setScreen={setScreen} />;
      case 'emergency': return <EmergencyScreen setScreen={setScreen} />;
      default: return <LoginScreen setScreen={setScreen} />;
    }
  };

  const showBottomNav = ['feed', 'meals', 'events', 'stats', 'profile', 'invoice-list', 'invoice-detail', 'family'].includes(screen);

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      {showBottomNav && <BottomNav current={screen} setScreen={setScreen} />}
    </div>
  );
}
