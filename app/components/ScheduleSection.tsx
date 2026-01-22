'use client';

import { useState } from 'react';
import ModalPortal from './ModalPortal';

// ニュース型定義
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
  schedules: News[];
};

export default function ScheduleSection({ schedules }: Props) {
  const [selectedSchedule, setSelectedSchedule] = useState<News | null>(null);

  const openModal = (news: News) => {
    setSelectedSchedule(news);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedSchedule(null);
    document.body.style.overflow = '';
  };

  return (
    <section className="py-16 text-center">
      <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-serif italic">Schedule</h3>
      <h2 className="text-xl font-bold tracking-widest text-stone-700 mb-8">スケジュール</h2>
      
      <div className="max-w-md mx-auto px-4">
        {schedules.length === 0 ? (
          <div className="py-10 bg-stone-50 text-stone-400 text-xs rounded-xl border border-stone-100">
            現在公開されているスケジュールはありません
          </div>
        ) : (
          <div className="space-y-8">
            {schedules.map((item) => (
              <div 
                key={item.id}
                onClick={() => openModal(item)}
                className="group cursor-pointer inline-block w-full"
              >
                {/* 修正: アスペクト比固定(aspect-[3/4])を廃止し、
                   画像そのものの比率(h-auto)で表示して見切れを防ぐ
                */}
                <div className="w-full bg-stone-100 border border-stone-200 rounded-xl overflow-hidden relative shadow-sm hover:shadow-md transition">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail.url} 
                      alt={item.title} 
                      className="w-full h-auto block" 
                    />
                  ) : (
                    <div className="aspect-video w-full flex items-center justify-center text-stone-400">
                      No Image
                    </div>
                  )}
                  {/* ホバー時のヒント */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center">
                     <span className="bg-white/90 text-stone-600 text-xs px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0 shadow-sm font-bold">
                       タップして拡大
                     </span>
                  </div>
                </div>
                {/* 修正: タイトルテキストを削除しました */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* スケジュール詳細モーダル */}
      {selectedSchedule && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダーエリア (閉じるボタン配置用) */}
              <div className="h-12 bg-stone-100 border-b border-stone-200 flex items-center justify-end px-2 shrink-0">
                <button 
                  onClick={closeModal}
                  className="bg-white p-1.5 rounded-full text-stone-500 hover:text-stone-800 shadow-sm border border-stone-200 transition hover:scale-105 flex items-center gap-1 px-3"
                >
                  <span className="text-xs font-bold">閉じる</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* コンテンツエリア */}
              <div className="overflow-y-auto flex-1 overscroll-contain bg-white">
                {selectedSchedule.thumbnail ? (
                  <img 
                    src={selectedSchedule.thumbnail.url} 
                    alt={selectedSchedule.title} 
                    className="w-full h-auto block" 
                  />
                ) : (
                  <div className="py-20 text-center text-stone-400">画像がありません</div>
                )}
                
                {/* 本文がある場合のみ表示 (タイトルは表示しません) */}
                {selectedSchedule.content && (
                  <div className="p-4 border-t border-stone-100">
                     <div 
                        className="prose prose-stone prose-sm max-w-none text-xs leading-loose text-stone-600"
                        dangerouslySetInnerHTML={{ __html: selectedSchedule.content }}
                     />
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}