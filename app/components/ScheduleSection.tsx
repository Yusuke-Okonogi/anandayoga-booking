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
  // ★追加: コンパクト表示フラグ（省略可能、デフォルトはfalse）
  isCompact?: boolean;
};

export default function ScheduleSection({ schedules, isCompact = false }: Props) {
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
    <div className="w-full">      
      {/* ★修正: isCompactがtrueなら幅制限を解除、falseなら従来のmax-w-md */}
      <div className={isCompact ? "w-full" : "max-w-md mx-auto"}>
        {schedules.length === 0 ? (
          <div className="py-10 bg-stone-50 text-stone-400 text-xs rounded-xl border border-stone-100 text-center">
            現在公開されているスケジュールはありません
          </div>
        ) : (
          /* ★修正: 表示モードによるクラス切り替え */
          <div className={isCompact ? "grid grid-cols-2 gap-3" : "space-y-8"}>
            {schedules.map((item) => (
              <div 
                key={item.id}
                onClick={() => openModal(item)}
                className="group cursor-pointer inline-block w-full"
              >
                <div className="w-full bg-stone-100 border border-stone-200 rounded-xl overflow-hidden relative shadow-sm hover:shadow-md transition">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail.url} 
                      alt={item.title} 
                      className="w-full h-auto block" 
                    />
                  ) : (
                    <div className="aspect-square w-full flex items-center justify-center text-stone-400 text-[10px]">
                      No Image
                    </div>
                  )}
                  {/* ホバー時のヒント（コンパクト時は非表示にするか調整） */}
                  {!isCompact && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center">
                        <span className="bg-white/90 text-stone-600 text-xs px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0 shadow-sm font-bold">
                          タップして拡大
                        </span>
                    </div>
                  )}
                </div>
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
              {/* ヘッダーエリア */}
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
    </div>
  );
}