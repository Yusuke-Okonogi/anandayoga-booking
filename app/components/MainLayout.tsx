'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // ログインページかどうかを判定
  const isLoginPage = pathname === '/login';

  return (
    <>
      {/* ログインページ以外でサイドバー(PC)とヘッダー(スマホ)を表示 */}
      {!isLoginPage && (
        <>
          <Sidebar />
          <MobileHeader />
        </>
      )}

      {/* メインコンテンツエリア */}
      <main 
        className={`min-h-screen transition-all duration-300 w-full ${
          // ログインページの場合: 余白なし
          // それ以外の場合: PCでは左側にサイドバー分の余白(320px)を確保
          isLoginPage ? '' : 'md:pl-[320px] pt-4 pr-4 pb-4' 
        }`}
      >
        {children}
      </main>
    </>
  );
}