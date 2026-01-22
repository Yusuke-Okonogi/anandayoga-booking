'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // ハンバーガーメニューの開閉状態
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // お問い合わせモーダル用
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', body: '' });
  const [sendingContact, setSendingContact] = useState(false);

  // ログインページではヘッダーを表示しない
  const isLoginPage = pathname === '/login';

  // システムページ判定
  const isSystemPage = pathname?.startsWith('/booking') || pathname?.startsWith('/admin');

  // コンテナのクラス切り替え
  const containerClass = !isSystemPage
    ? 'w-full max-w-[480px] mx-auto bg-white/95 backdrop-blur-md shadow-sm' 
    : 'w-full bg-[#F7F5F0]/95 backdrop-blur-md shadow-sm';

  // ユーザーチェック処理
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  // メニュー開閉時のスクロール制御
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    closeMenu();
    router.push('/login');
    router.refresh();
  };

  // お問い合わせ送信処理
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject || !contactForm.body) return;
    
    if (!user && (!contactForm.name || !contactForm.email)) {
      alert('お名前とメールアドレスを入力してください');
      return;
    }

    setSendingContact(true);

    try {
      let userName = contactForm.name || 'ゲスト';
      let userEmail = contactForm.email || user?.email;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          userName = profile.full_name || 'ゲスト';
          userEmail = profile.email || user.email;
        }
      }

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          userEmail: userEmail,
          userName: userName,
          contactSubject: contactForm.subject,
          contactBody: contactForm.body
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '送信サーバーエラー');
      }

      alert('お問い合わせを送信しました。\n確認メールをご確認ください。');
      setContactModalOpen(false);
      setContactForm({ name: '', email: '', subject: '', body: '' });
      closeMenu();

    } catch (err: any) {
      console.error('Contact send error:', err);
      alert(`送信に失敗しました: ${err.message}`);
    }
    setSendingContact(false);
  };

  if (isLoginPage) return null;

  return (
    <>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* 波紋アニメーション */
        @keyframes pulse-ripple {
          0% {
            box-shadow: 0 0 0 0 rgba(238, 165, 26, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(238, 165, 26, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(238, 165, 26, 0);
          }
        }

        /* 追従メニューボタンのアニメーション */
        .menu-fab {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .menu-fab:not(.open) {
          animation: pulse-ripple 2s infinite;
        }
        .menu-fab:active {
          transform: translateX(-50%) scale(0.95);
        }
        .menu-fab.open {
           background-color: #333;
           border-color: #333;
           box-shadow: 0 4px 15px rgba(0,0,0,0.3);
           border-width: 0px; 
        }
      `}</style>

      {/* ヘッダー本体 */}
      <div className={`sticky top-0 z-[2000] ${containerClass}`}>
        {isAdmin && (
          <div className="bg-stone-800 text-white text-[10px] py-1 px-4 text-center font-bold tracking-wider relative z-50">
            🔧 管理者モード
          </div>
        )}

        <header className="h-14 w-full relative flex items-center border-b border-stone-100">
          <div className={`w-full h-full px-4 flex justify-between items-center ${isSystemPage ? 'max-w-6xl mx-auto px-4' : ''}`}>
            
            {/* ロゴエリア */}
            <div className="flex items-center gap-2 h-full overflow-hidden">
              <Link href="/" onClick={closeMenu} className="flex items-center h-full hover:opacity-80 transition shrink-0">
                <img src="/img/logo.png" alt="Ananda Yoga" className="h-6 w-auto object-contain" />
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                 <img src="/img/rys200.png" alt="RYS200" className="h-7 w-auto object-contain" />
                 <img src="/img/yoga_alliance.png" alt="Yoga Alliance" className="h-7 w-auto object-contain" />
              </div>
            </div>

            {/* 右側エリア: ログイン/マイページボタン (テキストあり) */}
            <div className="flex items-center gap-2 shrink-0">
                {user ? (
                   <Link 
                     href="/mypage" 
                     className="bg-[#EEA51A] text-white text-xs font-bold px-3 py-2 rounded-full shadow-md hover:bg-[#d99616] transition flex items-center gap-1"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                     マイページ
                   </Link>
                ) : (
                   <Link 
                     href="/login" 
                     className="bg-[#EEA51A] text-white text-xs font-bold px-3 py-2 rounded-full shadow-md hover:bg-[#d99616] transition flex items-center gap-1"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                     ログイン
                   </Link>
                )}
            </div>

          </div>
        </header>
      </div> 

      {/* 追従型メニューボタン (FAB) */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`menu-fab fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-[#EEA51A] bg-white/95 backdrop-blur-sm hover:bg-white
          ${isMenuOpen ? 'open' : ''}
        `}
        aria-label="メニューを開く"
        style={{ zIndex: 9999 }}
      >
        {isMenuOpen ? (
          <>
             <span className="text-stone-400 text-xl leading-none mb-0.5">✕</span>
             <span className="text-[9px] font-bold text-stone-400 tracking-widest">CLOSE</span>
          </>
        ) : (
          <>
             <img src="/img/icon.png" alt="" className="w-9 h-9 object-contain" />
             <span className="text-[9px] font-bold text-[#EEA51A] tracking-widest">MENU</span>
          </>
        )}
      </button>

      {/* メニューオーバーレイ */}
      <div 
        className={`fixed inset-0 z-[1900] transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{
            background: '#F9F8F6',
            paddingTop: isAdmin ? '76px' : '56px'
        }}
      >
        <div className="scrollbar-hide relative w-full h-full flex flex-col p-6 overflow-y-auto max-w-[480px] mx-auto pb-24">
            
            {/* メニュー内ログインエリア */}
            <div className="mb-8 mt-2">
              {user ? (
                 <div className="flex gap-3">
                    <button 
                      onClick={handleLogout} 
                      className="w-full bg-white text-stone-600 font-bold py-3 rounded-lg shadow-sm border border-stone-200 text-center hover:bg-stone-50 transition text-sm flex items-center justify-center gap-2"
                    >
                      <span>🚪</span> ログアウト
                    </button>
                 </div>
              ) : (
                 <Link 
                    href="/login" 
                    onClick={closeMenu}
                    className="block w-full bg-[#EEA51A] text-white font-bold py-3 rounded-lg shadow-md text-center hover:bg-[#d99616] transition tracking-wider"
                 >
                   ログイン / 会員登録
                 </Link>
              )}
            </div>

            {/* 一般メニュー (コンテンツ変更: 予約、養成講座、お問い合わせ) */}
            <div className="mb-8">
               <h3 className="text-[10px] font-bold text-stone-400 mb-3 tracking-widest pl-1">MENU</h3>
               <div className="grid grid-cols-2 gap-2">
                  <MenuTile 
                    href="/booking" 
                    onClick={closeMenu}
                    icon={<span className="text-xl">📅</span>}
                    label="予約カレンダー" 
                  />
                  {/* ▼▼▼ 追加: 養成講座 ▼▼▼ */}
                  <MenuTile 
                    href="/program" 
                    onClick={closeMenu}
                    icon={<span className="text-xl">🎓</span>}
                    label="養成講座" 
                  />
                  {/* ▼▼▼ お問い合わせ (ボタン) ▼▼▼ */}
                  <button 
                    onClick={() => { setContactModalOpen(true); setIsMenuOpen(false); }}
                    className="flex flex-row items-center justify-start p-3 rounded-lg transition shadow-sm hover:shadow-md border bg-white border-stone-100 hover:border-[#EEA51A] hover:bg-[#FFFDF5] h-full gap-3"
                  >
                    <div className="text-[#EEA51A] flex-shrink-0"><span className="text-xl">✉️</span></div>
                    <span className="text-xs font-bold text-stone-700 leading-tight text-left">お問い合わせ</span>
                  </button>
               </div>
            </div>

            {/* 管理者メニュー */}
            {isAdmin && (
              <div className="mb-8">
                 <h3 className="text-[10px] font-bold text-stone-400 mb-3 tracking-widest pl-1 uppercase">Admin Menu</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <MenuTile href="/admin/checkin" onClick={closeMenu} icon={<span className="text-xl">📋</span>} label="予約・チェックイン" isAdmin />
                    <MenuTile href="/admin/classes" onClick={closeMenu} icon={<span className="text-xl">✏️</span>} label="予約管理（クラス）" isAdmin />
                    <MenuTile href="/admin/users" onClick={closeMenu} icon={<span className="text-xl">👥</span>} label="ユーザー管理" isAdmin />
                    <MenuTile href="/admin/plans" onClick={closeMenu} icon={<span className="text-xl">💳</span>} label="プラン管理" isAdmin />
                    <MenuTile href="/admin/news" onClick={closeMenu} icon={<span className="text-xl">🔔</span>} label="お知らせ管理" isAdmin />
                 </div>
              </div>
            )}
            
            <div className="mt-auto text-center text-[10px] text-stone-400 py-2">
               © 2026 ANANDA YOGA
            </div>
        </div>
      </div>

      {/* お問い合わせモーダル (変更なし) */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm" onClick={() => setContactModalOpen(false)}>
           <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2">
              <span className="text-2xl">✉️</span> {contactForm.subject.includes('予約希望') ? '予約リクエスト' : 'お問い合わせ'}
            </h3>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              {!user && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">お名前 (必須)</label>
                    <input
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm({...contactForm, name: e.target.value})}
                      placeholder="山田 花子"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">メールアドレス (必須)</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm({...contactForm, email: e.target.value})}
                      placeholder="example@email.com"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none text-stone-700"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">件名</label>
                <input
                  required
                  value={contactForm.subject}
                  onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                  placeholder="例: 予約の変更について"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none text-stone-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">お問い合わせ内容</label>
                <textarea
                  required
                  rows={5}
                  value={contactForm.body}
                  onChange={e => setContactForm({...contactForm, body: e.target.value})}
                  placeholder="詳細をご記入ください..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none text-stone-700"
                />
              </div>

              <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="flex-1 bg-stone-100 text-stone-500 font-bold py-3 rounded-xl hover:bg-stone-200"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={sendingContact}
                    className="flex-1 bg-[#EEA51A] text-white font-bold py-3 rounded-xl hover:bg-[#D99000] disabled:opacity-50 transition shadow-md"
                  >
                    {sendingContact ? '送信中...' : '送信する'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// MenuTileコンポーネント (変更なし)
function MenuTile({ href, icon, label, onClick, isExternal = false, isAdmin = false }: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  onClick?: () => void;
  isExternal?: boolean;
  isAdmin?: boolean;
}) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`
        flex flex-row items-center justify-start p-3 rounded-lg transition shadow-sm hover:shadow-md border h-full gap-3
        ${isAdmin 
          ? 'bg-white border-stone-200 hover:border-[#EEA51A] hover:bg-[#FFFDF5]' 
          : 'bg-white border-stone-100 hover:border-[#EEA51A] hover:bg-[#FFFDF5]'
        }
      `}
    >
      <div className={`flex-shrink-0 ${isAdmin ? 'text-stone-600' : 'text-[#EEA51A]'}`}>
        {icon}
      </div>
      <span className="text-xs font-bold text-stone-700 leading-tight text-left">
        {label}
      </span>
      {isExternal && (
        <span className="ml-auto text-stone-300">
           <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </span>
      )}
    </Link>
  );
}