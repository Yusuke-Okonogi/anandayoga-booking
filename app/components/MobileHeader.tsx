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

  // ユーザーチェック
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') setIsAdmin(true);
      }
    };
    checkUser();

    // ログイン状態の監視
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

  // ログインページでは表示しない
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsMenuOpen(false);
    window.location.reload();
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // (お問い合わせ送信処理はHeader.tsxと同様のロジックをここに実装、または省略)
    // 今回は簡易的にアラートのみ実装しますが、必要に応じてAPI連携コードを追加してください
    alert("お問い合わせ機能は現在調整中です。メールリンクをご利用ください。");
    setContactModalOpen(false);
  };

  return (
    <>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* 波紋アニメーション */
        @keyframes pulse-ripple {
          0% { box-shadow: 0 0 0 0 rgba(238, 165, 26, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(238, 165, 26, 0); }
          100% { box-shadow: 0 0 0 0 rgba(238, 165, 26, 0); }
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

      {/* スマホ用トップヘッダー (md以上で非表示) */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/img/logo.png" alt="Ananda Yoga" className="h-6 w-auto object-contain" />
        </Link>
        
        {/* 右上：ログイン/マイページボタン */}
        <div>
            {user ? (
                <Link href="/mypage" className="bg-[#EEA51A] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    マイページ
                </Link>
            ) : (
                <Link href="/login" className="bg-[#EEA51A] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                    ログイン
                </Link>
            )}
        </div>
      </header>

      {/* 下部追従型メニューボタン (FAB) */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`md:hidden menu-fab fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-[#EEA51A] bg-white/95 backdrop-blur-sm hover:bg-white
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
             <img src="/img/icon.png" alt="" className="w-8 h-8 object-contain" />
             <span className="text-[9px] font-bold text-[#EEA51A] tracking-widest">MENU</span>
          </>
        )}
      </button>

      {/* 全画面メニューオーバーレイ */}
      <div 
        className={`md:hidden fixed inset-0 z-[1900] transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{
            background: '#F9F8F6',
            paddingTop: '60px'
        }}
      >
        <div className="scrollbar-hide relative w-full h-full flex flex-col p-6 overflow-y-auto pb-28">
            
            {/* メニュー内ログインエリア */}
            <div className="mb-8">
              {user ? (
                 <button onClick={handleLogout} className="w-full bg-white text-stone-600 font-bold py-3 rounded-lg shadow-sm border border-stone-200 text-center text-sm">
                    ログアウト
                 </button>
              ) : (
                 <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block w-full bg-[#EEA51A] text-white font-bold py-3 rounded-lg shadow-md text-center text-sm">
                   ログイン / 会員登録
                 </Link>
              )}
            </div>

            {/* メニュー一覧 */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-stone-400 mb-2 tracking-widest pl-1">MENU</h3>
                
                <MenuLink href="/" icon="📅" label="予約カレンダー" onClick={() => setIsMenuOpen(false)} />
                <MenuLink href="/booking" icon="📝" label="予約フォーム" onClick={() => setIsMenuOpen(false)} />
                <MenuLink href="/program" icon="🎓" label="養成講座" onClick={() => setIsMenuOpen(false)} />
                
                <a href="mailto:info@ananda-yogaschool.com" className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 hover:bg-stone-50 transition">
                    <span className="text-xl">✉️</span>
                    <span className="font-bold text-stone-700 text-sm">お問い合わせ</span>
                </a>
            </div>

             {/* 管理者メニュー */}
             {isAdmin && (
               <div className="mt-8 pt-4 border-t border-stone-200">
                 <h3 className="text-[10px] font-bold text-stone-400 mb-2 tracking-widest pl-1">ADMIN</h3>
                 <MenuLink href="/admin" icon="🔧" label="管理画面へ" onClick={() => setIsMenuOpen(false)} isAdmin />
               </div>
             )}
            
            <div className="mt-auto text-center text-[10px] text-stone-400 py-6">
               © 2026 ANANDA YOGA
            </div>
        </div>
      </div>
    </>
  );
}

// 簡易メニューリンクコンポーネント
function MenuLink({ href, icon, label, onClick, isAdmin }: { href: string, icon: string, label: string, onClick: () => void, isAdmin?: boolean }) {
    return (
        <Link 
            href={href} 
            onClick={onClick}
            className={`flex items-center gap-3 p-4 rounded-xl shadow-sm border transition
                ${isAdmin 
                    ? 'bg-stone-800 text-white border-stone-800' 
                    : 'bg-white text-stone-700 border-stone-100 hover:bg-stone-50'
                }
            `}
        >
            <span className="text-xl">{icon}</span>
            <span className="font-bold text-sm">{label}</span>
        </Link>
    );
}