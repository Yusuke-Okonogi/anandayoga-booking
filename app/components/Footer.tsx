'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();
  // ★追加: 現在の年を取得
  const currentYear = new Date().getFullYear();

  // フッターを表示しないページ
  const isHidden = 
    pathname === '/login' || 
    pathname?.startsWith('/booking') || 
    pathname?.startsWith('/admin');

  if (isHidden) return null;

  return (
    <div className="w-full max-w-[480px] mx-auto bg-white relative z-10 shadow-sm">
      <footer className="bg-[#EEA51A] text-white py-12 text-center pb-28">
         <div className="flex justify-center items-center gap-2 mb-4">
            <img src="/logo.png" className="h-8 brightness-0 invert" alt="Logo"/>
         </div>
         <div className="flex justify-center gap-4 mb-8">
            <a 
              href="https://www.facebook.com/anandayogaschool" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition cursor-pointer p-2"
            >
               <img 
                 src="/img/icon_facebook.png" 
                 alt="Facebook" 
                 className="w-full h-full object-contain" 
               />
            </a>

            <a 
              href="https://www.instagram.com/anandayoga_maebashi/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition cursor-pointer p-2"
            >
               <img 
                 src="/img/icon_instagram.png" 
                 alt="Instagram" 
                 className="w-full h-full object-contain" 
               />
            </a>
         </div>
         <Link href="/privacy" className="text-xs opacity-80 mb-2 block hover:underline">プライバシーポリシー</Link>
         
         {/* ★修正: 変数を使用 */}
         <p className="text-xs opacity-60">© {currentYear} ANANDA YOGA</p>
      </footer>
    </div>
  );
}