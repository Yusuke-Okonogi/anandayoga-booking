import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ユーザー作成 (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ★追加: tags
    const { email, full_name, plan_id, notes, training_status, phone, tags } = body;

    const registerEmail = email || `no-email-${Date.now()}-${Math.random().toString(36).slice(-4)}@dummy.local`;
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: registerEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) throw createError;

    // プロフィール更新
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name,
        plan_id: plan_id || null,
        notes: notes || null,
        training_status: training_status || '未受講',
        phone: phone || null,
        email: email || null,
        tags: tags || [] // ★追加: タグ配列
      })
      .eq('id', userData.user.id);

    if (profileError) throw profileError;

    return NextResponse.json({ 
      success: true, 
      user: userData.user,
      tempPassword 
    });

  } catch (error: any) {
    console.error('Create Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ユーザー削除 (DELETE)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    await supabaseAdmin.from('reservations').delete().eq('user_id', id);
    await supabaseAdmin.from('user_tickets').delete().eq('user_id', id);
    await supabaseAdmin.from('profiles').delete().eq('id', id);
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ユーザー情報更新 (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // ★追加: tags
    const { id, full_name, email, plan_id, notes, training_status, phone, tags } = body;

    if (email && !email.includes('@dummy.local')) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { email });
      if (authError) throw authError;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name,
        plan_id: plan_id || null,
        notes: notes || null,
        training_status: training_status || '未受講',
        phone: phone || null,
        email: email || null,
        tags: tags || [] // ★追加
      })
      .eq('id', id);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}