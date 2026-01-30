import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from './components/Sidebar'
import MobileHeader from './components/MobileHeader'
import AdminStatusBanner from './components/AdminStatusBanner' // ★追加

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ananda Yoga',
  description: '全米ヨガアライアンス認定校 アナンダヨガ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning className="bg-[#F7F5F0]">
      <body className={`${inter.className} bg-[#F7F5F0] min-h-screen w-full m-0 p-0`}>
        
        <AdminStatusBanner />
        
        {/* ★ AdminBar表示時、全体を下に押し下げるコンテナ */}
        <div className="flex flex-col min-h-screen">
          <Sidebar />

          <div className="md:hidden">
            <MobileHeader />
          </div>

          <div className="flex-1 transition-all duration-300">
            {children}
          </div>
        </div>

      </body>
    </html>
  )
}