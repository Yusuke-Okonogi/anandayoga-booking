'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // モード管理: 'login' | 'signup' | 'reset'
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // メールログイン・登録・リセット処理
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'login') {
        // --- ログイン ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();

      } else if (mode === 'signup') {
        // --- 新規登録 ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setMessage('登録完了！ログインしました。');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1000);

      } else if (mode === 'reset') {
        // --- パスワードリセット（ビジター移行） ---
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`, // ※後で設定が必要な場合があります
        });
        if (error) throw error;
        setMessage('パスワード設定メールを送信しました。\nメール内のリンクから設定を行ってください。');
      }
    } catch (error: any) {
      // ビジターが新規登録しようとした場合のエラーハンドリング
      if (mode === 'signup' && error.message.includes('already registered')) {
        setMessage('このメールアドレスは既にビジターとして登録されています。「パスワード設定」からアカウントを有効化してください。');
        setMode('reset'); // リセットモードに誘導
      } else {
        setMessage(`エラー: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // LINEログイン処理
  const handleLineLogin = () => {
    setLoading(true);
    window.location.href = `/api/auth/line`;
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-4 font-sans text-stone-700">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-xl border border-stone-100">
        <div className="text-center mb-8">
           <Link href="/" className="text-stone-400 text-xs hover:text-stone-600 mb-4 inline-block">← トップへ戻る</Link>
           <h1 className="text-3xl font-bold text-stone-700 mb-2 tracking-tight">
             {mode === 'login' ? 'おかえりなさい' : mode === 'signup' ? 'アカウント作成' : 'パスワード設定'}
           </h1>
           <p className="text-stone-500 text-sm">
             {mode === 'login' ? 'Anandayoga Studioの予約へ' 
              : mode === 'signup' ? '新しいヨガの旅を始めましょう' 
              : 'ビジター利用の方・お忘れの方'}
           </p>
        </div>

        {/* LINEログインボタン (リセットモード以外で表示) */}
        {mode !== 'reset' && (
          <div className="mb-8">
            <button
              onClick={handleLineLogin}
              disabled={loading}
              className="w-full bg-[#06C755] text-white font-bold py-4 rounded-xl hover:bg-[#05b34c] transition shadow-md flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2.04c-5.5 0-10 3.96-10 8.88 0 4.41 3.9 8.1 9.17 8.76.36.08.85.24.97.55.11.28.07.72.03 1.01l-.22 1.34c-.07.41-.33 1.59 1.4 .86 1.73-.73 4.69-2.76 6.39-4.73 2.27-2.61 3.26-5.26 3.26-7.79 0-4.92-4.5-8.88-10.01-8.88zm0 0" />
              </svg>
              LINEで{mode === 'login' ? 'ログイン' : '登録'}
            </button>
            <div className="relative mt-6 text-center">
              <hr className="border-stone-200" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-stone-400">
                またはメールアドレスで
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {/* 新規登録時のみ名前入力 */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1 ml-1">お名前</label>
              <input
                type="text"
                required
                placeholder="山田 花子"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#EEA51A] focus:bg-white transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1 ml-1">メールアドレス</label>
            <input
              type="email"
              required
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#EEA51A] focus:bg-white transition"
            />
          </div>

          {/* リセットモード以外でパスワード入力 */}
          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1 ml-1">パスワード</label>
              <input
                type="password"
                required
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#EEA51A] focus:bg-white transition"
              />
            </div>
          )}

          {message && (
            <div className={`text-sm text-center p-3 rounded-xl font-bold whitespace-pre-wrap ${message.includes('エラー') ? 'bg-red-50 text-red-600' : 'bg-[#FFF8E1] text-[#EEA51A]'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-[#EEA51A] transition disabled:opacity-50 shadow-lg mt-4"
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : mode === 'signup' ? '登録してはじめる' : '設定メールを送信'}
          </button>
        </form>

        {/* モード切り替えリンク */}
        <div className="mt-8 text-center pt-6 border-t border-stone-100 flex flex-col gap-3">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); setMessage(''); }} className="text-sm font-bold text-[#EEA51A] hover:underline">
                新規会員登録はこちら
              </button>
              <button onClick={() => { setMode('reset'); setMessage(''); }} className="text-xs text-stone-400 hover:text-stone-600 hover:underline">
                パスワードを忘れた方 / ビジター利用の方
              </button>
            </>
          )}
          
          {mode === 'signup' && (
            <button onClick={() => { setMode('login'); setMessage(''); }} className="text-sm font-bold text-[#EEA51A] hover:underline">
              ログイン画面へ戻る
            </button>
          )}

          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setMessage(''); }} className="text-sm font-bold text-stone-500 hover:underline">
              ログイン画面へ戻る
            </button>
          )}
        </div>
      </div>
    </div>
  );
}