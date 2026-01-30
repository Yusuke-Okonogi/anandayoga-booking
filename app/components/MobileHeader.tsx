'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

export default function MobileHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', body: '' });
  const [sendingContact, setSendingContact] = useState(false);

  // ★ 認証チェックと監視の設定（pathnameを依存配列から外して無限ループを防止）
  useEffect(() => {
    let isMounted = true; // メモリリーク防止フラグ

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', currentUser.id)
            .single();
          
          if (isMounted && profile) {
            setIsAdmin(profile.role === 'admin');
            setContactForm(prev => ({
              ...prev,
              name: profile.full_name || '',
              email: profile.email || currentUser.email || ''
            }));
          }
        } else {
          if (isMounted) {
            setIsAdmin(false);
            setContactForm({ name: '', email: '', subject: '', body: '' });
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkUser();

    // ★ 認証状態の変化を監視（SIGNED_IN / SIGNED_OUT のみに反応）
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        checkUser();
      }
    });

    return () => {
      isMounted = false; // クリーンアップ
      authListener.subscription.unsubscribe();
    };
  }, []); // 依存配列を空にすることで、ページ遷移ごとの再登録を防ぐ

  // メニュー開閉時のスクロール制御
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
  }, [isMenuOpen]);

  // ★ ページ遷移時にメニューを閉じる処理（これのみ pathname を監視）
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

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
      if (!res.ok) throw new Error();
      alert('送信しました。');
      setContactModalOpen(false);
    } catch (err) {
      alert('送信に失敗しました。');
    }
    setSendingContact(false);
  };

  const menuItems = [
    { href: "/#news", label: "お知らせ" },
    { href: "/#class", label: "クラス" },
    { href: "/#price", label: "料金" },
    { href: "/#trial", label: "体験レッスン" },
    { href: "/#access", label: "アクセス" },
    { href: "/#instructor", label: "講師紹介" },
    { href: "/program", label: "養成講座" },
  ];

  return (
    <>
      <style jsx global>{`
        .menu-fab { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .menu-fab:not(.open) { animation: pulse-ripple 2s infinite; }
        @keyframes pulse-ripple {
          0% { box-shadow: 0 0 0 0 rgba(238, 165, 26, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(238, 165, 26, 0); }
          100% { box-shadow: 0 0 0 0 rgba(238, 165, 26, 0); }
        }
      `}</style>

      {/* トップヘッダー */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 h-14 flex items-center justify-between px-4">
        <Link href="/">
          <img src="/img/logo.png" alt="Ananda Yoga" className="h-6 w-auto" />
        </Link>
        {user ? (
          <Link href="/mypage" className="bg-[#EEA51A] text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            マイページ
          </Link>
        ) : (
          <Link href="/login" className="bg-stone-800 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-sm">
            ログイン
          </Link>
        )}
      </header>

      {/* FABボタン */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`md:hidden menu-fab fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-300 shadow-lg
          ${isMenuOpen ? 'open bg-stone-900 border-stone-800 text-white' : 'bg-white border-[#EEA51A] text-[#EEA51A]'}`}
      >
        {isMenuOpen ? (
          <>
            <span className="text-xl leading-none">✕</span>
            <span className="text-[8px] font-black tracking-widest mt-0.5">CLOSE</span>
          </>
        ) : (
          <>
            <img src="/img/icon.png" alt="" className="w-7 h-7 object-contain" />
            <span className="text-[8px] font-black tracking-widest">MENU</span>
          </>
        )}
      </button>

      {/* メニューオーバーレイ */}
      <div className={`md:hidden fixed inset-0 z-[10000] bg-[#F9F8F6] transition-all duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="h-full flex flex-col p-6 pt-16 overflow-y-auto pb-32">
          
          {isAdmin && (
            <div className="mb-6 bg-stone-900 rounded-2xl p-4 flex items-center justify-between border border-[#EEA51A]/30 shadow-md">
              <span className="text-white text-xs font-bold tracking-wider">管理者ログイン中</span>
              <Link href="/admin" className="text-[#EEA51A] text-[10px] font-black bg-[#EEA51A]/10 px-3 py-1.5 rounded-full border border-[#EEA51A]/20">管理画面へ</Link>
            </div>
          )}

          <p className="text-[10px] font-black text-stone-400 tracking-widest uppercase mb-4 px-2 text-center">Main Menu</p>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            {menuItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className="flex items-center justify-center py-4 px-2 bg-white rounded-xl border border-stone-200 text-stone-600 text-[13px] font-bold shadow-sm active:scale-95 transition-transform"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="space-y-2.5">
            <Link href="/booking" className="block w-full py-4 bg-[#EEA51A] text-white text-center rounded-2xl font-black text-sm shadow-md active:opacity-90">
              予約カレンダー
            </Link>
            <button onClick={() => setContactModalOpen(true)} className="block w-full py-4 bg-white border border-stone-200 text-stone-700 rounded-2xl font-bold text-sm shadow-sm active:bg-stone-50">
              お問合せ
            </button>
            {user ? (
              <div className="flex gap-2 pt-2">
                <Link href="/mypage" className="flex-1 flex flex-col items-center justify-center py-3 bg-white border border-stone-200 text-stone-600 rounded-xl shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span className="text-[8px] font-bold uppercase mt-0.5">Mypage</span>
                </Link>
                <button onClick={handleLogout} className="flex-1 flex flex-col items-center justify-center py-3 bg-stone-200 text-stone-600 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span className="text-[8px] font-bold uppercase mt-0.5">Logout</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="block w-full py-4 bg-stone-800 text-white text-center rounded-xl font-bold text-sm shadow-md mt-2">
                ログイン / 会員登録
              </Link>
            )}
          </div>

          <div className="mt-auto pt-8 flex justify-center gap-4 opacity-30 grayscale scale-90">
            <img src="/img/rys200.png" alt="" className="h-6" />
            <img src="/img/yoga_alliance.png" alt="" className="h-6" />
          </div>
          <p className="text-center text-[9px] text-stone-400 mt-4 tracking-[0.2em] font-medium uppercase">© 2026 ANANDA YOGA</p>
        </div>
      </div>

      {/* お問合せモーダル */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-[10002] bg-black/60 backdrop-blur-sm flex items-end justify-center pointer-events-auto" onClick={() => setContactModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-8 pb-12 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setContactModalOpen(false)} className="absolute top-6 right-6 text-stone-400 text-xl">✕</button>
            <h3 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2">✉️ お問い合わせ</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input required placeholder="お名前" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EEA51A] outline-none" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
              <input type="email" required placeholder="メールアドレス" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EEA51A] outline-none" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
              <textarea required rows={4} placeholder="お問い合わせ内容" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EEA51A] outline-none" value={contactForm.body} onChange={e => setContactForm({...contactForm, body: e.target.value})} />
              <button type="submit" disabled={sendingContact} className="w-full py-4 bg-[#EEA51A] text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform">{sendingContact ? '送信中...' : '送信する'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}