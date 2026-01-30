'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminStatusBanner() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        const isAdm = data?.role === 'admin';
        setIsAdmin(isAdm);
        // ★ CSS変数を書き換えて、layout全体の余白を自動調整
        document.documentElement.style.setProperty('--admin-bar-height', isAdm ? '40px' : '0px');
      }
    };
    checkAdmin();
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] flex justify-center p-1.5 pointer-events-none">
      <div className="bg-stone-900/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-full px-4 h-8 flex items-center gap-4 pointer-events-auto ring-1 ring-[#EEA51A]/20">
        
        {/* 左側：ステータス */}
        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EEA51A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EEA51A]"></span>
          </div>
          <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase whitespace-nowrap">
            管理者 <span className="text-[#EEA51A]">ログイン中</span>
          </span>
        </div>

        {/* 右側：リンク */}
        <Link 
          href="/admin" 
          className="bg-white/10 hover:bg-[#EEA51A] text-white hover:text-black px-3 py-1 rounded-full text-[9px] font-bold transition-all duration-300 border border-white/5"
        >
          DASHBOARD
        </Link>
      </div>
    </div>
  );
}