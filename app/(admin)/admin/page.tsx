'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 型定義
type Lesson = {
  id: string;
  title: string;
  instructor_name: string;
  start_time: string;
  end_time: string;
  capacity: number;
  difficulty_level: string;
  description: string | null;
  google_calendar_event_id: string | null;
  type: string; 
  reservations?: { id: string }[];
};

type Announcement = { id: string; title: string; content: string; target_tags: string[]; priority: number; created_at: string; link_url?: string; };
type Profile = { id: string; member_number: number; email: string; full_name: string; phone: string | null; line_user_id: string | null; training_status: string | null; tags: string[] | null; };

// 内部コンポーネント
function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'lessons' | 'users' | 'announcements'>('lessons');
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // --- レッスン管理用 ---
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    instructor_name: '',
    start_time: '',
    end_time: '',
    capacity: 15,
    difficulty_level: '★',
    description: '',
    type: 'normal',
  });

  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedUserIdToReserve, setSelectedUserIdToReserve] = useState('');
  const [reserveMode, setReserveMode] = useState<'member' | 'guest'>('member');
  const [userSearchTerm, setUserSearchTerm] = useState(''); 
  const [guestFormData, setGuestFormData] = useState({ full_name: '', phone: '', email: '' });

  // --- ユーザー管理用 ---
  const [users, setUsers] = useState<Profile[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userFormData, setUserFormData] = useState({ email: '', full_name: '', phone: '', training_status: '未受講', tags: '' });
  const [createdPassword, setCreatedPassword] = useState('');

  // --- お知らせ管理用 ---
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  // ★追加: お知らせ用モーダル開閉ステート
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', target_tags: '', priority: 0, link_url: '' });

  // URLクエリパラメータからタブを切り替える処理
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['lessons', 'users', 'announcements'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { return; }
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

      if (profile?.role !== 'admin') {
        alert('管理者権限がありません。トップページへ移動します。');
        router.push('/');
      } else {
        Promise.all([fetchLessons(), fetchUsers(), fetchAnnouncements()]).then(() => {
          setInitLoading(false);
        });
      }
    };
    checkAdmin();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'announcements') fetchAnnouncements();
  }, [activeTab]);

  // --- データ取得関数 ---
  const fetchLessons = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('lessons')
      .select('*, reservations(id, user_id, profiles(*))')
      .gte('start_time', today.toISOString())
      .order('start_time', { ascending: true });
    if (data) setLessons(data as any);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select(`*`).order('member_number', { ascending: true });
    if (data) setUsers(data as any);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  };

  // --- レッスン管理機能 ---
  const handleLessonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLessonFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        title: lessonFormData.title,
        instructor_name: lessonFormData.instructor_name,
        start_time: lessonFormData.start_time,
        end_time: lessonFormData.end_time,
        capacity: Number(lessonFormData.capacity),
        difficulty_level: lessonFormData.difficulty_level,
        description: lessonFormData.description,
        type: lessonFormData.type,
      };
      if (editingId) {
        const { error } = await supabase.from('lessons').update(payload).eq('id', editingId);
        if (error) throw error;
        setMessage('✅ クラスを更新しました！');
        setEditingId(null);
      } else {
        const { error } = await supabase.from('lessons').insert([payload]);
        if (error) throw error;
        setMessage('✅ クラスを登録しました！');
      }
      resetLessonForm();
      fetchLessons();
    } catch (error: any) {
      setMessage(`エラー: ${error.message}`);
    }
    setLoading(false);
  };

  const handleLessonDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    await supabase.from('reservations').delete().eq('lesson_id', id);
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) alert(`削除エラー: ${error.message}`);
    else { setMessage('🗑️ クラスを削除しました'); fetchLessons(); }
  };

  const handleLessonEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    const formatForInput = (isoString: string) => isoString ? new Date(isoString).toISOString().slice(0, 16) : '';
    setLessonFormData({
      title: lesson.title,
      instructor_name: lesson.instructor_name,
      start_time: formatForInput(lesson.start_time),
      end_time: formatForInput(lesson.end_time),
      capacity: lesson.capacity,
      difficulty_level: lesson.difficulty_level,
      description: lesson.description || '',
      type: lesson.type || 'normal',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetLessonForm = () => {
    setEditingId(null);
    setLessonFormData({ title: '', instructor_name: '', start_time: '', end_time: '', capacity: 15, difficulty_level: '★', description: '', type: 'normal' });
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setMessage('同期中...');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) setMessage(`同期エラー: ${data.error}`);
      else { setMessage(`✅ ${data.message}`); fetchLessons(); }
    } catch (err) { setMessage('同期に失敗しました'); }
    setSyncLoading(false);
  };

  const openReservationModal = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedUserIdToReserve('');
    setUserSearchTerm(''); 
    setReserveMode('member');
    setGuestFormData({ full_name: '', phone: '', email: '' });
    setReservationModalOpen(true);
  };

  const handleManualReserve = async () => {
    if (!selectedLesson) return;
    setLoading(true);
    let targetUserId = selectedUserIdToReserve;
    try {
      if (reserveMode === 'guest') {
        if (!guestFormData.full_name) { alert('お名前は必須です'); setLoading(false); return; }
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: guestFormData.full_name, phone: guestFormData.phone, email: guestFormData.email || undefined, tags: ['ゲスト'] }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        targetUserId = data.user.id;
        await fetchUsers();
      }
      if (!targetUserId) { alert('ユーザーを選択してください'); setLoading(false); return; }
      
      const lessonWithReservations = selectedLesson as any;
      const alreadyReserved = lessonWithReservations.reservations?.some((r: any) => r.user_id === targetUserId);
      if (alreadyReserved) { alert('このユーザーは既にこのレッスンを予約しています。'); setLoading(false); return; }

      const { error } = await supabase.from('reservations').insert([{ lesson_id: selectedLesson.id, user_id: targetUserId, status: 'confirmed' }]);
      if (error) alert(`予約追加エラー: ${error.message}`);
      else { alert('予約を追加しました'); await fetchLessons(); setReservationModalOpen(false); }
    } catch (err: any) { alert(`エラー: ${err.message}`); }
    setLoading(false);
  };

  const handleReservationCancel = async (reservationId: string) => {
    if (!confirm('この予約をキャンセル（削除）しますか？')) return;
    const { error } = await supabase.from('reservations').delete().eq('id', reservationId);
    if (error) alert(`キャンセル失敗: ${error.message}`);
    else { alert('予約をキャンセルしました'); await fetchLessons(); setReservationModalOpen(false); }
  };

  const filteredUsers = users.filter(u => {
    if (!userSearchTerm) return false;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.member_number?.toString().includes(searchLower) ||
      u.phone?.includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower)
    );
  });

  // --- ユーザー管理機能 ---
  const openUserModal = (user?: Profile) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({ 
        email: user.email, 
        full_name: user.full_name, 
        phone: user.phone || '', 
        training_status: user.training_status || '未受講', 
        tags: user.tags ? user.tags.join(', ') : '' 
      });
    } else {
      setEditingUser(null);
      setUserFormData({ email: '', full_name: '', phone: '', training_status: '未受講', tags: '' });
      setCreatedPassword('');
    }
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.full_name) return;
    setLoading(true);
    const tagsArray = userFormData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
    const payload = { ...userFormData, tags: tagsArray };
    try {
      let res;
      if (editingUser) {
        res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingUser.id, ...payload }) });
      } else {
        res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!editingUser) { setCreatedPassword(data.tempPassword); setMessage('✅ ユーザーを作成しました'); }
      else { setMessage('✅ ユーザー情報を更新しました'); setUserModalOpen(false); }
      fetchUsers();
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const handleUserDelete = async (id: string) => {
    if (!confirm('本当にこのユーザーを削除しますか？')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage('🗑️ ユーザーを削除しました');
      fetchUsers();
    } catch (err: any) { alert(`削除失敗: ${err.message}`); }
  };

  // --- お知らせ管理機能 ---
  
  // ★追加: お知らせモーダルを開く関数（新規・編集共通）
  const openAnnouncementModal = (ann?: Announcement) => {
    if (ann) {
      setEditingAnnouncementId(ann.id);
      setAnnouncementForm({
        title: ann.title,
        content: ann.content,
        target_tags: ann.target_tags ? ann.target_tags.join(', ') : '',
        priority: ann.priority,
        link_url: ann.link_url || ''
      });
    } else {
      setEditingAnnouncementId(null);
      setAnnouncementForm({ title: '', content: '', target_tags: '', priority: 0, link_url: '' });
    }
    setAnnouncementModalOpen(true);
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    setLoading(true);
    const tagsArray = announcementForm.target_tags.split(',').map(t => t.trim()).filter(t => t !== '');
    
    const payload = { 
      title: announcementForm.title, 
      content: announcementForm.content, 
      target_tags: tagsArray, 
      priority: announcementForm.priority || 0, 
      link_url: announcementForm.link_url || null 
    };

    try {
      if (editingAnnouncementId) {
        // 更新処理
        const { error } = await supabase.from('announcements').update(payload).eq('id', editingAnnouncementId);
        if (error) throw error;
        setMessage('✅ お知らせを更新しました');
      } else {
        // 新規登録
        const { error } = await supabase.from('announcements').insert([payload]);
        if (error) throw error;
        setMessage('✅ お知らせを投稿しました');
      }
      setAnnouncementModalOpen(false); // モーダルを閉じる
      fetchAnnouncements();
    } catch (error: any) {
      alert(`エラー: ${error.message}`);
    }
    setLoading(false);
  };

  const handleAnnouncementDelete = async (id: string) => {
    if (!confirm('このお知らせを削除しますか？')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) alert('削除失敗'); else { setMessage('🗑️ お知らせを削除しました'); fetchAnnouncements(); }
  };

  if (initLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center">
        <div className="w-32 animate-pulse">
          <img src="/logo.png" alt="Loading..." className="w-full h-auto object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] p-4 sm:p-8 font-sans text-stone-700 md:pl-[332px]">
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* メニューヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-stone-200 gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-700">管理者ダッシュボード</h1>
            <p className="text-sm text-stone-500">スタジオの運営管理を行います</p>
          </div>
          <Link 
            href="/admin/checkin" 
            className="bg-stone-800 text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-[#EEA51A] transition flex items-center gap-2 text-sm"
          >
            📋 予約・チェックイン画面へ
          </Link>
        </div>

        {/* タブナビゲーション */}
        <div className="flex gap-2 border-b-2 border-stone-200 pb-1 overflow-x-auto text-base">
          <button 
            onClick={() => setActiveTab('lessons')}
            className={`px-6 py-2 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'lessons' ? 'bg-[#EEA51A] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
          >
            予約管理
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'users' ? 'bg-[#EEA51A] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
          >
            ユーザー管理
          </button>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={`px-6 py-2 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'announcements' ? 'bg-[#EEA51A] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
          >
            お知らせ管理
          </button>
        </div>

        {/* タブ1: 予約管理 */}
        {activeTab === 'lessons' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Googleカレンダー連携 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                    📅 Googleカレンダー連携
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                      <p className="font-bold text-blue-800 text-[11px] mb-2 flex items-center gap-1">
                        <span className="text-base">🕒</span> 時間帯の箇所に入れる（通常クラス等）
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex flex-col gap-1">
                          <code className="bg-white px-2 py-1 rounded border border-blue-200 text-blue-600 text-[11px] font-bold">
                            [★2][Tetsu][10]パワーヨガ
                          </code>
                          <span className="text-[10px] text-stone-500 ml-1">※ [レベル][講師][定員]タイトル</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <code className="bg-white px-2 py-1 rounded border border-blue-200 text-blue-600 text-[11px] font-bold">
                            [Tetsu]RYT200養成講座
                          </code>
                          <span className="text-[10px] text-stone-500 ml-1">※ [講師]タイトル（定員なし・予約不可）</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                      <p className="font-bold text-emerald-800 text-[11px] mb-2 flex items-center gap-1">
                        <span className="text-base">☀️</span> 日の予定に入れる（パーソナル等）
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex flex-col gap-1">
                          <code className="bg-white px-2 py-1 rounded border border-emerald-200 text-emerald-600 text-[11px] font-bold">
                            [Tetsu]パーソナル
                          </code>
                          <span className="text-[10px] text-stone-500 ml-1">※ [講師]タイトル（日程調整用として表示）</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 leading-relaxed mt-1 font-medium bg-white/50 p-2 rounded-lg">
                          カレンダー最上部の「終日」欄に入れると、HP上では「日程調整（パーソナル）」枠として表示されます。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncLoading}
                  className="w-full md:w-auto whitespace-nowrap bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg hover:shadow-blue-200"
                >
                  {syncLoading ? (
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Googleカレンダーと同期
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* レッスンリスト */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-700 mb-4 flex justify-between items-center">
                同期済みのクラス一覧
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lessons.map((lesson) => {
                  const reservationCount = lesson.reservations?.length || 0;
                  return (
                    <div key={lesson.id} className="p-4 rounded-xl border border-stone-100 bg-[#FDFBF7] shadow-sm flex flex-col gap-3 relative">
                      {/* 上段 */}
                      <div>
                         <div className="text-sm font-bold text-[#EEA51A] mb-1">
                           {new Date(lesson.start_time).toLocaleDateString()} {new Date(lesson.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </div>
                         <h3 className="font-bold text-lg text-stone-800 mb-2 truncate">{lesson.title}</h3>
                         <div className="flex items-center gap-3 text-xs text-stone-500">
                            <span className="whitespace-nowrap flex items-center gap-1">👤 {lesson.instructor_name}</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-stone-200">
                               予約: {reservationCount}/{lesson.capacity}
                            </span>
                         </div>
                      </div>

                      {/* 下段：ボタンエリア */}
                      <div className="grid grid-cols-2 gap-3 mt-auto pt-2 border-t border-stone-200/50">
                        <button 
                          onClick={() => openReservationModal(lesson)} 
                          className="py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-sm w-full"
                        >
                          予約管理
                        </button>
                        <button 
                          onClick={() => handleLessonDelete(lesson.id)} 
                          className="py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition shadow-sm w-full"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* タブ2: ユーザー管理 */}
        {activeTab === 'users' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 animate-fadeIn">
            <div className="flex justify-end items-center mb-6">
              <button 
                type="button"
                onClick={() => openUserModal()}
                className="bg-[#EEA51A] text-white px-4 py-2 rounded-full font-bold shadow hover:bg-[#D99000] text-sm"
              >
                + 新規ユーザー登録
              </button>
            </div>
            
            {/* SP用: カード形式 */}
            <div className="md:hidden space-y-4">
              {users.map((u) => (
                <div key={u.id} className="bg-[#FDFBF7] p-4 rounded-xl border border-stone-100 shadow-sm relative flex flex-col gap-3">
                  {/* 上段 */}
                  <div>
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-200">No.{u.member_number}</span>
                     </div>
                     <h3 className="font-bold text-lg text-stone-800 mt-1 flex items-center gap-2 flex-wrap">
                       {u.full_name || 'ゲスト'}
                       {/* バッジ類 */}
                       {u.line_user_id && <span className="text-[#06C755] bg-[#06C755]/10 px-1.5 py-0.5 rounded text-[10px]">LINE</span>}
                       {u.training_status === '受講済' && <span className="text-white bg-green-500 px-1.5 py-0.5 rounded text-[10px]">受講済</span>}
                       {u.training_status === '受講中' && <span className="text-white bg-blue-500 px-1.5 py-0.5 rounded text-[10px]">受講中</span>}
                       {u.tags && u.tags.length > 0 && u.tags.map(tag => (
                         <span key={tag} className="text-stone-500 bg-white px-2 py-0.5 rounded text-[10px] border border-stone-100">#{tag}</span>
                       ))}
                     </h3>
                     <div className="text-sm text-stone-500 mt-2 space-y-0.5">
                       {u.email && !u.email.includes('@dummy.local') && <p className="truncate">✉️ {u.email}</p>}
                       {u.phone && <p>📞 {u.phone}</p>}
                     </div>
                  </div>

                  {/* 下段：ボタンエリア */}
                  <div className="grid grid-cols-2 gap-3 mt-auto pt-2 border-t border-stone-200/50">
                      <button 
                        type="button"
                        onClick={() => openUserModal(u)} 
                        className="py-2 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition shadow-sm w-full"
                      >
                        編集
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleUserDelete(u.id)} 
                        className="py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition shadow-sm w-full"
                      >
                        削除
                      </button>
                   </div>
                </div>
              ))}
            </div>

            {/* PC用: テーブル形式 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-stone-500 border-b border-stone-200">
                    <th className="p-4 font-medium w-2/12">会員No.</th>
                    <th className="p-4 font-medium w-8/12">お名前 / 連絡先</th>
                    <th className="p-4 font-medium w-2/12 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FDFBF7] transition align-top">
                      <td className="p-4 text-base font-mono text-stone-500">
                        {u.member_number}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-stone-700 flex items-center gap-2 text-base flex-wrap">
                          {u.full_name || 'ゲスト'}
                          {/* LINE連携バッジ */}
                          {u.line_user_id && (
                            <span className="text-[#06C755] bg-[#06C755]/10 px-1.5 py-0.5 rounded text-xs border border-[#06C755]/20" title="LINE連携済み">
                              LINE
                            </span>
                          )}
                          {/* 養成講座ステータスバッジ */}
                          {u.training_status === '受講済' && (
                            <span className="text-white bg-green-500 px-1.5 py-0.5 rounded text-xs">受講済</span>
                          )}
                          {u.training_status === '受講中' && (
                            <span className="text-white bg-blue-500 px-1.5 py-0.5 rounded text-xs">受講中</span>
                          )}
                          {/* タグ */}
                          {u.tags && u.tags.length > 0 && u.tags.map(tag => (
                            <span key={tag} className="text-[#EEA51A] bg-[#FFF8E1] px-1.5 py-0.5 rounded text-xs border border-[#FCEFCF]">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-stone-400 mt-1">
                          {u.email && !u.email.includes('@dummy.local') && <div>✉️ {u.email}</div>}
                          {u.phone && <div>📞 {u.phone}</div>}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col gap-2 justify-center items-end">
                            <button type="button" onClick={() => openUserModal(u)} className="w-16 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition shadow-sm">編集</button>
                            <button type="button" onClick={() => handleUserDelete(u.id)} className="w-16 py-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition shadow-sm">削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* タブ3: お知らせ管理 */}
        {activeTab === 'announcements' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 animate-fadeIn">
            {/* 上部: 新規登録ボタン */}
            <div className="flex justify-end items-center mb-6">
              <button 
                type="button"
                onClick={() => openAnnouncementModal()}
                className="bg-[#EEA51A] text-white px-4 py-2 rounded-full font-bold shadow hover:bg-[#D99000] text-sm"
              >
                + 新規お知らせ投稿
              </button>
            </div>

            {/* お知らせ一覧 */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-stone-700 mb-4">📋 配信中のお知らせ</h2>
              {announcements.length === 0 ? (
                <p className="text-stone-400 text-sm">お知らせはありません</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => {
                    const targetCount = (!ann.target_tags || ann.target_tags.length === 0)
                      ? users.length 
                      : users.filter(u => u.tags?.some(t => ann.target_tags.includes(t))).length;

                    return (
                      <div key={ann.id} className="bg-[#FDFBF7] p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col gap-3">
                        {/* 上段 */}
                        <div>
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-sm font-bold text-stone-600">
                                {new Date(ann.created_at).toLocaleDateString()}
                             </span>
                             <span className="text-[10px] font-bold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">
                               配信対象: {targetCount}名
                             </span>
                           </div>

                           <h3 className="font-bold text-lg text-stone-800 mb-1">{ann.title}</h3>
                           <p className="text-sm text-stone-500 whitespace-pre-wrap mb-2 line-clamp-3">{ann.content}</p>
                           {ann.link_url && (
                             <div className="text-xs text-[#EEA51A] underline mb-2 truncate">
                               <a href={ann.link_url} target="_blank" rel="noopener noreferrer">
                                 {ann.link_url}
                               </a>
                             </div>
                           )}
                           <div className="flex gap-1 flex-wrap">
                             {ann.target_tags && ann.target_tags.length > 0 ? (
                               ann.target_tags.map(tag => (
                                 <span key={tag} className="text-xs bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-500">
                                   {tag}
                                 </span>
                               ))
                             ) : (
                               <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-400">全員</span>
                             )}
                           </div>
                        </div>

                        {/* 下段: ボタンエリア */}
                        <div className="grid grid-cols-2 gap-3 mt-auto pt-2 border-t border-stone-200/50">
                          <button 
                            type="button"
                            onClick={() => openAnnouncementModal(ann)}
                            className="py-2 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition shadow-sm w-full"
                          >
                            編集
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleAnnouncementDelete(ann.id)}
                            className="py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition shadow-sm w-full"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* モーダル群 (変更なし) */}
        {reservationModalOpen && selectedLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             {/* ...予約管理モーダルの中身... */}
             <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-stone-700">{selectedLesson.title}</h3>
                  <p className="text-sm text-stone-500">
                    {new Date(selectedLesson.start_time).toLocaleString()}
                  </p>
                </div>
                <button type="button" onClick={() => setReservationModalOpen(false)} className="text-stone-400 hover:text-stone-600 text-2xl">×</button>
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-stone-600 mb-3 border-b pb-2">
                  予約済みメンバー ({(selectedLesson as any).reservations?.length || 0}名)
                </h4>
                {(selectedLesson as any).reservations && (selectedLesson as any).reservations.length > 0 ? (
                  <ul className="space-y-2">
                    {(selectedLesson as any).reservations.map((res: any) => (
                      <li key={res.id} className="flex justify-between items-center bg-[#FDFBF7] p-3 rounded-xl border border-stone-100">
                        <div>
                          <p className="font-bold text-stone-700">{res.profiles?.full_name || '削除されたユーザー'}</p>
                          <p className="text-xs text-stone-400">{res.profiles?.email}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleReservationCancel(res.id)}
                          className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full border border-red-200 transition"
                        >
                          キャンセル
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone-400 text-sm italic">予約はありません</p>
                )}
              </div>

              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                <h4 className="font-bold text-stone-600 mb-4 text-sm flex items-center gap-2">
                  <span>➕ 手動で予約を追加</span>
                </h4>

                <div className="flex bg-stone-200 p-1 rounded-xl mb-4">
                  <button
                    onClick={() => setReserveMode('member')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${reserveMode === 'member' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
                  >
                    登録済み会員
                  </button>
                  <button
                    onClick={() => setReserveMode('guest')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${reserveMode === 'guest' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
                  >
                    新規ゲスト (電話等)
                  </button>
                </div>

                {reserveMode === 'member' ? (
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 p-3 text-sm border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none bg-white font-medium"
                      value={selectedUserIdToReserve}
                      onChange={(e) => setSelectedUserIdToReserve(e.target.value)}
                    >
                      <option value="">会員を選択...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.member_number}: {u.full_name} {u.phone ? `(${u.phone})` : ''}
                        </option>
                      ))}
                    </select>
                    <button 
                      onClick={handleManualReserve}
                      disabled={!selectedUserIdToReserve || loading}
                      className="bg-stone-800 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#EEA51A] disabled:opacity-50 transition-colors"
                    >
                      追加
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="お名前 (必須)"
                        className="p-3 text-sm border border-stone-200 rounded-xl focus:border-[#EEA51A] outline-none bg-white font-medium"
                        value={guestFormData.full_name}
                        onChange={e => setGuestFormData({...guestFormData, full_name: e.target.value})}
                      />
                      <input
                        placeholder="電話番号"
                        className="p-3 text-sm border border-stone-200 rounded-xl focus:border-[#EEA51A] outline-none bg-white font-medium"
                        value={guestFormData.phone}
                        onChange={e => setGuestFormData({...guestFormData, phone: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={handleManualReserve}
                      disabled={!guestFormData.full_name || loading}
                      className="w-full bg-[#EEA51A] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#D99000] disabled:opacity-50 shadow-md transition-all active:scale-95"
                    >
                      ゲストとして登録・予約を確定
                    </button>
                    <p className="text-[9px] text-stone-400 text-center">※ 自動的に「ゲスト」タグ付きのユーザーとして登録されます</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ユーザー登録・編集モーダル (変更なし) */}
        {userModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             {/* ...ユーザーモーダルの中身... */}
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold text-stone-700 mb-6">
                {editingUser ? 'ユーザー編集' : '新規ユーザー登録'}
              </h3>
              
              {createdPassword ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 p-4 rounded-xl text-green-800">
                    <p className="font-bold">✅ ユーザーを作成しました</p>
                    <p className="text-sm mt-2">以下の仮パスワードをユーザーに伝えてください。</p>
                    <div className="mt-2 text-xl font-mono bg-white p-2 rounded border border-green-200 select-all">
                      {createdPassword}
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => { setUserModalOpen(false); setCreatedPassword(''); }}
                    className="w-full bg-stone-800 text-white font-bold py-3 rounded-xl"
                  >
                    閉じる
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">お名前 <span className="text-red-500">*</span></label>
                    <input
                      required
                      value={userFormData.full_name}
                      onChange={(e) => setUserFormData({...userFormData, full_name: e.target.value})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">Email</label>
                    <input
                      type="email"
                      value={userFormData.email && !userFormData.email.includes('@dummy.local') ? userFormData.email : ''}
                      onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                      placeholder="未入力の場合は自動生成されます"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">電話番号</label>
                    <input
                      type="tel"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                      placeholder="090-1234-5678"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                    />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">養成講座ステータス</label>
                      <select
                        value={userFormData.training_status}
                        onChange={(e) => setUserFormData({...userFormData, training_status: e.target.value})}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                      >
                        <option value="未受講">未受講</option>
                        <option value="受講中">受講中</option>
                        <option value="受講済">受講済</option>
                      </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">ユーザータグ (カンマ区切り)</label>
                    <input
                      value={userFormData.tags}
                      onChange={(e) => setUserFormData({...userFormData, tags: e.target.value})}
                      placeholder="例: 体験, キャンペーン, 会員"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setUserModalOpen(false)}
                      className="flex-1 bg-stone-100 text-stone-500 font-bold py-3 rounded-xl hover:bg-stone-200"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#EEA51A] text-white font-bold py-3 rounded-xl hover:bg-[#D99000] disabled:opacity-50"
                    >
                      {loading ? '処理中...' : editingUser ? '更新する' : '登録する'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ★追加: お知らせ登録・編集モーダル */}
        {announcementModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold text-stone-700 mb-6">
                {editingAnnouncementId ? 'お知らせ編集' : '新規お知らせ投稿'}
              </h3>
              
              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">タイトル</label>
                  <input
                    required
                    placeholder="例: 年末年始の営業について"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">本文</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="お知らせの内容を入力..."
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">リンクURL (任意)</label>
                  <input
                    placeholder="https://example.com/campaign"
                    value={announcementForm.link_url}
                    onChange={(e) => setAnnouncementForm({...announcementForm, link_url: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">対象ユーザータグ (カンマ区切り)</label>
                  <input
                    placeholder="例: 体験, 会員 (空欄なら全員)"
                    value={announcementForm.target_tags}
                    onChange={(e) => setAnnouncementForm({...announcementForm, target_tags: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setAnnouncementModalOpen(false)}
                    className="flex-1 bg-stone-100 text-stone-500 font-bold py-3 rounded-xl hover:bg-stone-200"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#EEA51A] text-white font-bold py-3 rounded-xl hover:bg-[#D99000] disabled:opacity-50"
                  >
                    {loading ? '処理中...' : editingAnnouncementId ? '更新する' : '投稿する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {message && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-xl font-bold animate-bounce z-50 ${message.includes('エラー') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#FFF8E1] text-[#EEA51A] border border-[#FCEFCF]'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// デフォルトエクスポートするコンポーネント (Suspenseでラップ)
export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center">
        <div className="w-32 animate-pulse">
          <img src="/logo.png" alt="Loading..." className="w-full h-auto object-contain" />
        </div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}