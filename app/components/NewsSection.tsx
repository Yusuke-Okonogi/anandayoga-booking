'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import ModalPortal from './ModalPortal';

// ▼▼▼ Swiper関連 ▼▼▼
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
// ▲▲▲ Swiper関連 ▲▲▲

export type News = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail?: {
    url: string;
  };
  content?: string;
};

type Props = {
  newsList: News[];
};

export default function NewsSection({ newsList }: Props) {
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  // ナビゲーションボタンをstateで管理
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);

  const openModal = (news: News) => {
    setSelectedNews(news);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedNews(null);
    document.body.style.overflow = '';
  };

  return (
    <section className="py-16 px-0 bg-[#F9F8F6] overflow-hidden">
      <div className="text-center mb-8 px-4">
        <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-sans">News</h3>
        <h2 className="text-xl font-bold tracking-widest text-stone-700">お知らせ</h2>
      </div>
      
      {newsList.length === 0 ? (
        <div className="text-center text-xs text-stone-400 py-4 px-4">お知らせはありません</div>
      ) : (
        <div className="relative px-4 max-w-5xl mx-auto group">
          <Swiper
            modules={[Navigation, Pagination, FreeMode]}
            spaceBetween={10}
            slidesPerView={'auto'}
            freeMode={true}
            grabCursor={true}
            navigation={{
              prevEl,
              nextEl,
            }}
            pagination={{ 
              clickable: true,
              dynamicBullets: true,
            }}
            className="pb-12 !overflow-visible news-swiper"
          >
             {newsList.map((news) => (
               <SwiperSlide key={news.id} className="!w-[240px] flex-shrink-0">
                 <div 
                   onClick={() => openModal(news)}
                   className="w-full h-full bg-white p-3 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition cursor-pointer flex flex-col"
                 >
                    <div className="aspect-square bg-stone-50 mb-3 rounded-lg overflow-hidden relative flex items-center justify-center">
                      {news.thumbnail ? (
                        <img 
                          src={news.thumbnail.url} 
                          alt={news.title} 
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <div className="text-stone-300 text-xs">No Image</div>
                      )}
                    </div>

                    <div className="text-[10px] text-stone-400 font-bold mb-1">
                      {format(new Date(news.publishedAt), 'yyyy.MM.dd')}
                    </div>
                    <div className="text-sm font-bold text-stone-700 line-clamp-2 min-h-[2.5em] mb-2">
                      {news.title}
                    </div>
                    <div className="mt-auto text-[10px] border border-stone-200 px-3 py-1.5 rounded-full w-full text-stone-500 text-center hover:bg-stone-50 transition bg-stone-50/50">
                      詳しくみる
                    </div>
                 </div>
               </SwiperSlide>
             ))}
          </Swiper>
          
          {/* ★修正: 矢印の位置を内側(left-2 / right-2)に変更して画面内に収める */}
          <button 
            ref={(node) => setPrevEl(node)}
            className="absolute top-[40%] left-2 z-30 w-10 h-10 bg-white rounded-full shadow-lg border border-stone-300 flex items-center justify-center text-[#EEA51A] hover:bg-stone-50 transition-transform active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
            aria-label="前へ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          <button 
            ref={(node) => setNextEl(node)} 
            className="absolute top-[40%] right-2 z-30 w-10 h-10 bg-white rounded-full shadow-lg border border-stone-300 flex items-center justify-center text-[#EEA51A] hover:bg-stone-50 transition-transform active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
            aria-label="次へ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          <style jsx global>{`
            .news-swiper .swiper-pagination-bullet {
              background: #d6d3d1;
              opacity: 1;
              width: 6px;
              height: 6px;
              margin: 0 4px !important;
            }
            .news-swiper .swiper-pagination-bullet-active {
              background: #EEA51A;
              transform: scale(1.2);
            }
          `}</style>
        </div>
      )}

      {/* ニュース詳細モーダル (変更なし) */}
      {selectedNews && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 bg-stone-100 rounded-full p-2 text-stone-500 hover:text-stone-800 shadow-sm z-20 transition hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              <div className="overflow-y-auto flex-1 overscroll-contain p-6 md:p-8">
                  <div className="mb-2">
                    <p className="text-sm text-[#EEA51A] font-bold">
                      {format(new Date(selectedNews.publishedAt), 'yyyy.MM.dd')}
                    </p>
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 leading-snug mb-6 border-b border-stone-100 pb-4">
                    {selectedNews.title}
                  </h3>
                  {selectedNews.thumbnail && (
                    <div className="w-full mb-6 rounded-xl overflow-hidden border border-stone-100 shadow-sm">
                      <img 
                        src={selectedNews.thumbnail.url} 
                        alt={selectedNews.title} 
                        className="w-full h-auto max-h-[300px] object-contain bg-stone-50"
                      />
                    </div>
                  )}
                  <div 
                    className="prose prose-stone prose-sm max-w-none text-sm leading-loose text-stone-600 space-y-4"
                    dangerouslySetInnerHTML={{ __html: selectedNews.content || '' }}
                  />
              </div>

              <div className="p-4 border-t border-stone-100 bg-white text-center shrink-0 z-10">
                <button 
                  onClick={closeModal}
                  className="text-sm font-bold text-stone-500 hover:text-stone-800 px-10 py-3 rounded-full border border-stone-300 hover:bg-stone-50 transition w-full sm:w-auto"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}