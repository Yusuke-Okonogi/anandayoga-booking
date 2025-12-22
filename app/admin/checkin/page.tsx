'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, 
  parseISO, startOfDay, endOfDay
} from 'date-fns';
import { ja } from 'date-fns/locale';
import jsQR from 'jsqr';

type Reservation = {
  id: string;
  status: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
};

type LessonWithReservations = {
  id: string;
  title: string;
  start_time: string;
  instructor_name: string;
  reservations: Reservation[];
};

type ViewMode = 'day' | 'week' | 'month';

export default function CheckInPage() {
  const [lessons, setLessons] = useState<LessonWithReservations[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const [isScanMode, setIsScanMode] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let start: Date, end: Date;

    if (viewMode === 'day') {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 1 });
      end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    }

    const { data: lessonsData, error } = await supabase
      .from('lessons')
      .select(`
        id, title, start_time, instructor_name,
        reservations (
          id, status, user_id,
          profiles (full_name, email)
        )
      `)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setLessons(lessonsData as any);
    }
    setLoading(false);
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async (reservationId: string, currentStatus: string, userName?: string) => {
    const newStatus = currentStatus === 'attended' ? 'confirmed' : 'attended';
    
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', reservationId);

    if (!error) {
      fetchData();
      if (userName && newStatus === 'attended') {
        setScanMessage({ text: `🌿 ${userName}様 チェックイン完了`, type: 'success' });
        setTimeout(() => setScanMessage(null), 3000);
      }
    } else {
      alert('更新に失敗しました');
    }
  };

  const startCamera = async () => {
    setIsScanMode(true);
    setScanMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error('Camera Error:', err);
      setScanMessage({ text: 'カメラを起動できませんでした', type: 'error' });
    }
  };

  const stopCamera = () => {
    setIsScanMode(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          handleScanSuccess(code.data);
          return;
        }
      }
    }
    animationRef.current = requestAnimationFrame(tick);
  };

  const handleScanSuccess = (scannedUserId: string) => {
    let targetReservation: Reservation | null = null;

    for (const lesson of lessons) {
        const res = lesson.reservations.find(r => r.user_id === scannedUserId);
        if (res) {
            if (isSameDay(parseISO(lesson.start_time), new Date())) {
                targetReservation = res;
                if (res.status !== 'attended') break; 
            }
        }
    }

    if (targetReservation) {
        if (targetReservation.status === 'attended') {
             setScanMessage({ text: `⚠️ ${targetReservation.profiles.full_name}様は既に受付済みです`, type: 'error' });
             setTimeout(() => {
                if (isScanMode) animationRef.current = requestAnimationFrame(tick);
             }, 2000);
        } else {
             handleCheckIn(targetReservation.id, targetReservation.status, targetReservation.profiles.full_name);
             setTimeout(() => {
                if (isScanMode) animationRef.current = requestAnimationFrame(tick);
             }, 3000);
        }
    } else {
        setScanMessage({ text: '⚠️ 本日の予約が見つかりません', type: 'error' });
        setTimeout(() => {
           if (isScanMode) animationRef.current = requestAnimationFrame(tick);
        }, 2000);
    }
  };

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(d => subDays(d, 1));
    if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1));
    if (viewMode === 'month') setCurrentDate(d => subMonths(d, 1));
  };
  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(d => addDays(d, 1));
    if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1));
    if (viewMode === 'month') setCurrentDate(d => addMonths(d, 1));
  };
  const handleToday = () => setCurrentDate(new Date());

  const renderMonthCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, 'd');
        const dayLessons = lessons.filter(l => isSameDay(parseISO(l.start_time), cloneDay));
        const hasLesson = dayLessons.length > 0;
        const totalReservations = dayLessons.reduce((acc, l) => acc + l.reservations.length, 0);

        days.push(
          <div
            key={day.toString()}
            onClick={() => {
              setCurrentDate(cloneDay);
              setViewMode('day');
            }}
            className={`
              h-24 border-r border-b border-stone-200 p-2 cursor-pointer transition relative
              ${!isSameMonth(day, monthStart) ? 'bg-stone-50/50 text-stone-300' : 'bg-white'}
              ${isSameDay(day, new Date()) ? 'bg-yellow-50' : ''}
              hover:bg-[#FFF8E1]
            `}
          >
            <div className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-[#EEA51A]' : 'text-stone-600'}`}>
              {formattedDate}
            </div>
            {hasLesson && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1 text-xs text-[#EEA51A] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#EEA51A]"></span>
                  {dayLessons.length}クラス
                </div>
                {totalReservations > 0 && (
                  <div className="text-[10px] text-stone-500 pl-3">
                    {totalReservations}名予約
                  </div>
                )}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* SPでカレンダーが潰れないように min-w を設定してスクロール可能に */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px] md:min-w-0">
            <div className="grid grid-cols-7 bg-[#FDFBF7] border-b border-stone-200 text-center py-3 text-xs font-bold text-stone-500 tracking-wider">
              <div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-blue-400">土</div><div className="text-red-400">日</div>
            </div>
            {rows}
          </div>
        </div>
      </div>
    );
  };

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
      <div className="max-w-4xl mx-auto">
        
        {/* ヘッダー：ロゴを削除しタイトルのみ表示 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* ロゴ画像削除 */}
            <h1 className="text-lg md:text-2xl font-bold text-stone-700 pl-2 md:pl-0 h-6 md:h-10 flex items-center whitespace-nowrap">
              予約・チェックイン
            </h1>
          </div>
          
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-stone-200 w-full md:w-auto overflow-x-auto">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 md:flex-none px-5 py-2 rounded-full text-sm font-bold transition whitespace-nowrap ${
                  viewMode === mode 
                    ? 'bg-[#EEA51A] text-white shadow-md' 
                    : 'text-stone-500 hover:bg-stone-50'
                }`}
              >
                {mode === 'day' ? '日' : mode === 'week' ? '週' : '月'}
              </button>
            ))}
          </div>
        </div>

        {/* QRスキャン */}
        <div className="mb-8">
           {!isScanMode ? (
             <button 
               onClick={startCamera}
               className="w-full bg-stone-800 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-stone-700 transition flex items-center justify-center gap-3 border-2 border-stone-800"
             >
               <span>📷</span>
               <span>QRチェックインを開始</span>
             </button>
           ) : (
             <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white">
                <video ref={videoRef} className="w-full h-80 object-cover opacity-90"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-[#EEA51A] rounded-2xl opacity-80 relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#EEA51A] -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#EEA51A] -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#EEA51A] -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#EEA51A] -mb-1 -mr-1"></div>
                  </div>
                </div>

                <div className="absolute top-4 right-4 z-10">
                  <button onClick={stopCamera} className="bg-black/40 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md hover:bg-black/60 transition">
                    × 閉じる
                  </button>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                   {scanMessage ? (
                     <div className={`inline-block px-6 py-3 rounded-full font-bold shadow-lg transform transition-all ${
                       scanMessage.type === 'success' ? 'bg-[#EEA51A] text-white scale-110' : 'bg-red-500 text-white'
                     }`}>
                       {scanMessage.text}
                     </div>
                   ) : (
                     <p className="text-white/90 text-sm font-medium">QRコードを枠内に映してください</p>
                   )}
                </div>
             </div>
           )}
        </div>

        {/* 日付ナビゲーション */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex w-full sm:w-auto justify-between items-center gap-4">
            <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-500 transition border border-stone-100">
              ←
            </button>
            <div className="text-xl font-bold text-stone-700 tracking-wide">
              {format(currentDate, viewMode === 'day' ? 'yyyy年M月d日 (E)' : 'yyyy年M月', { locale: ja })}
            </div>
            <button onClick={handleNext} className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-500 transition border border-stone-100">
              →
            </button>
          </div>
          
          <div className="flex gap-2">
            {viewMode === 'day' && isSameDay(currentDate, new Date()) && 
              <span className="text-xs bg-[#FFF8E1] text-[#EEA51A] px-3 py-2 rounded-full border border-[#FCEFCF] font-bold flex items-center">TODAY</span>
            }
            <button onClick={handleToday} className="px-5 py-2 text-sm font-bold text-stone-600 border border-stone-300 rounded-full hover:bg-stone-50 hover:border-stone-400 transition">
              今日へ戻る
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        {loading ? (
          <div className="text-center py-20 text-stone-400 animate-pulse">読み込み中...</div>
        ) : (
          <>
            {viewMode === 'month' && renderMonthCalendar()}

            {(viewMode === 'day' || viewMode === 'week') && (
              lessons.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl text-center border-2 border-dashed border-stone-200 text-stone-400">
                  <p className="font-bold text-lg mb-2">レッスンがありません</p>
                  <p className="text-sm opacity-80">この日のスケジュールは登録されていません</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Array.from(new Set(lessons.map(l => format(parseISO(l.start_time), 'yyyy-MM-dd')))).map(dateKey => {
                    const dayLessons = lessons.filter(l => format(parseISO(l.start_time), 'yyyy-MM-dd') === dateKey);
                    const dateObj = parseISO(dayLessons[0].start_time);
                    
                    return (
                      <div key={dateKey} className="space-y-4">
                        {viewMode === 'week' && (
                          <h3 className={`font-bold text-lg border-b-2 pb-2 px-2 flex items-center gap-2 ${isSameDay(dateObj, new Date()) ? 'text-[#EEA51A] border-[#EEA51A]' : 'text-stone-600 border-stone-200'}`}>
                            {format(dateObj, 'M月d日 (E)', { locale: ja })}
                            {isSameDay(dateObj, new Date()) && <span className="text-xs bg-[#FFF8E1] text-[#EEA51A] px-2 py-0.5 rounded-full ml-auto">Today</span>}
                          </h3>
                        )}

                        {dayLessons.map((lesson) => (
                          <div key={lesson.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100 hover:shadow-md transition duration-300">
                            {/* レッスンヘッダー */}
                            <div className="bg-[#FDFBF7] p-4 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div>
                                <div className="text-lg font-bold text-stone-800 flex items-center gap-3">
                                  <span className="font-mono bg-white border border-stone-200 px-2 py-1 rounded text-stone-600 text-base">
                                    {format(parseISO(lesson.start_time), 'HH:mm')}
                                  </span>
                                  {lesson.title}
                                </div>
                                <div className="text-sm text-stone-500 mt-2 flex items-center gap-3 ml-1">
                                  <span className="flex items-center gap-1">👤 {lesson.instructor_name}</span>
                                </div>
                              </div>
                              <div className="text-right w-full sm:w-auto">
                                <span className="text-sm font-bold bg-[#FFF8E1] text-[#EEA51A] px-4 py-1.5 rounded-full border border-[#FCEFCF] inline-block">
                                  予約 {lesson.reservations.length} 名
                                </span>
                              </div>
                            </div>

                            {/* 予約リスト */}
                            <div className="p-2">
                              {lesson.reservations.length === 0 ? (
                                <div className="p-6 text-center text-stone-400 text-sm italic">
                                  まだ予約はありません
                                </div>
                              ) : (
                                <div className="divide-y divide-stone-100">
                                  {lesson.reservations.map((res) => (
                                    <div key={res.id} className="p-3 hover:bg-stone-50 transition flex justify-between items-center rounded-lg gap-2">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${res.status === 'attended' ? 'bg-[#EEA51A]' : 'bg-stone-300'}`}></div>
                                        <div className="min-w-0">
                                          <div className="font-bold text-stone-700 truncate">{res.profiles?.full_name || 'ゲスト'}</div>
                                          <div className="text-xs text-stone-400 truncate">{res.profiles?.email}</div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleCheckIn(res.id, res.status, res.profiles?.full_name)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition transform active:scale-95 whitespace-nowrap ${
                                          res.status === 'attended'
                                            ? 'bg-stone-100 text-stone-400 border border-stone-200'
                                            : 'bg-[#EEA51A] text-white shadow-md hover:bg-[#D99000] hover:shadow-lg'
                                        }`}
                                      >
                                        {res.status === 'attended' ? '取消' : 'CheckIn'}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}