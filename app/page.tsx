'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, 
  parseISO, startOfDay, endOfDay
} from 'date-fns';
import { ja } from 'date-fns/locale';

type Lesson = {
  id: string;
  title: string;
  instructor_name: string;
  start_time: string;
  end_time: string;
  difficulty_level: string;
  capacity: number;
  type: string;
  reservations: { id: string; user_id: string }[];
};

type ViewMode = 'day' | 'week' | 'month';

export default function Home() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // 管理者判定用
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [reservingId, setReservingId] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [now, setNow] = useState(new Date());

  // モーダル用state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetLesson, setTargetLesson] = useState<Lesson | null>(null);
  const [visitorMode, setVisitorMode] = useState(false);
  const [visitorForm, setVisitorForm] = useState({ fullName: '', email: '', phone: '' });

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: '', body: '' });
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // roleを取得して管理者かどうか判定
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const fetchLessons = useCallback(async () => {
    setLessonsLoading(true);
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

    const fetchEnd = addDays(end, 1);

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*, reservations(id, user_id)')
      .gte('start_time', start.toISOString())
      .lt('start_time', fetchEnd.toISOString())
      .order('start_time', { ascending: true });
    
    if (lessonsData) {
      setLessons(lessonsData as any);
    }
    setLessonsLoading(false);
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    router.refresh();
    window.location.reload(); 
  };

  const handleReserveClick = (lesson: Lesson) => {
    const lessonStart = new Date(lesson.start_time);
    const reservationDeadline = new Date(lessonStart.getTime() - 60 * 60 * 1000);
    if (now > reservationDeadline) {
      alert('予約受付時間を過ぎています（開始1時間前まで）');
      return;
    }

    if (user) {
      // ログイン済みなら会員予約へ
      handleMemberReserve(lesson.id, lesson.title, lesson.start_time, lesson.instructor_name);
    } else {
      // 未ログインならビジター選択モーダルへ
      setTargetLesson(lesson);
      setVisitorMode(false);
      setVisitorForm({ fullName: '', email: '', phone: '' });
      setShowLoginModal(true);
    }
  };

  const handleMemberReserve = async (lessonId: string, lessonTitle: string, startTime: string, instructorName: string) => {
    if (!confirm(`「${lessonTitle}」を予約しますか？`)) return;

    setReservingId(lessonId);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      alert('会員データが見つかりません。再ログインしてください。');
      setReservingId(null);
      return;
    }

    const { error } = await supabase.from('reservations').insert([
      {
        user_id: user.id,
        lesson_id: lessonId,
        status: 'confirmed',
      },
    ]);

    if (error) {
      alert(`予約に失敗しました: ${error.message}`);
    } else {
      const formattedDate = format(parseISO(startTime), 'yyyy年M月d日(E) HH:mm', { locale: ja });
      
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: profile.email || user.email,
            userName: profile.full_name || 'ゲスト',
            lessonTitle: lessonTitle,
            lessonDate: formattedDate,
            instructorName: instructorName
          }),
        });
        alert('🎉 予約が完了しました！確認メールをお送りしました。');
      } catch (err) {
        alert('予約は完了しましたが、メール送信時にエラーが発生しました。');
      }

      fetchLessons();
    }
    setReservingId(null);
  };

  const handleCancel = async (reservationId: string, lessonTitle: string, startTime: string, instructorName: string) => {
    if (!confirm(`「${lessonTitle}」の予約をキャンセルしますか？`)) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (error) {
      alert('キャンセルに失敗しました');
    } else {
      if (profile) {
        const formattedDate = format(parseISO(startTime), 'yyyy年M月d日(E) HH:mm', { locale: ja });
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'cancellation',
            userEmail: profile.email || user.email,
            userName: profile.full_name || 'ゲスト',
            lessonTitle: lessonTitle,
            lessonDate: formattedDate,
            instructorName: instructorName
          }),
        }).catch(err => console.error('Cancel email failed:', err));
      }
      alert('予約をキャンセルしました');
      fetchLessons();
    }
  };

  const openPersonalRequest = (lesson: Lesson) => {
    // 未ログインの場合はログインへ誘導
    if (!user) {
      setTargetLesson(lesson);
      setVisitorMode(false);
      setVisitorForm({ fullName: '', email: '', phone: '' });
      setShowLoginModal(true);
      return;
    }
    setContactForm({
      subject: `パーソナル予約希望: ${lesson.title}`,
      body: `希望日時:\n・第一希望: \n・第二希望: \n\nその他ご要望:\n`
    });
    setContactModalOpen(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject || !contactForm.body) return;
    setSendingContact(true);

    try {
      let userName = 'ゲスト';
      let userEmail = user?.email;

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', user.id).single();
        if (profile) {
          userName = profile.full_name || 'ゲスト';
          userEmail = profile.email || user.email;
        }
      }

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          userEmail: userEmail,
          userName: userName,
          contactSubject: contactForm.subject,
          contactBody: contactForm.body
        }),
      });

      if (!res.ok) throw new Error('送信失敗');

      alert('リクエストを送信しました。\n担当者からの連絡をお待ちください。');
      setContactModalOpen(false);
      setContactForm({ subject: '', body: '' });

    } catch (err) {
      alert('送信に失敗しました。');
    }
    setSendingContact(false);
  };

  const handleVisitorReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLesson || !visitorForm.fullName || !visitorForm.email) return;
    if (!confirm(`「${targetLesson.title}」を予約しますか？`)) return;

    setReservingId(targetLesson.id);

    try {
      const formattedDate = format(parseISO(targetLesson.start_time), 'yyyy年M月d日(E) HH:mm', { locale: ja });
      const res = await fetch('/api/visitor-reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: visitorForm.fullName,
          email: visitorForm.email,
          phone: visitorForm.phone,
          lessonId: targetLesson.id,
          lessonTitle: targetLesson.title,
          lessonDate: formattedDate,
          instructorName: targetLesson.instructor_name
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '予約に失敗しました');

      alert('🎉 予約が完了しました！\n確認メールをお送りしました。\n\n当日は受付にて簡単な会員登録をお願いいたします。');
      setShowLoginModal(false);
      fetchLessons();
    } catch (err: any) {
      alert(`エラー: ${err.message}`);
    }
    setReservingId(null);
  };

  const getAvailability = (lesson: Lesson) => {
    if (lesson.type === 'personal') {
      return { icon: '◇', text: '日程調整', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', isFull: false };
    }
    if (lesson.type === 'training') {
      return { icon: '-', text: '予約不可', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', isFull: true };
    }

    const count = lesson.reservations ? lesson.reservations.length : 0;
    const capacity = lesson.capacity || 15;
    const ratio = count / capacity;

    if (count >= capacity) {
      return { icon: '✕', text: '満員', color: 'text-stone-400', bg: 'bg-stone-100', border: 'border-stone-200', isFull: true };
    }
    if (ratio >= 0.7) {
      return { icon: '△', text: '残りわずか', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', isFull: false };
    }
    return { icon: '〇', text: '空席あり', color: 'text-[#EEA51A]', bg: 'bg-[#FFF8E1]', border: 'border-[#FCEFCF]', isFull: false };
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
    const monthEnd = endOfMonth(currentDate);
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
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            key={day.toString()}
            onClick={() => {
              setCurrentDate(cloneDay);
              setViewMode('day');
            }}
            className={`
              min-h-[100px] p-1 cursor-pointer transition relative flex flex-col border-r border-b border-stone-200
              ${isToday 
                ? 'bg-[#FFF8E1]' 
                : `hover:bg-[#FFF8E1] ${!isSameDay(day, new Date()) && !isSameMonth(day, monthStart) ? 'bg-stone-50/50 text-stone-300' : 'bg-white'}`
              }
            `}
          >
            <div className={`text-xs font-bold text-center mb-1 ${isToday ? 'text-[#EEA51A]' : 'text-stone-600'}`}>
              {formattedDate}
            </div>
            
            {hasLesson && (
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayLessons.map(l => {
                  let status = getAvailability(l);
                  
                  const lessonStart = new Date(l.start_time);
                  const reservationDeadline = new Date(lessonStart.getTime() - 60 * 60 * 1000);
                  const isReservableTime = now <= reservationDeadline;
                  
                  if (!isReservableTime && l.type === 'normal') {
                    status = { 
                      icon: '-', 
                      text: '終了', 
                      color: 'text-stone-400', 
                      bg: 'bg-stone-100', 
                      border: 'border-stone-200', 
                      isFull: false 
                    };
                  }
                  
                  const isReserved = user ? l.reservations.some(r => r.user_id === user.id) : false;

                  return (
                    <div key={l.id} className={`text-[10px] ${isReserved ? 'bg-green-100 text-green-800 border-green-200' : `${status.bg} ${status.color} ${status.border}`} px-1.5 py-0.5 rounded truncate leading-tight border`}>
                      <span className="font-bold mr-1">{isReserved ? '✓' : status.icon}</span>
                      {l.type === 'personal' ? '調整' : (
                         <span className="mr-1">{format(parseISO(l.start_time), 'HH:mm')}-{format(parseISO(l.end_time), 'HH:mm')}</span>
                      )}
                      {l.title}
                    </div>
                  );
                })}
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
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-6">
         <div className="grid grid-cols-7 bg-[#FDFBF7] border-b border-stone-200 text-center py-3 text-xs font-bold text-stone-500 tracking-wider">
          <div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-blue-400">土</div><div className="text-red-400">日</div>
        </div>
        {rows}
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
    <div className="min-h-screen bg-[#F7F5F0] pb-20 font-sans text-stone-700 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* コンテンツエリア */}
        <div className="px-4 sm:px-0">
          
          {/* 予約に関する注意書き（簡略化版） */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-200 mb-6 text-center text-xs text-stone-500 leading-relaxed">
            <span className="text-[#EEA51A] mr-1">ℹ️</span>
            予約・キャンセルは<span className="font-bold text-stone-600">開始1時間前</span>まで
            <span className="mx-2 text-stone-300 hidden sm:inline">|</span>
            <br className="sm:hidden" />
            パーソナルは<span className="font-bold text-stone-600">前日</span>まで
          </div>
          
          {/* コントロールバー */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
              <div className="flex gap-2">
                  <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-500">←</button>
                  <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-500">→</button>
              </div>
              <div className="font-bold text-lg text-stone-700">
                {format(currentDate, viewMode === 'day' ? 'M月d日 (E)' : 'yyyy年M月', { locale: ja })}
              </div>
              <button onClick={handleToday} className="text-xs border border-stone-300 px-3 py-1 rounded-full hover:bg-stone-50 font-bold text-stone-500">今日</button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex bg-white rounded-full p-1 shadow-sm border border-stone-200 w-full sm:w-auto justify-center">
                {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-5 py-1.5 rounded-full text-sm font-bold transition flex-1 sm:flex-none ${
                      viewMode === mode 
                        ? 'bg-[#EEA51A] text-white shadow' 
                        : 'text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    {mode === 'day' ? '日' : mode === 'week' ? '週' : '月'}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 text-[10px] sm:text-xs text-stone-500 bg-white/50 px-3 py-1 rounded-full flex-wrap justify-center">
                <span className="flex items-center gap-1"><span className="text-[#EEA51A] font-bold">〇</span> 空席あり</span>
                <span className="flex items-center gap-1"><span className="text-red-500 font-bold">△</span> 残りわずか</span>
                <span className="flex items-center gap-1"><span className="text-stone-400 font-bold">✕</span> 満員</span>
                <span className="flex items-center gap-1"><span className="text-green-600 font-bold">✓</span> 予約済</span>
              </div>
            </div>
          </div>

          {/* カレンダー表示 */}
          {viewMode === 'month' && renderMonthCalendar()}

          {/* リスト表示 */}
          {lessonsLoading ? (
            <div className="text-center py-20 text-stone-400">読み込み中...</div>
          ) : (
            <div className="space-y-4">
              {(() => {
                let targetDates: Date[] = [];
                if (viewMode === 'month') {
                  const uniqueDates = Array.from(new Set(lessons.map(l => format(parseISO(l.start_time), 'yyyy-MM-dd')))).sort();
                  targetDates = uniqueDates.map(d => parseISO(d));
                  if (targetDates.length === 0) return null;
                } else {
                  let start: Date, end: Date;
                  if (viewMode === 'day') {
                    start = new Date(currentDate);
                    end = new Date(currentDate);
                  } else {
                    start = startOfWeek(currentDate, { weekStartsOn: 1 });
                    end = endOfWeek(currentDate, { weekStartsOn: 1 });
                  }
                  let d = start;
                  while (d <= end) {
                    targetDates.push(d);
                    d = addDays(d, 1);
                  }
                }

                return targetDates.map(dateObj => {
                  const dateKey = format(dateObj, 'yyyy-MM-dd');
                  const dayLessons = lessons.filter(l => format(parseISO(l.start_time), 'yyyy-MM-dd') === dateKey);

                  if (viewMode === 'month' && dayLessons.length === 0) return null;

                  return (
                    <div key={dateKey} className="mb-6">
                      <h3 className={`font-bold text-sm mb-3 pl-2 border-l-4 flex items-center gap-2 ${isSameDay(dateObj, new Date()) ? 'border-[#EEA51A] text-[#EEA51A]' : 'border-stone-300 text-stone-600'}`}>
                        {format(dateObj, 'M月d日 (E)', { locale: ja })}
                        {isSameDay(dateObj, new Date()) && <span className="text-[10px] bg-[#EEA51A]/20 text-[#EEA51A] px-2 py-0.5 rounded-full">Today</span>}
                      </h3>

                      <div className="space-y-4">
                        {dayLessons.length === 0 ? (
                          <div className="p-4 text-xs text-stone-400 bg-white/50 rounded-xl border border-dashed border-stone-200">
                            レッスンはありません
                          </div>
                        ) : (
                          dayLessons.map((lesson) => {
                            const status = getAvailability(lesson);
                            const userReservation = user ? lesson.reservations.find(r => r.user_id === user.id) : null;
                            const isReserved = !!userReservation;

                            const lessonStart = new Date(lesson.start_time);
                            const reservationDeadline = new Date(lessonStart.getTime() - 60 * 60 * 1000);
                            const isReservableTime = now <= reservationDeadline;

                            let cardStyle = isReserved ? 'bg-[#F0FDF4] border-green-200' : 'bg-white border-stone-100 hover:shadow-md hover:border-[#EEA51A]/30';
                            if (lesson.type === 'personal') cardStyle = 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-300';
                            if (lesson.type === 'training') cardStyle = 'bg-slate-50 border-slate-200 hover:border-slate-300';

                            return (
                              <div key={lesson.id} className={`group relative rounded-2xl p-5 shadow-sm border transition-all duration-200 ${cardStyle}`}>
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {lesson.type === 'personal' ? (
                                         <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                            日程調整
                                         </span>
                                      ) : (
                                         <span className="text-xl font-mono text-stone-700 font-bold bg-stone-100/50 px-2 rounded">
                                           {format(parseISO(lesson.start_time), 'HH:mm')} <span className="text-sm text-stone-400 font-normal mx-1">-</span> {format(parseISO(lesson.end_time), 'HH:mm')}
                                         </span>
                                      )}
                                      
                                      {/* ステータス表示 */}
                                      {isReserved ? (
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1 ml-1">
                                          <span className="text-green-600">✓</span> 予約済み
                                        </span>
                                      ) : lesson.type === 'normal' && !isReservableTime ? (
                                        <span className="bg-stone-100 text-stone-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-200 ml-1">
                                          - 受付終了
                                        </span>
                                      ) : (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.bg} ${status.color} ${status.border} ml-1`}>
                                          {status.icon} {status.text}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <h4 className={`font-bold text-lg mb-2 leading-tight ${isReserved ? 'text-green-900' : 'text-stone-800 group-hover:text-[#EEA51A] transition'}`}>
                                      {lesson.title}
                                    </h4>
                                    
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                                      <span className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-md border border-stone-100">
                                        <span className="opacity-60">👤</span> {lesson.instructor_name}
                                      </span>
                                      {lesson.type === 'normal' && (
                                        <span className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-md border border-stone-100">
                                          <span className="text-orange-500 font-bold opacity-80">★</span> {lesson.difficulty_level}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-col items-stretch sm:items-end gap-2">
                                    {isReserved ? (
                                        // 予約済み -> キャンセルボタン
                                        <button 
                                          onClick={() => handleCancel(userReservation!.id, lesson.title, lesson.start_time, lesson.instructor_name)}
                                          className="w-full sm:w-32 bg-white text-red-500 border border-red-200 text-sm py-2.5 rounded-full font-bold transition transform active:scale-95 hover:bg-red-50 hover:border-red-400 shadow-sm"
                                        >
                                          キャンセル
                                        </button>
                                    ) : lesson.type === 'personal' ? (
                                        // パーソナル -> リクエストボタン
                                        <button 
                                          onClick={() => openPersonalRequest(lesson)}
                                          className="w-full sm:w-32 bg-indigo-600 text-white text-sm py-2.5 rounded-full font-bold transition transform active:scale-95 hover:bg-indigo-700 shadow-md"
                                        >
                                          予約リクエスト
                                        </button>
                                    ) : lesson.type === 'training' ? (
                                        // 養成講座 -> ボタンなし (表示のみ)
                                        <span className="text-xs text-slate-500 font-bold px-4 py-2 bg-slate-100 rounded-full border border-slate-200 text-center">
                                           ※予約不可
                                        </span>
                                    ) : (
                                        // ★修正: 未ログインでもボタンを表示（handleReserveClickで分岐）
                                        // disabled条件から `!user` を削除
                                        <button 
                                          onClick={() => handleReserveClick(lesson)}
                                          disabled={reservingId === lesson.id || (user && (status.isFull || !isReservableTime))}
                                          className={`w-full sm:w-32 text-white text-sm py-2.5 rounded-full font-bold transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                                            user && !isReservableTime
                                              ? 'bg-stone-300' 
                                              : user && status.isFull 
                                                ? 'bg-stone-400' 
                                                : 'bg-stone-800 hover:bg-[#EEA51A]'
                                          }`}
                                        >
                                          {reservingId === lesson.id ? '予約中...' : (user && !isReservableTime) ? '受付終了' : (user && status.isFull) ? '満員' : '予約する'}
                                        </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* ... (モーダル群はそのまま) ... */}
        {/* ビジター予約モーダル */}
        {showLoginModal && targetLesson && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}>
             {/* ... モーダルの中身 ... */}
             <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-stone-700 mb-2">予約方法の選択</h3>
              <p className="text-sm text-stone-500 mb-6">
                予約するクラス: <span className="font-bold text-[#EEA51A]">{targetLesson.title}</span>
              </p>

              {!visitorMode ? (
                <div className="space-y-4">
                  <Link href="/login" className="block w-full bg-stone-800 text-white text-center py-4 rounded-xl font-bold shadow-md hover:bg-stone-700 transition">
                    ログインして予約
                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">回数券や履歴を利用できます</span>
                  </Link>
                  
                  <div className="relative text-center py-2">
                    <hr className="border-stone-200" />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-stone-400">または</span>
                  </div>

                  <button 
                    onClick={() => setVisitorMode(true)}
                    className="w-full bg-white border-2 border-[#EEA51A] text-[#EEA51A] py-4 rounded-xl font-bold hover:bg-[#FFF8E1] transition"
                  >
                    ビジターで予約
                    <span className="block text-[10px] font-normal text-stone-400 mt-0.5">会員登録せずにお試し予約</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVisitorReserve} className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">お名前 (必須)</label>
                    <input
                      required
                      placeholder="山田 花子"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none"
                      value={visitorForm.fullName}
                      onChange={(e) => setVisitorForm({...visitorForm, fullName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">メールアドレス (必須)</label>
                    <input
                      type="email"
                      required
                      placeholder="example@email.com"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none"
                      value={visitorForm.email}
                      onChange={(e) => setVisitorForm({...visitorForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">電話番号 (任意)</label>
                    <input
                      type="tel"
                      placeholder="090-1234-5678"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none"
                      value={visitorForm.phone}
                      onChange={(e) => setVisitorForm({...visitorForm, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setVisitorMode(false)}
                      className="flex-1 bg-stone-100 text-stone-500 font-bold py-3 rounded-xl hover:bg-stone-200"
                    >
                      戻る
                    </button>
                    <button
                      type="submit"
                      disabled={reservingId === targetLesson.id}
                      className="flex-1 bg-[#EEA51A] text-white font-bold py-3 rounded-xl hover:bg-[#D99000] disabled:opacity-50 shadow-md"
                    >
                      {reservingId === targetLesson.id ? '送信中...' : '予約する'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* お問い合わせフォームモーダル */}
        {contactModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setContactModalOpen(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2">
                <span className="text-2xl">✉️</span> {contactForm.subject.includes('予約希望') ? '予約リクエスト' : 'お問い合わせ'}
              </h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">件名</label>
                  <input
                    required
                    value={contactForm.subject}
                    onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                    placeholder="例: 予約の変更について"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">お問い合わせ内容</label>
                  <textarea
                    required
                    rows={5}
                    value={contactForm.body}
                    onChange={e => setContactForm({...contactForm, body: e.target.value})}
                    placeholder="詳細をご記入ください..."
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none"
                  />
                </div>
                <div className="pt-2 flex gap-3">
                   <button
                     type="button"
                     onClick={() => setContactModalOpen(false)}
                     className="flex-1 bg-stone-100 text-stone-500 font-bold py-3 rounded-xl hover:bg-stone-200"
                   >
                     キャンセル
                   </button>
                   <button
                     type="submit"
                     disabled={sendingContact}
                     className="flex-1 bg-[#EEA51A] text-white font-bold py-3 rounded-xl hover:bg-[#D99000] disabled:opacity-50 transition shadow-md"
                   >
                     {sendingContact ? '送信中...' : '送信する'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}