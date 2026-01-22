import Link from 'next/link';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';

// ニュース記事の型定義
type NewsDetail = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail?: {
    url: string;
  };
  content?: string; // HTML形式の本文
};

// microCMSから記事詳細を取得する関数
async function getNewsDetail(id: string) {
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://ananda.microcms.io/api/v1/news/${id}`, {
      headers: {
        'X-MICROCMS-API-KEY': apiKey,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json() as NewsDetail;
  } catch (error) {
    console.error('Error fetching news detail:', error);
    return null;
  }
}

// Next.js 15以降の params の型定義
type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const news = await getNewsDetail(id);

  if (!news) {
    notFound();
  }

  return (
    // 全体コンテナ (背景画像用)
    <div className="min-h-screen w-full bg-[#333] relative">
      
      {/* 背景固定画像 */}
      <div 
        className="fixed inset-0 z-0 w-full h-full"
        style={{
          backgroundImage: "url('/img/bg_main.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.9)" 
        }}
      />

      {/* スマホ幅コンテンツエリア (白背景) */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto bg-white min-h-screen shadow-2xl flex flex-col font-sans text-[#333]">
        
        {/* コンテンツラッパー (ヘッダーの高さ分下げるための余白を追加) */}
        {/* ヘッダーが h-14 (56px) なので、少し余裕を持たせて pt-20 (80px) 程度にする */}
        <div className="pt-20 px-6 pb-24 flex-1">

          {/* 1. 日付 */}
          <p className="text-[#EEA51A] font-bold text-sm mb-2">
            {format(new Date(news.publishedAt), 'yyyy.MM.dd')}
          </p>

          {/* 2. タイトル */}
          <h1 className="text-2xl font-bold text-stone-800 leading-relaxed mb-6">
            {news.title}
          </h1>

          {/* 3. サムネイル画像 (存在する場合のみ) */}
          {news.thumbnail && (
            <div className="w-full mb-8 rounded-xl overflow-hidden shadow-sm border border-stone-100">
              <img 
                src={news.thumbnail.url} 
                alt={news.title} 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* 4. 本文 (HTML) */}
          <div className="border-t border-stone-100 pt-8">
            <div 
              className="prose prose-stone max-w-none text-sm leading-loose text-stone-600 space-y-4"
              dangerouslySetInnerHTML={{ __html: news.content || '' }}
            />
          </div>

          {/* トップへ戻るボタン */}
          <div className="mt-12 text-center">
            <Link 
              href="/" 
              className="inline-block border border-stone-300 text-stone-500 px-10 py-3 rounded-full hover:bg-stone-50 transition text-sm"
            >
              トップへ戻る
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}