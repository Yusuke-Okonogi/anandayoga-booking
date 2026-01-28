'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // ユーザー情報を取得・設定する関数
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
        } else {
          setIsAdmin(false);
        }
      } else {
        // ユーザーがいない（ログアウト）場合は管理者フラグもオフ
        setIsAdmin(false);
      }
    };

    // 初回実行
    checkUser();

    // ログイン状態の変化を監視するリスナー
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      checkUser();
    });

    // クリーンアップ関数
    return () => {
      authListener.subscription.unsubscribe();
    };
    // ★修正: pathname を追加して、ページ遷移時にも必ず再チェックするようにします
  }, [pathname]);

  return (
    // 親コンテナ: 画面左側に配置するためのラッパー
    <div className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[300px] p-6 z-50 pointer-events-none">
      
      {/* カード本体: 浮遊感のある白いボックス (pointer-events-autoで操作可能に) */}
      <aside className="w-full h-full bg-white rounded-3xl shadow-xl flex flex-col pointer-events-auto overflow-hidden border border-stone-100 relative">
        
        {/* ロゴエリア */}
        <div className="p-8 pb-4 flex flex-col items-center border-b border-stone-50">
          <Link href="/" className="block hover:opacity-80 transition mb-3">
            <img src="/img/logo.png" alt="Ananda Yoga" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex gap-2 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition items-center scale-90">
             <img src="/img/rys200.png" alt="RYS200" className="h-6 w-auto object-contain" />
             <div className="h-3 w-px bg-stone-300"></div>
             <img src="/img/yoga_alliance.png" alt="Yoga Alliance" className="h-6 w-auto object-contain" />
          </div>
        </div>

        {/* メニュー (スクロール可能エリア) */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-thin">
          <NavItem href="/" icon="📅" label="予約カレンダー" active={pathname === '/'} />
          <NavItem href="/booking" icon="📝" label="予約フォーム" active={pathname === '/booking'} />
          <NavItem href="/program" icon="🎓" label="養成講座" active={pathname === '/program'} />
          
          <div className="my-4 border-t border-stone-100 mx-2"></div>

          <NavItem href="mailto:info@ananda-yogaschool.com" icon="✉️" label="お問い合わせ" isExternal />

          {/* ログインしている場合のみ表示 */}
          {user && (
            <>
              <div className="my-4 border-t border-stone-100 mx-2"></div>
              <NavItem href="/mypage" icon="👤" label="マイページ" active={pathname === '/mypage'} />
            </>
          )}

          {/* 管理者の場合のみ表示 */}
          {isAdmin && (
            <>
              <div className="my-4 border-t border-stone-100 mx-2"></div>
              <p className="px-4 text-[10px] font-bold text-stone-400 tracking-widest uppercase mb-1">Admin</p>
              <NavItem href="/admin" icon="🔧" label="管理画面" active={pathname?.startsWith('/admin')} />
            </>
          )}
        </nav>

        {/* フッターエリア (黒背景) */}
        <div className="p-6 bg-stone-800 text-white mt-auto rounded-b-3xl">
          {user ? (
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-stone-600 hover:bg-stone-700 transition text-sm font-bold"
            >
              <span>🚪</span> ログアウト
            </button>
          ) : (
            <Link 
              href="/login" 
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-stone-800 rounded-xl font-bold text-sm shadow-md hover:bg-stone-100 transition"
            >
               <span>🔐</span> ログイン
            </Link>
          )}
          <p className="text-[10px] text-center text-stone-500 mt-4 tracking-wider">
            © 2026 ANANDA YOGA
          </p>
        </div>

      </aside>
    </div>
  );
}

// メニュー項目コンポーネント
function NavItem({ href, icon, label, active, isExternal }: { href: string; icon: string; label: string; active?: boolean; isExternal?: boolean }) {
  const Component = isExternal ? 'a' : Link;
  const externalProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Component 
      href={href} 
      {...externalProps}
      className={`
        group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm relative overflow-hidden
        ${active 
          ? 'bg-[#FFF8E1] text-stone-800 shadow-sm' 
          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700' 
        }
      `}
    >
      {/* アクセントバー (active時のみ) */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#EEA51A] rounded-r-full"></span>
      )}
      
      <span className={`text-xl w-6 text-center flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-[#EEA51A]' : 'opacity-70'}`}>
        {icon}
      </span>
      <span className="tracking-wide flex-1">{label}</span>
      
      {/* 矢印アイコン (active時またはhover時に表示) */}
      <span className={`text-stone-300 transform transition-transform duration-300 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
        ›
      </span>
    </Component>
  );
}