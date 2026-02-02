'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { ja } from 'date-fns/locale';

type Ticket = {
  id: string;
  ticket_name: string;
  remaining_count: number;
  expires_at: string | null;
};

// お知らせの型定義
type Announcement = {
  id: string;
  title: string;
  content: string;
  target_tags: string[];
  priority: number;
  created_at: string;
  link_url?: string;
};

export default function MyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // モーダル用state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (searchParams.get('linked') === 'success') {
      alert('🎉 LINEアカウントと連携しました！\n次回からLINEボタンで簡単にログインできます。');
      router.replace('/mypage');
    }

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, plans(name)')
        .eq('id', user.id)
        .single();
      setProfile(profile);

      // 予約履歴取得
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*, lessons(*)')
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

      if (reservationsData) {
        // 日時順にソート
        const sortedReservations = reservationsData.sort((a, b) => 
          new Date(a.lessons.start_time).getTime() - new Date(b.lessons.start_time).getTime()
        );
        
        // ★修正: 現在時刻を取得し、未来の予約のみフィルタリングして表示用stateにセット
        const now = new Date();
        const futureReservations = sortedReservations.filter(res => {
            const lessonDate = new Date(res.lessons.start_time);
            return lessonDate > now; // 終了したレッスンは除外
        });
        
        setReservations(futureReservations);

        // 今月の利用回数の計算（こちらは過去分も含める）
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        
        const currentMonthReservations = sortedReservations.filter(res => {
          const lessonDate = parseISO(res.lessons.start_time);
          return lessonDate >= start && lessonDate <= end;
        });
        setMonthlyCount(currentMonthReservations.length);
      }

      const { data: tickets } = await supabase
        .from('user_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('remaining_count', 0)
        .order('expires_at', { ascending: true });

      if (tickets) {
        setTickets(tickets);
      }

      // お知らせ取得 & フィルタリング
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (announcementsData && profile) {
        const userTags: string[] = profile.tags || [];
        
        // フィルタリング: タグ指定なしか、ユーザーがタグを持っていれば表示
        const filtered = announcementsData.filter((ann: Announcement) => {
           if (!ann.target_tags || ann.target_tags.length === 0) return true;
           return ann.target_tags.some(tag => userTags.includes(tag));
        });
        setAnnouncements(filtered);
      }

      setLoading(false);
    };

    init();
  }, [router, searchParams]);

  const handleLinkLine = () => {
    if (!user) return;
    window.location.href = `/api/auth/line?userId=${user.id}`;
  };

  const handleUnlinkLine = async () => {
    if (!confirm('LINE連携を解除しますか？\n次回からLINEでの簡単ログインができなくなります。')) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ line_user_id: null })
      .eq('id', user.id);

    if (error) {
      alert('解除に失敗しました');
    } else {
      alert('LINE連携を解除しました');
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*, plans(name)')
        .eq('id', user.id)
        .single();
      setProfile(updatedProfile);
    }
    setLoading(false);
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('本当に予約をキャンセルしますか？')) return;

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (error) {
      alert('キャンセルに失敗しました');
    } else {
      alert('予約をキャンセルしました');
      setReservations(reservations.filter(r => r.id !== reservationId));
      // キャンセルしたら月間利用回数も減らす（ただし過去の予約キャンセルは考慮不要なため簡易的に）
      setMonthlyCount(prev => Math.max(0, prev - 1));
    }
  };

  // ローディング画面
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center">
        <div className="w-32 animate-pulse">
          <img src="/logo.png" alt="Loading..." className="w-full h-auto object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] p-4 md:p-8 font-sans text-stone-700">
      <div className="max-w-md mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <Link href="/" className="text-stone-600 font-bold hover:text-[#EEA51A] transition flex items-center gap-1">
            ← 予約カレンダー
          </Link>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-xs text-stone-400 underline hover:text-stone-600">
            ログアウト
          </button>
        </div>

        {/* お知らせセクション */}
        {announcements.length > 0 && (
          <section>
            <div className="space-y-2">
              {announcements.map((ann) => (
                <div 
                  key={ann.id} 
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="bg-white px-4 py-3 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition active:scale-[0.99]"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                        {format(parseISO(ann.created_at), 'yyyy/MM/dd')}
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-700 text-sm line-clamp-1">{ann.title}</h4>
                  </div>
                  <span className="text-stone-300 text-lg">›</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 会員証カード */}
        <div className="bg-[#EEA51A] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300 opacity-20 rounded-full -ml-10 -mb-10 blur-3xl"></div>

          {/* RYT200リボン */}
          {profile?.training_status === '受講済' && (
            <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden z-20 rounded-tr-3xl pointer-events-none">
              <div className="absolute top-[20px] -right-[30px] w-[140px] bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 text-amber-900 shadow-lg text-center py-1.5 rotate-45 font-bold text-xs tracking-widest border border-white/40">
                RYT200
              </div>
            </div>
          )}

          <div className="relative z-10">
            {/* 上段：QRコードと利用状況 */}
            <div className="flex flex-row gap-4 mb-6 h-32">
              {/* 左側：QRコード */}
              <div className="bg-white p-2 rounded-2xl shadow-md flex items-center justify-center aspect-square h-full flex-shrink-0">
                {user?.id && <QRCodeSVG value={user.id} size={100} />}
              </div>

              {/* 右側：利用状況 */}
              <div className="flex flex-col gap-4 flex-grow h-full">
                  <div className="bg-white/95 px-4 rounded-xl shadow-sm flex-1 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">今月の利用</p>
                    <p className="font-bold text-xl text-stone-700 leading-none">
                      {monthlyCount} <span className="text-xs font-normal text-stone-400">回</span>
                    </p>
                  </div>
                  
                  <div className="bg-white/95 px-4 rounded-xl shadow-sm flex-1 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">回数券残り</p>
                    <p className="font-bold text-xl text-[#EEA51A] leading-none">
                      {tickets.reduce((acc, t) => acc + t.remaining_count, 0)} <span className="text-xs font-normal text-stone-400">回</span>
                    </p>
                  </div>
              </div>
            </div>
            
            {/* 下段：ユーザー情報 */}
            <div className="pt-4 border-t border-white/20">
               <h2 className="text-[10px] font-bold text-white/80 mb-2 tracking-[0.2em] drop-shadow-sm">MEMBER INFO</h2>
               
               <div className="mb-4">
                 <p className="font-bold text-2xl leading-tight drop-shadow-md break-words">
                   {profile?.full_name || 'Guest'} <span className="text-sm font-medium opacity-90">様</span>
                 </p>
               </div>

               <div className="flex flex-wrap items-center gap-3">
                 <span className="bg-white text-[#EEA51A] px-3 py-1.5 rounded-full text-xs font-bold border border-white/50 shadow-sm inline-block">
                    {profile?.plans?.name || 'プラン未設定'}
                 </span>

                 {profile?.line_user_id ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
                        <span className="bg-white text-[#06C755] rounded-full p-0.5 flex-shrink-0">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2.04c-5.5 0-10 3.96-10 8.88 0 4.41 3.9 8.1 9.17 8.76.36.08.85.24.97.55.11.28.07.72.03 1.01l-.22 1.34c-.07.41-.33 1.59 1.4 .86 1.73-.73 4.69-2.76 6.39-4.73 2.27-2.61 3.26-5.26 3.26-7.79 0-4.92-4.5-8.88-10.01-8.88zm0 0" /></svg>
                        </span>
                        <span>LINE連携済</span>
                      </div>
                      <button 
                          onClick={handleUnlinkLine}
                          className="text-[10px] text-white/80 hover:text-white font-medium underline px-1"
                      >
                          解除
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleLinkLine}
                      className="flex items-center gap-1.5 bg-white text-[#EEA51A] px-3 py-1.5 rounded-full font-bold text-xs hover:bg-stone-50 shadow-md transition active:scale-95 border border-white/50"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="#06C755"><path d="M12 2.04c-5.5 0-10 3.96-10 8.88 0 4.41 3.9 8.1 9.17 8.76.36.08.85.24.97.55.11.28.07.72.03 1.01l-.22 1.34c-.07.41-.33 1.59 1.4 .86 1.73-.73 4.69-2.76 6.39-4.73 2.27-2.61 3.26-5.26 3.26-7.79 0-4.92-4.5-8.88-10.01-8.88zm0 0" /></svg>
                      LINEと連携する
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* 回数券の詳細リスト */}
        {tickets.length > 0 && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
            <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-sm">
              🎫 お持ちの回数券
            </h3>
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="flex justify-between items-center text-sm border-b border-stone-50 pb-2 last:border-0">
                  <div>
                    <div className="font-bold text-stone-700 text-base">{ticket.ticket_name}</div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      有効期限: {ticket.expires_at ? new Date(ticket.expires_at).toLocaleDateString() : '無期限'}
                    </div>
                  </div>
                  <div className="font-bold text-[#EEA51A] bg-[#FFF8E1] px-4 py-1.5 rounded-full text-sm shadow-sm border border-[#FCEFCF]">
                    あと {ticket.remaining_count} 回
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 予約リスト */}
        <section>
          <h3 className="font-bold text-lg text-stone-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#EEA51A] rounded-full"></span>
            予約中のレッスン
          </h3>

          {reservations.length > 0 ? (
            <div className="space-y-6">
              {Array.from(new Set(reservations.map(res => format(parseISO(res.lessons.start_time), 'yyyy-MM-dd')))).map(dateKey => {
                const dayReservations = reservations.filter(res => format(parseISO(res.lessons.start_time), 'yyyy-MM-dd') === dateKey);
                const dateObj = parseISO(dayReservations[0].lessons.start_time);
                
                return (
                  <div key={dateKey}>
                    <h3 className="font-bold text-sm mb-3 pl-2 border-l-4 border-[#EEA51A] text-[#EEA51A]">
                       {format(dateObj, 'M月d日 (E)', { locale: ja })}
                    </h3>

                    <div className="space-y-4">
                      {dayReservations.map((res) => (
                        <div key={res.id} className="group relative rounded-2xl p-5 shadow-sm border transition-all duration-200 bg-[#F0FDF4] border-green-200">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl font-mono text-green-800 font-bold bg-white/60 px-2 rounded">
                                  {format(parseISO(res.lessons.start_time), 'HH:mm')}
                                </span>
                                <span className="text-xs text-green-600">〜</span>
                                
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1 ml-1">
                                  <span className="text-green-600">✓</span> 予約済み
                                </span>
                              </div>
                              
                              <h4 className="font-bold text-lg mb-2 leading-tight text-green-900">
                                {res.lessons.title}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-3 text-xs text-green-700/80">
                                <span className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-md border border-green-100">
                                  <span className="opacity-60">👤</span> {res.lessons.instructor_name}
                                </span>
                                <span className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-md border border-green-100">
                                  <span className="text-orange-500 font-bold opacity-80">★</span> {res.lessons.difficulty_level}
                                </span>
                              </div>
                            </div>
                            
                            <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-col items-stretch sm:items-end gap-2">
                              <button 
                                onClick={() => handleCancel(res.id)}
                                className="w-full sm:w-32 bg-white text-red-500 border border-red-200 text-sm py-2.5 rounded-full font-bold transition transform active:scale-95 hover:bg-red-50 hover:border-red-400 shadow-sm"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-stone-400 bg-white rounded-2xl border-2 border-dashed border-stone-200">
              <p>現在予約しているレッスンはありません</p>
              <Link href="/" className="text-sm text-[#EEA51A] underline mt-2 inline-block">レッスンスケジュールを見る</Link>
            </div>
          )}
        </section>

        {/* お知らせモーダル */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedAnnouncement(null)}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                    {format(parseISO(selectedAnnouncement.created_at), 'yyyy/MM/dd')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-800 leading-snug">{selectedAnnouncement.title}</h3>
              </div>
              
              <div className="pr-2">
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
                {selectedAnnouncement.link_url && (
                  <div className="mt-6 text-center">
                    <a 
                      href={selectedAnnouncement.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block bg-[#EEA51A] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#D99000] transition transform hover:scale-105"
                    >
                      詳しくはこちら
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-sm text-stone-400 underline hover:text-stone-600"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}