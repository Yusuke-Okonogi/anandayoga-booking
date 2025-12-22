import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, lessonId, lessonTitle, lessonDate, instructorName } = body;

    // 1. ユーザーの特定または作成
    let userId = '';
    
    // 既に同じメールアドレスがあるか確認
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      // 既存ユーザーの場合はタグ更新などはしない（既存情報を優先）
    } else {
      // 新規ビジター作成
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) throw createError;
      userId = newUser.user.id;

      // プロフィール更新（ビジタータグ付与）
      await supabaseAdmin
        .from('profiles')
        .update({ 
          full_name: fullName,
          phone: phone,
          tags: ['ビジター'], // ★ビジタータグを付ける
          training_status: '未受講'
        })
        .eq('id', userId);
    }

    // 2. 予約作成
    // 重複チェック
    const { data: existingReservation } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('lesson_id', lessonId)
      .eq('user_id', userId)
      .single();
    
    if (existingReservation) {
      return NextResponse.json({ error: 'すでにこのレッスンを予約済みです' }, { status: 400 });
    }

    const { error: reserveError } = await supabaseAdmin
      .from('reservations')
      .insert([{
        user_id: userId,
        lesson_id: lessonId,
        status: 'confirmed'
      }]);

    if (reserveError) throw reserveError;

    // 3. メール送信（Nodemailer）
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const commonStyle = `font-family: sans-serif; color: #333; line-height: 1.6;`;

    // ユーザー向けメール
    await transporter.sendMail({
      from: `"Ananda Yoga" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '【Ananda Yoga】レッスン予約完了のお知らせ',
      html: `
        <div style="${commonStyle}">
          <h2>${fullName} 様</h2>
          <p>ご予約ありがとうございます。<br>以下の内容で承りました。</p>
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0; background-color: #f9f9f9;">
            <p style="margin: 5px 0;"><strong>クラス:</strong> ${lessonTitle}</p>
            <p style="margin: 5px 0;"><strong>日時:</strong> ${lessonDate}</p>
            <p style="margin: 5px 0;"><strong>担当:</strong> ${instructorName}</p>
          </div>
          <p>
            <strong>【当日のご案内】</strong><br>
            レッスン開始の10分前までにお越しください。<br>
            受付にて簡単な会員登録のお手続きをお願いいたします。
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Ananda Yoga Studio</p>
        </div>
      `,
    });

    // 管理者向けメール
    if (adminEmail) {
      await transporter.sendMail({
        from: `"Ananda Yoga System" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `【ビジター予約】${fullName}様 - ${lessonTitle}`,
        html: `
          <div style="${commonStyle}">
            <h2>ビジター予約が入りました</h2>
            <ul style="background-color: #fff8e1; padding: 15px 15px 15px 30px; border-radius: 8px; border: 1px solid #ffebee;">
              <li><strong>お名前:</strong> ${fullName}様 (ビジター)</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>電話:</strong> ${phone || 'なし'}</li>
              <li><strong>クラス:</strong> ${lessonTitle}</li>
              <li><strong>日時:</strong> ${lessonDate}</li>
            </ul>
            <p>※来店時に会員登録の案内をお願いします。</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Visitor Reserve Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}