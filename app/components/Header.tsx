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
  const [loading, setLoading] = useState(true);
  
  // ハンバーガーメニューの開閉状態
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // お問い合わせモーダル用
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', body: '' });
  const [sendingContact, setSendingContact] = useState(false);

  // ログインページではヘッダーを表示しない
  const isLoginPage = pathname === '/login';

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
      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // メニューを閉じる関数
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  // お問い合わせ送信処理
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject || !contactForm.body) return;
    
    // 未ログイン時は名前とメールアドレスも必須チェック
    if (!user && (!contactForm.name || !contactForm.email)) {
      alert('お名前とメールアドレスを入力してください');
      return;
    }

    setSendingContact(true);

    try {
      // 送信前にユーザー詳細情報を取得
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

      console.log('Sending contact email:', { userEmail, userName, subject: contactForm.subject });

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
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : (data.error || '送信サーバーエラー');
        throw new Error(errorMessage);
      }

      alert('お問い合わせを送信しました。\n確認メールをご確認ください。');
      setContactModalOpen(false);
      setContactForm({ name: '', email: '', subject: '', body: '' });
      setIsMenuOpen(false);

    } catch (err: any) {
      console.error('Contact send error:', err);
      alert(`送信に失敗しました: ${err.message}`);
    }
    setSendingContact(false);
  };

  if (isLoginPage) return null;

  return (
    <>
      {/* ヘッダー全体をラップして固定(sticky)にするコンテナ */}
      <div className="sticky top-0 z-40 w-full shadow-sm transition-all">
        
        {/* 管理者モード表示バー */}
        {isAdmin && (
          <div className="bg-stone-800 text-white text-xs py-1 px-4 text-center font-bold tracking-wider relative z-50">
            🔧 管理者モードでログイン中
          </div>
        )}

        {/* メインヘッダー */}
        <header className="bg-[#F7F5F0]/95 backdrop-blur-md h-16 w-full relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 h-full flex justify-between items-center relative">
            
            {/* ロゴエリア */}
            <Link href="/" onClick={closeMenu} className="flex items-center gap-3 hover:opacity-80 transition z-50">
              <div className="h-8 sm:h-10 w-auto">
                <img src="/logo.png" alt="Anandayoga" className="h-full w-auto object-contain" />
              </div>
              {pathname.startsWith('/admin') && (
                <span className="text-xs font-bold text-stone-500 border-l border-stone-300 pl-3 ml-1 hidden sm:block">
                  管理者画面
                </span>
              )}
            </Link>

            {/* ナビゲーション */}
            <div className="flex items-center gap-1 sm:gap-4 z-50">
              {!loading && (
                <>
                  {user ? (
                    <>
                      {/* マイページリンク (SP: アイコンのみ) */}
                      <Link 
                        href="/mypage" 
                        className={`md:hidden p-2 rounded-lg transition ${
                          pathname === '/mypage' ? 'text-[#EEA51A]' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        aria-label="マイページ"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </Link>

                      {/* マイページリンク (PCのみ表示) */}
                      <Link 
                        href="/mypage" 
                        className={`hidden md:flex text-xs sm:text-sm font-bold items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                          pathname === '/mypage'
                            ? 'bg-[#EEA51A] text-white shadow-md'
                            : 'text-stone-600 hover:text-[#EEA51A] bg-white border border-stone-200 hover:shadow-sm'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span>マイページ</span>
                        {pathname !== '/mypage' && <span className="w-1.5 h-1.5 rounded-full bg-[#EEA51A]"></span>}
                      </Link>
                    </>
                  ) : (
                    <Link 
                      href="/login" 
                      className="hidden md:block bg-[#EEA51A] text-white text-xs px-5 py-2.5 rounded-full font-bold hover:bg-[#D99000] transition shadow-md"
                    >
                      ログイン / 登録
                    </Link>
                  )}

                  {/* ハンバーガーメニューボタン */}
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 rounded-lg text-stone-600 hover:bg-stone-200 transition focus:outline-none flex-shrink-0 w-10 h-10 flex items-center justify-center"
                    aria-label="メニューを開く"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* 全画面モーダルメニュー */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#F7F5F0] animate-in fade-in duration-200 flex flex-col">
          
          {/* モーダル内にも管理者バーを表示して高さズレを防ぐ */}
          {isAdmin && (
            <div className="bg-stone-800 text-white text-xs py-1 px-4 text-center font-bold tracking-wider flex-shrink-0">
              🔧 管理者モードでログイン中
            </div>
          )}

          {/* モーダルヘッダー */}
          <div className="w-full border-b border-stone-200 bg-[#F7F5F0] flex-shrink-0">
             <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex justify-between items-center">
                <div className="h-8 sm:h-10 w-auto opacity-50 grayscale">
                  <img src="/logo.png" alt="Anandayoga" className="h-full w-auto object-contain" />
                </div>
                
                {/* 閉じるボタン */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <button 
                    onClick={closeMenu}
                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-200 transition focus:outline-none flex-shrink-0 w-10 h-10 flex items-center justify-center"
                    aria-label="閉じる"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="max-w-md mx-auto grid gap-6">
              
              {/* 上部アクションボタンエリア */}
              <div className="flex flex-col gap-2">
                 {user ? (
                   <div className="flex gap-2 w-full">
                     <Link 
                       href="/mypage" 
                       onClick={closeMenu} 
                       className="flex-1 bg-[#EEA51A] text-white font-bold py-2.5 rounded-xl text-center shadow-md hover:bg-[#D99000] transition flex items-center justify-center gap-2 text-sm"
                     >
                       {/* アイコン追加 */}
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                       <span>マイページ</span>
                     </Link>
                     <button 
                       onClick={handleLogout} 
                       className="flex-1 bg-white text-stone-500 font-bold py-2.5 rounded-xl border-2 border-stone-200 hover:bg-stone-50 transition text-center text-sm"
                     >
                       ログアウト
                     </button>
                   </div>
                 ) : (
                   <Link 
                     href="/login" 
                     onClick={closeMenu} 
                     className="w-full bg-[#EEA51A] text-white font-bold py-2.5 rounded-xl text-center shadow-md hover:bg-[#D99000] transition flex items-center justify-center gap-2 text-sm"
                   >
                     <span className="text-lg">🔐</span> ログイン / 新規登録
                   </Link>
                 )}
              </div>

              {/* ユーザーメニュー */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-stone-400 tracking-wider mb-1 px-2">MENU</h3>
                <ul className="space-y-1">
                  <li>
                    <Link href="/" onClick={closeMenu} className="text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition">
                      <span className="text-lg w-6 text-center">📅</span> 予約カレンダー
                    </Link>
                  </li>
                  {/* メニュー内マイページリンク（アイコン化） */}
                  {user && (
                    <li>
                      <Link href="/mypage" onClick={closeMenu} className="text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition">
                        <span className="w-6 flex justify-center text-stone-700">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </span>
                        マイページ
                      </Link>
                    </li>
                  )}
                  <li>
                    <button 
                      onClick={() => setContactModalOpen(true)} 
                      className="w-full text-left text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition"
                    >
                      <span className="text-lg w-6 text-center">✉️</span> お問い合わせ
                    </button>
                  </li>
                  <li>
                    <a href="https://ananda-yogaschool.com/" target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition">
                      <span className="text-lg w-6 text-center">🌐</span> 公式サイト
                      <svg className="w-3 h-3 text-stone-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  </li>
                </ul>
              </div>

              {/* 管理者メニュー */}
              {isAdmin && (
                <div className="space-y-2 pt-4 border-t border-stone-200">
                  <h3 className="text-[10px] font-bold text-stone-400 tracking-wider mb-1 px-2">ADMIN MENU</h3>
                  <ul className="space-y-1">
                    <li>
                      <Link href="/admin/checkin" onClick={closeMenu} className="text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition">
                        <span className="text-lg w-6 text-center">📋</span> 予約・チェックイン
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin?tab=lessons" onClick={closeMenu} className="text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition">
                        <span className="text-lg w-6 text-center">✏️</span> 予約管理 (クラス登録)
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin?tab=users" onClick={closeMenu} className="text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition">
                        <span className="text-lg w-6 text-center">👥</span> ユーザー管理
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin?tab=plans" onClick={closeMenu} className="text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition">
                        <span className="text-lg w-6 text-center">💳</span> プラン管理
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin?tab=announcements" onClick={closeMenu} className="text-sm font-bold text-stone-700 hover:text-[#EEA51A] hover:bg-white flex items-center gap-3 p-2 rounded-lg transition">
                        <span className="text-lg w-6 text-center">🔔</span> お知らせ管理
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* お問い合わせフォームモーダル */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm" onClick={() => setContactModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2">
              <span className="text-2xl">✉️</span> {contactForm.subject.includes('予約希望') ? '予約リクエスト' : 'お問い合わせ'}
            </h3>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              {/* 未ログイン時のみ名前・メアド入力欄を表示 */}
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