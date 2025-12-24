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

type Plan = { id: string; name: string; };
type Ticket = { id: string; ticket_name: string; remaining_count: number; expires_at: string | null; };
type Announcement = { id: string; title: string; content: string; target_tags: string[]; priority: number; created_at: string; link_url?: string; };
type Profile = { id: string; member_number: number; email: string; full_name: string; phone: string | null; plan_id: string | null; plans: Plan | null; user_tickets: Ticket[]; line_user_id: string | null; notes: string | null; training_status: string | null; tags: string[] | null; };

// 内部コンポーネント: 実際のコンテンツ
function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'lessons' | 'users' | 'plans' | 'announcements'>('lessons');
  
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
  const [userFormData, setUserFormData] = useState({ email: '', full_name: '', phone: '', plan_id: '', notes: '', training_status: '未受講', tags: '' });
  const [createdPassword, setCreatedPassword] = useState('');

  const [ticketUserId, setTicketUserId] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState({ ticket_name: '5回券', remaining_count: 5, expires_at: '' });

  // --- プラン管理用 ---
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newPlanName, setNewPlanName] = useState('');

  // --- お知らせ管理用 ---
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', target_tags: '', priority: 0, link_url: '' });

  // URLクエリパラメータからタブを切り替える処理
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['lessons', 'users', 'plans', 'announcements'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return; 
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        alert('管理者権限がありません。トップページへ移動します。');
        router.push('/');
      } else {
        Promise.all([fetchLessons(), fetchPlans(), fetchUsers(), fetchAnnouncements()]).then(() => {
          setInitLoading(false);
        });
      }
    };
    checkAdmin();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'plans') fetchPlans();
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
    const { data } = await supabase.from('profiles').select(`*, plans (id, name), user_tickets (*)`).order('member_number', { ascending: true });
    if (data) setUsers(data as any);
  };
  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('*').order('created_at', { ascending: true });
    if (data) setPlans(data);
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
      setUserFormData({ email: user.email, full_name: user.full_name, phone: user.phone || '', plan_id: user.plan_id || '', notes: user.notes || '', training_status: user.training_status || '未受講', tags: user.tags ? user.tags.join(', ') : '' });
    } else {
      setEditingUser(null);
      setUserFormData({ email: '', full_name: '', phone: '', plan_id: '', notes: '', training_status: '未受講', tags: '' });
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

  const handleTicketAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketUserId) return;
    const { error } = await supabase.from('user_tickets').insert([{ user_id: ticketUserId, ticket_name: ticketForm.ticket_name, remaining_count: ticketForm.remaining_count, expires_at: ticketForm.expires_at || null }]);
    if (error) alert(`チケット追加エラー: ${error.message}`);
    else { setMessage('✅ 回数券を追加しました'); setTicketUserId(null); fetchUsers(); }
  };

  const handleTicketDelete = async (ticketId: string) => {
    if(!confirm('この回数券を削除しますか？')) return;
    const { error } = await supabase.from('user_tickets').delete().eq('id', ticketId);
    if(error) alert('削除失敗'); else { setMessage('🗑️ 回数券を削除しました'); fetchUsers(); }
  }

  // --- プラン管理機能 ---
  const handlePlanAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    const { error } = await supabase.from('plans').insert([{ name: newPlanName }]);
    if (error) alert(`追加エラー: ${error.message}`); else { setMessage('✅ プランを追加しました'); setNewPlanName(''); fetchPlans(); }
  };

  const handlePlanDelete = async (id: string) => {
    if (!confirm('このプランを削除しますか？')) return;
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) alert(`削除エラー: ${error.message}`); else { setMessage('🗑️ プランを削除しました'); fetchPlans(); }
  };

  // --- お知らせ管理機能 ---
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    setLoading(true);
    const tagsArray = announcementForm.target_tags.split(',').map(t => t.trim()).filter(t => t !== '');
    const { error } = await supabase.from('announcements').insert([{ title: announcementForm.title, content: announcementForm.content, target_tags: tagsArray, priority: announcementForm.priority || 0, link_url: announcementForm.link_url || null }]);
    if (error) alert(`投稿エラー: ${error.message}`); else { setMessage('✅ お知らせを投稿しました'); setAnnouncementForm({ title: '', content: '', target_tags: '', priority: 0, link_url: '' }); fetchAnnouncements(); }
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
    <div className="min-h-screen bg-[#F7F5F0] p-4 sm:p-8 font-sans text-stone-700">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
            onClick={() => setActiveTab('plans')}
            className={`px-6 py-2 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'plans' ? 'bg-[#EEA51A] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
          >
            プラン管理
          </button>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={`px-6 py-2 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'announcements' ? 'bg-[#EEA51A] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
          >
            お知らせ管理
          </button>
        </div>

        {/* タブ1: 予約管理 (レッスン管理) */}
        {activeTab === 'lessons' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Googleカレンダー同期 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                    📅 Googleカレンダー連携
                  </h2>
                  <div className="text-sm text-stone-500">
                    <p className="font-bold mb-1 text-xs">タイトル入力例:</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <code className="bg-white px-2 py-1 rounded border border-blue-200 text-xs">[★2][Tetsu][10]パワーヨガ</code>
                      <code className="bg-white px-2 py-1 rounded border border-blue-200 text-xs">[Tetsu]パーソナル</code>
                      <code className="bg-white px-2 py-1 rounded border border-blue-200 text-xs">[Tetsu]RYT200養成講座</code>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncLoading}
                  className="w-full md:w-auto whitespace-nowrap bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-md"
                >
                  {syncLoading ? (
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    'Googleカレンダーと同期'
                  )}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* 左側：登録フォーム */}
              <div className={`bg-white p-8 rounded-3xl shadow-sm border-t-4 ${editingId ? 'border-orange-500' : 'border-[#EEA51A]'}`}>
                <h1 className={`text-2xl font-bold mb-6 flex justify-between items-center ${editingId ? 'text-orange-600' : 'text-[#EEA51A]'}`}>
                  {editingId ? '✏️ クラス編集' : '🛠 クラス登録'}
                  {editingId && (
                    <button type="button" onClick={resetLessonForm} className="text-sm text-stone-400 font-normal hover:text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                      キャンセル
                    </button>
                  )}
                </h1>

                <form onSubmit={handleLessonSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">クラス種別</label>
                    <select
                      name="type"
                      value={lessonFormData.type || 'normal'}
                      onChange={handleLessonChange}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                    >
                      <option value="normal">通常クラス</option>
                      <option value="personal">パーソナル (日程調整)</option>
                      <option value="training">養成講座 (予約不可/表示のみ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">クラス名</label>
                    <input
                      name="title"
                      required
                      value={lessonFormData.title}
                      onChange={handleLessonChange}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">インストラクター名</label>
                    <input
                      name="instructor_name"
                      required
                      value={lessonFormData.instructor_name}
                      onChange={handleLessonChange}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">開始日時</label>
                      <input
                        type="datetime-local"
                        name="start_time"
                        required
                        value={lessonFormData.start_time}
                        onChange={handleLessonChange}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">終了日時</label>
                      <input
                        type="datetime-local"
                        name="end_time"
                        required
                        value={lessonFormData.end_time}
                        onChange={handleLessonChange}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">定員</label>
                      <input
                        type="number"
                        name="capacity"
                        value={lessonFormData.capacity}
                        onChange={handleLessonChange}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">レベル</label>
                      <select
                        name="difficulty_level"
                        value={lessonFormData.difficulty_level}
                        onChange={handleLessonChange}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                      >
                        <option value="★">★ (やさしい)</option>
                        <option value="★★">★★ (普通)</option>
                        <option value="★★★">★★★ (ハード)</option>
                        <option value="オールレベルのやさしいクラス">オールレベルのやさしいクラス</option>
                        <option value="中級クラス">中級クラス</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">詳細メモ</label>
                    <textarea
                      name="description"
                      rows={3}
                      value={lessonFormData.description}
                      onChange={handleLessonChange}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white font-bold py-4 rounded-xl transition disabled:opacity-50 shadow-md text-lg ${
                      editingId 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-[#EEA51A] hover:bg-[#D99000]'
                    }`}
                  >
                    {loading ? '処理中...' : editingId ? '更新を保存' : 'クラスを追加'}
                  </button>
                </form>
              </div>

              {/* 右側：レッスンリスト */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 h-full max-h-[800px] overflow-y-auto">
                <h2 className="text-xl font-bold text-stone-700 mb-4 flex justify-between items-center">
                  今後のクラス
                  <button type="button" onClick={fetchLessons} className="text-sm text-stone-400 hover:text-[#EEA51A]">↻ 更新</button>
                </h2>
                <div className="space-y-2">
                  {lessons.map((lesson) => {
                    const reservationCount = lesson.reservations?.length || 0;
                    
                    let borderClass = 'border-stone-100 hover:border-[#FCEFCF] bg-[#FDFBF7]';
                    let label = null;

                    if (lesson.type === 'personal') {
                      borderClass = 'border-indigo-100 hover:border-indigo-200 bg-indigo-50/50';
                      label = <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] border border-indigo-200">日程調整</span>;
                    } else if (lesson.type === 'training') {
                      borderClass = 'border-amber-100 hover:border-amber-200 bg-amber-50/50';
                      label = <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">予約不可</span>;
                    }

                    if (editingId === lesson.id) borderClass = 'border-orange-400 bg-orange-50';

                    return (
                      <div key={lesson.id} className={`p-3 rounded-xl border transition ${borderClass}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <div className="text-[10px] font-bold text-[#EEA51A] mb-0.5 flex items-center gap-2">
                              <span>{new Date(lesson.start_time).toLocaleDateString()} {new Date(lesson.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(lesson.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              {label}
                            </div>
                            <h3 className="font-bold text-stone-800 text-sm mb-1">{lesson.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-stone-500 flex-wrap">
                              <span>👤 {lesson.instructor_name}</span>
                              <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-mono font-bold">
                                {reservationCount}/{lesson.capacity}
                              </span>
                              {lesson.google_calendar_event_id && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px]">Google</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 w-32">
                            <div className="flex gap-1 w-full">
                              <button type="button" onClick={() => handleLessonEdit(lesson)} className="flex-1 p-1 text-xs text-stone-500 hover:text-blue-600 bg-white border border-stone-200 rounded text-center transition hover:bg-stone-50">編集</button>
                              <button type="button" onClick={() => handleLessonDelete(lesson.id)} className="flex-1 p-1 text-xs text-stone-500 hover:text-red-600 bg-white border border-stone-200 rounded text-center transition hover:bg-stone-50">削除</button>
                            </div>
                            <button 
                              type="button"
                              onClick={() => openReservationModal(lesson)}
                              className="w-full text-xs bg-stone-800 text-white py-1.5 rounded hover:bg-[#EEA51A] transition text-center"
                            >
                              予約管理
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* タブ2: ユーザー管理 */}
        {activeTab === 'users' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 animate-fadeIn">
            {/* ユーザー管理 (タイトル削除済み) */}
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
                <div key={u.id} className="bg-[#FDFBF7] p-4 rounded-xl border border-stone-100 shadow-sm relative">
                  <div className="mb-3">
                     <div className="flex justify-between items-start">
                        <span className="text-xs font-mono text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-100">No.{u.member_number}</span>
                     </div>
                     <h3 className="font-bold text-lg text-stone-700 mt-1 flex items-center gap-2 flex-wrap">
                        {u.full_name || 'ゲスト'}
                        {u.line_user_id && <span className="text-[#06C755] bg-[#06C755]/10 px-1.5 py-0.5 rounded text-[10px]">LINE</span>}
                     </h3>
                     <div className="text-sm text-stone-500 mt-1 space-y-0.5">
                       {u.email && !u.email.includes('@dummy.local') && <p className="truncate">✉️ {u.email}</p>}
                       {u.phone && <p>📞 {u.phone}</p>}
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                     {u.plans ? (
                        <span className="bg-[#FFF8E1] text-[#EEA51A] px-2 py-1 rounded text-xs font-bold border border-[#FCEFCF]">{u.plans.name}</span>
                     ) : (
                        <span className="bg-stone-100 text-stone-400 px-2 py-1 rounded text-xs">プラン未設定</span>
                     )}
                     
                     {u.training_status === '受講済' ? (
                        <span className="text-white bg-green-500 px-2 py-1 rounded text-xs">受講済</span>
                      ) : u.training_status === '受講中' ? (
                        <span className="text-white bg-blue-500 px-2 py-1 rounded text-xs">受講中</span>
                      ) : (
                        <span className="text-stone-400 bg-stone-100 px-2 py-1 rounded text-xs">未受講</span>
                      )}

                     {u.tags && u.tags.length > 0 && u.tags.map(tag => (
                        <span key={tag} className="text-stone-500 bg-white px-2 py-1 rounded text-xs border border-stone-100">#{tag}</span>
                      ))}
                  </div>

                  {/* 回数券セクション */}
                  <div className="bg-white p-3 rounded-lg border border-stone-100 mb-3">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-stone-400">回数券</span>
                       <button 
                          type="button"
                          onClick={() => setTicketUserId(ticketUserId === u.id ? null : u.id)}
                          className="text-xs text-[#EEA51A] font-bold"
                        >
                          {ticketUserId === u.id ? '閉じる' : '+ 追加'}
                        </button>
                     </div>
                     
                     {u.user_tickets.length > 0 ? (
                       <div className="space-y-1">
                         {u.user_tickets.map(t => (
                           <div key={t.id} className="flex justify-between items-center text-xs border-b border-stone-50 last:border-0 pb-1">
                             <span className="text-stone-600">{t.ticket_name} (残{t.remaining_count})</span>
                             <button type="button" onClick={() => handleTicketDelete(t.id)} className="text-red-300 hover:text-red-500">×</button>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-xs text-stone-300">なし</p>
                     )}

                     {ticketUserId === u.id && (
                        <div className="mt-2 pt-2 border-t border-stone-100 animate-fadeIn">
                          <form onSubmit={handleTicketAdd} className="space-y-2">
                            <input 
                              placeholder="名称" 
                              className="w-full p-2 text-xs border rounded bg-stone-50"
                              required
                              value={ticketForm.ticket_name}
                              onChange={e => setTicketForm({...ticketForm, ticket_name: e.target.value})}
                            />
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                placeholder="回数" 
                                className="w-16 p-2 text-xs border rounded bg-stone-50"
                                required
                                value={ticketForm.remaining_count}
                                onChange={e => setTicketForm({...ticketForm, remaining_count: Number(e.target.value)})}
                              />
                              <input 
                                type="date" 
                                className="flex-1 p-2 text-xs border rounded bg-stone-50"
                                value={ticketForm.expires_at}
                                onChange={e => setTicketForm({...ticketForm, expires_at: e.target.value})}
                              />
                            </div>
                            <button type="submit" className="w-full bg-[#EEA51A] text-white text-xs py-2 rounded font-bold">付与する</button>
                          </form>
                        </div>
                     )}
                  </div>
                  
                  {u.notes && (
                    <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded mb-3">
                      {u.notes}
                    </div>
                  )}

                  {/* SP用アクションボタン（大きく配置・縦並び） */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-stone-200">
                      <button 
                        type="button"
                        onClick={() => openUserModal(u)} 
                        className="py-2.5 text-sm font-bold text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition shadow-sm w-full"
                      >
                        編集
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleUserDelete(u.id)} 
                        className="py-2.5 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition shadow-sm w-full"
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
                    <th className="p-4 font-medium w-1/12">会員No.</th>
                    <th className="p-4 font-medium w-3/12">お名前 / 連絡先</th>
                    <th className="p-4 font-medium w-2/12">プラン・状態</th>
                    <th className="p-4 font-medium w-3/12">回数券</th>
                    <th className="p-4 font-medium w-2/12">備考</th>
                    <th className="p-4 font-medium w-1/12 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FDFBF7] transition align-top">
                      <td className="p-4 text-base font-mono text-stone-500">
                        {u.member_number}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-stone-700 flex items-center gap-2 text-base">
                          {u.full_name || 'ゲスト'}
                          {u.line_user_id && (
                            <span className="text-[#06C755] bg-[#06C755]/10 px-1.5 py-0.5 rounded text-xs border border-[#06C755]/20" title="LINE連携済み">
                              LINE
                            </span>
                          )}
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
                      <td className="p-4">
                        <div className="mb-2">
                          {u.plans ? (
                            <span className="bg-[#FFF8E1] text-[#EEA51A] px-2 py-1 rounded text-sm font-bold border border-[#FCEFCF] block w-fit">
                              {u.plans.name}
                            </span>
                          ) : (
                            <span className="text-stone-400 text-sm block mb-1">プラン未設定</span>
                          )}
                        </div>
                        <div className="text-sm">
                          {u.training_status === '受講済' ? (
                            <span className="text-white bg-green-500 px-2 py-0.5 rounded-full">受講済</span>
                          ) : u.training_status === '受講中' ? (
                            <span className="text-white bg-blue-500 px-2 py-0.5 rounded-full">受講中</span>
                          ) : (
                            <span className="text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">未受講</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2 mb-3">
                          {u.user_tickets.map(t => (
                            <div key={t.id} className="flex justify-between items-center text-sm bg-white border border-stone-100 p-2 rounded-lg">
                              <span>
                                <span className="font-bold text-stone-600">{t.ticket_name}</span>
                                <span className="text-stone-400 ml-2">残: {t.remaining_count}回</span>
                                <span className="text-stone-400 ml-2">期限: {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : 'なし'}</span>
                              </span>
                              <button type="button" onClick={() => handleTicketDelete(t.id)} className="text-red-400 hover:text-red-600">×</button>
                            </div>
                          ))}
                          {u.user_tickets.length === 0 && <span className="text-sm text-stone-300">なし</span>}
                        </div>
                        
                        {ticketUserId === u.id ? (
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                            <p className="text-sm font-bold text-stone-500 mb-2">回数券を付与</p>
                            <form onSubmit={handleTicketAdd} className="space-y-2">
                              <input 
                                placeholder="名称 (例: 5回券)" 
                                className="w-full p-2 text-sm border rounded"
                                required
                                value={ticketForm.ticket_name}
                                onChange={e => setTicketForm({...ticketForm, ticket_name: e.target.value})}
                              />
                              <div className="flex gap-2">
                                <input 
                                  type="number" 
                                  placeholder="回数" 
                                  className="w-16 p-2 text-sm border rounded"
                                  required
                                  value={ticketForm.remaining_count}
                                  onChange={e => setTicketForm({...ticketForm, remaining_count: Number(e.target.value)})}
                                />
                                <input 
                                  type="date" 
                                  className="flex-1 p-2 text-sm border rounded"
                                  value={ticketForm.expires_at}
                                  onChange={e => setTicketForm({...ticketForm, expires_at: e.target.value})}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" className="bg-[#EEA51A] text-white text-sm px-3 py-2 rounded flex-1">付与</button>
                                <button type="button" onClick={() => setTicketUserId(null)} className="bg-stone-200 text-stone-500 text-sm px-3 py-2 rounded">中止</button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => setTicketUserId(u.id)}
                            className="text-sm text-[#EEA51A] border border-[#EEA51A] px-2 py-1 rounded-full hover:bg-[#FFF8E1]"
                          >
                            + 追加
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-sm text-stone-500 whitespace-pre-wrap">
                        {u.notes || '-'}
                      </td>
                      <td className="p-4 text-right">
                        {/* PC用操作ボタン（縦並び） */}
                        <div className="flex flex-col gap-1 justify-center items-end">
                            <button type="button" onClick={() => openUserModal(u)} className="w-16 py-1 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition">編集</button>
                            <button type="button" onClick={() => handleUserDelete(u.id)} className="w-16 py-1 text-xs font-bold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition">削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* タブ3: プラン管理 */}
        {activeTab === 'plans' && (
          <div className="grid md:grid-cols-2 gap-8 animate-fadeIn">
            {/* プラン追加フォーム */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 h-fit">
              <h2 className="text-xl font-bold text-stone-700 mb-4">✨ 新しいプランを追加</h2>
              <form onSubmit={handlePlanAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">プラン名</label>
                  <input
                    required
                    placeholder="例: マタニティヨガコース"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-stone-800 text-white font-bold py-3 rounded-xl hover:bg-[#EEA51A] transition shadow-md"
                >
                  プランを追加する
                </button>
              </form>
            </div>

            {/* プラン一覧 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-700 mb-4">📋 現在のプラン一覧</h2>
              <ul className="space-y-2">
                {plans.map((p) => (
                  <li key={p.id} className="flex justify-between items-center p-3 bg-[#FDFBF7] rounded-xl border border-stone-100">
                    <span className="font-bold text-stone-700">{p.name}</span>
                    <button 
                      type="button"
                      onClick={() => handlePlanDelete(p.id)}
                      className="text-stone-400 hover:text-red-500 p-2"
                      title="削除"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* タブ4: お知らせ管理 */}
        {activeTab === 'announcements' && (
          <div className="grid md:grid-cols-2 gap-8 animate-fadeIn">
            {/* 投稿フォーム */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 h-fit">
              <h2 className="text-xl font-bold text-stone-700 mb-4">🔔 お知らせを投稿</h2>
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
                    rows={4}
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#EEA51A] text-white font-bold py-3 rounded-xl hover:bg-[#D99000] transition shadow-md"
                >
                  投稿する
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-700 mb-4">📋 配信中のお知らせ</h2>
              {announcements.length === 0 ? (
                <p className="text-stone-400 text-sm">お知らせはありません</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="bg-[#FDFBF7] p-4 rounded-xl border border-stone-100 relative">
                      <h3 className="font-bold text-stone-700 mb-1 pr-6">{ann.title}</h3>
                      <p className="text-sm text-stone-500 whitespace-pre-wrap mb-2 line-clamp-3">{ann.content}</p>
                      {ann.link_url && (
                        <div className="text-xs text-[#EEA51A] underline mb-2 truncate max-w-[250px]">
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
                      <button 
                        type="button"
                        onClick={() => handleAnnouncementDelete(ann.id)}
                        className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ... (モーダル部分は省略せずそのまま使用) ... */}
        {reservationModalOpen && selectedLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             {/* ... (変更なし) ... */}
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

              {/* 予約者一覧 */}
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

              {/* 手動予約追加 */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <h4 className="font-bold text-stone-600 mb-3 text-sm">手動で予約を追加（代理予約）</h4>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 p-3 text-sm border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:outline-none"
                    value={selectedUserIdToReserve}
                    onChange={(e) => setSelectedUserIdToReserve(e.target.value)}
                  >
                    <option value="">ユーザーを選択...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.member_number}: {u.full_name} {u.phone ? `(${u.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={handleManualReserve}
                    disabled={!selectedUserIdToReserve}
                    className="bg-[#EEA51A] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#D99000] disabled:opacity-50"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ユーザー登録・編集モーダル */}
        {userModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                  
                  {/* Emailは任意化 */}
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

                  {/* 電話番号 */}
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">プラン</label>
                      <select
                        value={userFormData.plan_id}
                        onChange={(e) => setUserFormData({...userFormData, plan_id: e.target.value})}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                      >
                        <option value="">プランなし</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
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
                  </div>

                  {/* ユーザータグ入力欄 */}
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">ユーザータグ (カンマ区切り)</label>
                    <input
                      value={userFormData.tags}
                      onChange={(e) => setUserFormData({...userFormData, tags: e.target.value})}
                      placeholder="例: 体験, キャンペーン, 会員"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1 ml-1">備考</label>
                    <textarea
                      rows={3}
                      value={userFormData.notes}
                      onChange={(e) => setUserFormData({...userFormData, notes: e.target.value})}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-[#EEA51A] focus:bg-white focus:outline-none"
                      placeholder="メモを入力..."
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