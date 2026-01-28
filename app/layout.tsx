import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from './components/Sidebar'
import MobileHeader from './components/MobileHeader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ananda Yoga',
  description: '全米ヨガアライアンス認定校 アナンダヨガ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ブラウザ拡張機能による属性変更のエラーを抑制するために suppressHydrationWarning を追加しています
  return (
    <html lang="ja" suppressHydrationWarning className="bg-[#F0EBE0]">
      <body className={`${inter.className} bg-[#F0EBE0] min-h-screen w-full m-0 p-0`}>
        
        {/* PC用サイドバー (md以上で表示) */}
        <Sidebar />

        {/* スマホ用ヘッダー (md未満で表示) */}
        <MobileHeader />

        {/* メインコンテンツエリア */}
        {/* PC表示時(md以上)は左側にサイドバー分のマージン(256px = 16rem = w-64)を空ける */}
        <div className="min-h-screen transition-all duration-300">
          {children}
        </div>

      </body>
    </html>
  )
}