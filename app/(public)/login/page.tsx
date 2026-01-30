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

  // ★追加: 同意チェック状態
  const [agreed, setAgreed] = useState(false);

  // メールログイン・登録・リセット処理
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ★追加: 新規登録時は同意必須
    if (mode === 'signup' && !agreed) {
      setMessage('利用規約とプライバシーポリシーへの同意が必要です。');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        window.location.href = '/booking'; 
        return; // 以降の処理を中断

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
        // --- パスワードリセット ---
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) throw error;
        setMessage('パスワード設定メールを送信しました。\nメール内のリンクから設定を行ってください。');
      }
    } catch (error: any) {
      // ★ ここでエラーメッセージを日本語に変換します
      let errorMessage = error.message;

      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (errorMessage.includes('already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています。';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'メールアドレスの確認が完了していません。';
      } else if (errorMessage.includes('User not found')) {
        errorMessage = 'ユーザーが見つかりませんでした。';
      } else {
        errorMessage = `エラー: ${error.message}`;
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // LINEログイン処理
  const handleLineLogin = () => {
    // LINEログインの場合も、本来は同意が必要ですが、今回は簡略化のためスキップ
    // (厳密にはLINEログインボタンの近くに「ログインすることで規約に同意したものとみなします」と書くのが一般的です)
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

        {/* LINEログインボタン */}
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

          {/* ★追加: 同意チェックボックス (新規登録時のみ表示) */}
          {mode === 'signup' && (
            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox" 
                id="agree" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#EEA51A] border-stone-300 rounded focus:ring-[#EEA51A]"
              />
              <label htmlFor="agree" className="text-xs text-stone-500 leading-tight">
                <a href="#" className="text-[#EEA51A] hover:underline">利用規約</a> と <a href="#" className="text-[#EEA51A] hover:underline">プライバシーポリシー</a> に同意します
              </label>
            </div>
          )}

          {message && (
            <div className={`text-sm text-center p-3 rounded-xl font-bold whitespace-pre-wrap ${message.includes('エラー') || message.includes('同意') ? 'bg-red-50 text-red-600' : 'bg-[#FFF8E1] text-[#EEA51A]'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !agreed)} // 未同意ならボタン無効化
            className={`w-full text-white font-bold py-4 rounded-xl transition shadow-lg mt-4 ${
               loading || (mode === 'signup' && !agreed) 
                 ? 'bg-stone-300 cursor-not-allowed' 
                 : 'bg-stone-800 hover:bg-[#EEA51A]'
            }`}
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : mode === 'signup' ? '登録してはじめる' : '設定メールを送信'}
          </button>
        </form>

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