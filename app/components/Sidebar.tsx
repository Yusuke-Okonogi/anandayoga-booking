'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', body: '' });
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', currentUser.id)
            .single();
          setIsAdmin(!error && profile?.role === 'admin');
          
          setContactForm(prev => ({
            ...prev,
            name: profile?.full_name || '',
            email: profile?.email || currentUser.email || ''
          }));
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }
    };

    checkUser();

    if (pathname === '/') {
      const observerOptions = { root: null, rootMargin: '-40% 0px -50% 0px', threshold: 0 };
      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      };
      const observer = new IntersectionObserver(observerCallback, observerOptions);
      ['news', 'class', 'price', 'trial', 'access', 'instructor'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
      return () => observer.disconnect();
    } else {
      setActiveSection('');
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') checkUser();
    });

    return () => authListener.subscription.unsubscribe();
  }, [pathname]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingContact(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          userEmail: contactForm.email,
          userName: contactForm.name,
          contactSubject: contactForm.subject,
          contactBody: contactForm.body
        }),
      });
      if (!res.ok) throw new Error('送信失敗');
      alert('お問い合わせを送信しました。');
      setContactModalOpen(false);
      setContactForm(prev => ({ ...prev, subject: '', body: '' }));
    } catch (err) {
      alert('送信に失敗しました。');
    }
    setSendingContact(false);
  };

  // 通常メニュー（管理画面を除外）
  const menuItems = [
    { href: "/#news", label: "お知らせ", id: "news" },
    { href: "/#class", label: "クラス", id: "class" },
    { href: "/#price", label: "料金", id: "price" },
    { href: "/#trial", label: "体験レッスン", id: "trial" },
    { href: "/#access", label: "アクセス", id: "access" },
    { href: "/#instructor", label: "講師紹介", id: "instructor" },
    { href: "/program", label: "養成講座" },
  ];

  return (
    <div className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[280px] p-4 z-50 pointer-events-none">
      <aside className="w-full h-full bg-white rounded-3xl shadow-xl flex flex-col pointer-events-auto overflow-hidden border border-stone-100 relative">
        
        {/* ヘッダーセクション（ロゴ＋管理者ステータス） */}
        <div className={`px-4 py-4 border-b transition-all duration-500 ${isAdmin ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-50'}`}>
          <Link href="/" className="flex flex-col items-center gap-2 hover:opacity-80 transition shrink-0" onClick={() => setActiveSection('')}>
            {isAdmin && (
              <div className="flex flex-col items-center mb-1">
                <span className="text-[12px] font-bold text-[#EEA51A] tracking-[0.1em] bg-[#EEA51A]/10 px-4 py-1 rounded-full border border-[#EEA51A]/40 shadow-[0_0_15px_rgba(238,165,26,0.15)] animate-pulse">
                  管理者ログイン中
                </span>
              </div>
            )}
            <img 
              src="/img/logo.png" 
              alt="Ananda Yoga" 
              className={`h-7 w-auto object-contain transition-all ${isAdmin ? 'brightness-0 invert' : ''}`} 
            />
            <div className={`flex items-center justify-center gap-3 transition-all ${isAdmin ? 'opacity-40 brightness-0 invert' : 'opacity-40'}`}>
              <img src="/img/rys200.png" alt="RYS200" className="h-8 w-auto object-contain" />
              <img src="/img/yoga_alliance.png" alt="Yoga Alliance" className="h-8 w-auto object-contain" />
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden">
          {/* ★ 管理画面専用枠（一番上に表示） */}
          {isAdmin && (
            <div className="mb-6 px-2">
              <Link 
                href="/admin" 
                className={`flex items-center gap-3 w-full p-2 rounded-2xl border transition-all duration-200 ${pathname.startsWith('/admin') ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'}`}
              >
                <div className={`p-2 rounded-lg ${pathname.startsWith('/admin') ? 'bg-[#EEA51A]' : 'bg-stone-100'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={pathname.startsWith('/admin') ? 'text-white' : 'text-stone-500'}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                </div>
                <span className="text-sm font-bold">管理画面へ</span>
              </Link>
            </div>
          )}

          <p className="px-2 mb-3 text-[10px] font-bold text-stone-400 tracking-widest uppercase">メニュー</p>
          <div className="grid grid-cols-2">
            {menuItems.map((item, index) => (
              <NavItem 
                key={item.label}
                href={item.href} 
                label={item.label} 
                active={item.id ? (pathname === '/' && activeSection === item.id) : pathname === item.href}
                index={index}
                total={menuItems.length}
                onClick={() => item.id && setActiveSection(item.id)}
              />
            ))}
          </div>
        </nav>

        {/* フッター（予約・問合せ・ログイン） */}
        <div className="p-6 bg-stone-50 border-t border-stone-100 mt-auto rounded-b-3xl space-y-2">
          <Link href="/booking" className="block w-full py-3 rounded-2xl transition-all duration-200 text-sm font-bold text-center bg-[#EEA51A] text-white shadow-md hover:bg-[#D99000] active:scale-95 transform">
            予約カレンダー
          </Link>
          <button onClick={() => setContactModalOpen(true)} className="block w-full py-3 rounded-xl transition-all duration-200 text-xs font-bold text-center bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 active:scale-95 transform">
            お問合せ
          </button>
          {user ? (
            <div className="flex gap-2 w-full">
              <Link href="/mypage" className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${pathname === '/mypage' ? 'bg-[#EEA51A] border-[#EEA51A] text-white' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span className="text-[8px] mt-0.5 font-bold uppercase">Mypage</span>
              </Link>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} className="flex-1 flex flex-col items-center justify-center py-2 bg-stone-200 rounded-xl text-stone-500 hover:bg-stone-300 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span className="text-[8px] mt-0.5 font-bold uppercase">Logout</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="block w-full py-3 bg-stone-800 text-white text-center rounded-xl font-bold text-[10px] shadow-sm hover:bg-stone-700 transition">
              ログイン
            </Link>
          )}
          <p className="text-[9px] text-center text-stone-400 pt-2 tracking-wider font-medium uppercase">© 2026 ANANDA YOGA</p>
        </div>

        {/* お問い合わせモーダル */}
        {contactModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-md pointer-events-auto" onClick={() => setContactModalOpen(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-stone-100" onClick={e => e.stopPropagation()}>
              <button onClick={() => setContactModalOpen(false)} className="absolute top-5 right-5 text-stone-400 hover:text-stone-950 transition-colors text-xl">✕</button>
              <h3 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2">✉️ お問い合わせ</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                {!user && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 ml-1">お名前</p>
                      <input required placeholder="例：山田 太郎" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:ring-1 focus:ring-[#EEA51A] focus:outline-none text-sm text-stone-900 font-medium placeholder:text-stone-300"
                        value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 ml-1">メールアドレス</p>
                      <input type="email" required placeholder="example@mail.com" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:ring-1 focus:ring-[#EEA51A] focus:outline-none text-sm text-stone-900 font-medium placeholder:text-stone-300"
                        value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-400 ml-1">件名</p>
                  <input required placeholder="ご用件を入力してください" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:ring-1 focus:ring-[#EEA51A] focus:outline-none text-sm text-stone-900 font-medium placeholder:text-stone-300"
                    value={contactForm.subject} onChange={e => setContactForm({...contactForm, subject: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-400 ml-1">内容</p>
                  <textarea required rows={5} placeholder="こちらにお問い合わせ内容をご記入ください" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:ring-1 focus:ring-[#EEA51A] focus:outline-none text-sm text-stone-900 font-medium placeholder:text-stone-300 leading-relaxed"
                    value={contactForm.body} onChange={e => setContactForm({...contactForm, body: e.target.value})} />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setContactModalOpen(false)} className="flex-1 bg-stone-100 text-stone-500 font-bold py-3.5 rounded-xl hover:bg-stone-200 text-sm transition-colors">閉じる</button>
                  <button type="submit" disabled={sendingContact} className="flex-1 bg-[#EEA51A] text-white font-bold py-3.5 rounded-xl hover:bg-[#D99000] shadow-lg shadow-orange-200 disabled:opacity-50 transition-all text-sm transform active:scale-95">
                    {sendingContact ? '送信中...' : '送信する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function NavItem({ href, label, active, index, total, onClick }: any) {
  const isLeftColumn = index % 2 === 0;
  const isLastRow = index >= total - (total % 2 === 0 ? 2 : 1);
  return (
    <Link href={href || '#'} onClick={onClick} className="w-full h-full block">
      <div className={`flex items-center justify-center py-4 px-1 transition-all duration-200 border-stone-100 w-full h-full
        ${isLeftColumn ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''}
        ${active ? 'bg-[#FFF8E1]/60 text-[#EEA51A] font-bold' : 'text-stone-600 hover:bg-stone-50/50 hover:text-stone-900'}`}>
        <span className="text-[12px] tracking-tight text-center leading-tight">{label}</span>
      </div>
    </Link>
  );
}