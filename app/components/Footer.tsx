'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();

  // フッターを表示しないページ（ログイン、予約システム、管理画面）
  const isHidden = 
    pathname === '/login' || 
    pathname?.startsWith('/booking') || 
    pathname?.startsWith('/admin');

  if (isHidden) return null;

  return (
    // z-10 を追加して、トップページの固定背景より手前に表示させる
    <div className="w-full max-w-[480px] mx-auto bg-white relative z-10 shadow-sm">
      <footer className="bg-[#EEA51A] text-white py-12 text-center pb-28 md:pb-12">
         <div className="mb-6">
           <p className="text-sm font-bold mb-2">ご不明な点はお気軽にお問い合わせください</p>
           <a href="mailto:info@ananda-yogaschool.com" className="text-lg font-bold hover:underline">info@ananda-yogaschool.com</a>
         </div>
         <div className="flex justify-center gap-4 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold hover:bg-white/30 transition cursor-pointer">FB</div>
            <a href="https://www.instagram.com/ananda_yoga/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold hover:bg-white/30 transition cursor-pointer">IG</a>
         </div>
         <div className="flex justify-center items-center gap-2 mb-4">
            <img src="/logo.png" className="h-8 brightness-0 invert" alt="Logo"/>
         </div>
         <Link href="/privacy" className="text-xs opacity-80 mb-2 block hover:underline">プライバシーポリシー</Link>
         <p className="text-xs opacity-60">© 2026 ANANDA YOGA</p>
      </footer>
    </div>
  );
}