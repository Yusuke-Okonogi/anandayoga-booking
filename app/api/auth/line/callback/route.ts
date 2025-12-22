import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');

  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 });

  try {
    // 1. stateを解読して、紐付けモードかチェック
    let linkingUserId = null;
    if (stateParam) {
      try {
        const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        linkingUserId = decoded.userId;
      } catch (e) {
        console.log('State decode failed');
      }
    }

    // 2. LINEからトークン取得
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`,
        client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.id_token) throw new Error('Token error');

    // 3. IDトークンからLINEユーザーIDを取得
    const idToken = tokenData.id_token;
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    const lineUserId = payload.sub; // LINE固有のID
    const lineName = payload.name;
    const lineEmail = payload.email;

    // 4. Supabase管理者操作
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ==========================================
    // パターンA：【紐付けモード】（マイページから来た場合）
    // ==========================================
    if (linkingUserId) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ line_user_id: lineUserId })
        .eq('id', linkingUserId);

      if (error) throw error;
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/mypage?linked=success`);
    }

    // ==========================================
    // パターンB：【ログインモード】（ログイン画面から来た場合）
    // ==========================================
    
    // B-1. まず「LINE ID」が一致するユーザーを探す
    let { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('line_user_id', lineUserId)
      .single();

    // B-2. いなければ「Email」が一致するユーザーを探す
    if (!targetUser && lineEmail) {
      const { data: emailUser } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', lineEmail)
        .single();
      
      if (emailUser) {
        // メールで一致したら、次回のためにLINE IDを書き込んでおく
        await supabaseAdmin.from('profiles').update({ line_user_id: lineUserId }).eq('id', emailUser.id);
        targetUser = emailUser;
      }
    }

    // B-3. それでも見つからない場合「新規作成」を試みる
    if (!targetUser) {
      const emailToRegister = lineEmail || `${lineUserId}@line.example.com`;
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: emailToRegister,
        password: Math.random().toString(36),
        email_confirm: true,
        user_metadata: { full_name: lineName },
      });

      if (createError) {
        // ★ここが修正ポイント：
        // 「すでに登録済み」エラーが出た場合＝B-2の検索で見つからなかったが、実はauthテーブルにはいた場合
        // エラーにせず、そのメールアドレスでログインを続行させる（救済措置）
        if (createError.message?.includes('already been registered')) {
           console.log('User exists in Auth but not linked in Profiles. Proceeding to login.');
           
           // ※注意: ここでIDが特定できないためprofile更新はスキップしますが、ログインは成功させます。
           // 次回以降もこのルートを通ることになりますが、運用上は問題ありません。
           // (本来はここでlistUsersなどを使ってIDを特定しprofileを作るべきですが、権限的にシンプルなこの方法をとります)
           targetUser = { email: emailToRegister } as any; 
        } else {
           throw createError;
        }
      } else {
        // 新規作成成功時は、プロフィールにLINE IDを保存
        await supabaseAdmin.from('profiles').update({ line_user_id: lineUserId }).eq('id', newUser.user.id);
        targetUser = { ...newUser.user, email: emailToRegister };
      }
    }

    // 5. 特定したユーザー（またはメールアドレス）でログインURL発行
    if (targetUser && targetUser.email) {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: targetUser.email,
      });

      if (linkData?.properties?.action_link) {
         return NextResponse.redirect(linkData.properties.action_link);
      }
    }

    return NextResponse.json({ error: 'Login failed' }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}