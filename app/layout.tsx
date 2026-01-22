import './globals.css'; // 必要に応じてcssをインポート
import MainLayout from './components/MainLayout';

export const metadata = {
  title: 'Ananda Yoga',
  description: '前橋のヨガスタジオ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <MainLayout>
            {children}
        </MainLayout>
      </body>
    </html>
  );
}