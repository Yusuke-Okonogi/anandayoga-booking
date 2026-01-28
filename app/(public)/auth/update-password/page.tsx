'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ページを開いた時点で、SupabaseがURLの認証コードを読み取って
  // 自動的に「ログイン状態」にしてくれます。

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // パスワードを更新する
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      alert('パスワードを更新しました！\nトップページへ移動します。');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-4 font-sans text-stone-700">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-xl border border-stone-100">
        <div className="text-center mb-8">
           <h1 className="text-2xl font-bold text-stone-700 mb-2">
             パスワードの再設定
           </h1>
           <p className="text-stone-500 text-sm">
             新しいパスワードを入力してください
           </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1 ml-1">新しいパスワード</label>
            <input
              type="password"
              required
              placeholder="6文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#EEA51A] focus:bg-white transition"
            />
          </div>

          {message && (
            <div className="text-sm text-center p-3 rounded-xl font-bold bg-red-50 text-red-600">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-[#EEA51A] transition disabled:opacity-50 shadow-lg mt-4"
          >
            {loading ? '更新中...' : 'パスワードを変更する'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <Link href="/login" className="text-xs text-stone-400 underline hover:text-stone-600">
                ログイン画面に戻る
            </Link>
        </div>
      </div>
    </div>
  );
}