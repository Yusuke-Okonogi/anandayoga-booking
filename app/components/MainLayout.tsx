'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 1. ログイン画面のみ、レイアウト（ヘッダー・フッター）を適用せずそのまま表示
  // ※Headerコンポーネント内でも非表示制御はしていますが、レイアウト崩れを防ぐためここでも除外します
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // 2. 予約システム(/booking) または 管理画面(/admin)
  // -> ヘッダーは表示、コンテンツは画面全幅 (背景画像なし、白系背景)
  if (pathname?.startsWith('/booking') || pathname?.startsWith('/admin')) {
    return (
      <div className="min-h-screen w-full bg-[#F7F5F0] font-sans text-[#333]">
         {/* ヘッダーを表示 */}
         <Header />
         
         {/* コンテンツエリア (全幅) */}
         <main className="w-full">
           {children}
         </main>
      </div>
    );
  }

  // 3. 一般ページ (トップページ、Programページなど)
  // -> スマホ幅固定 (max-w-[480px])、固定背景画像あり
  return (
    <div className="min-h-screen w-full bg-[#333] relative">
      
      {/* 全画面固定背景画像 */}
      <div 
        className="fixed inset-0 z-0 w-full h-full"
        style={{
          backgroundImage: "url('/img/bg_main.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.9)" 
        }}
      />

      {/* スマホ幅コンテンツエリア */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto bg-white min-h-screen shadow-2xl flex flex-col font-sans text-[#333]">
        
        <Header />

        <main className="flex-1">
          {children}
        </main>

        <Footer />
        
      </div>
    </div>
  );
}