import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from './components/Header' // ★修正: 相対パス(./)に変更

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ananda Yoga',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  )
}