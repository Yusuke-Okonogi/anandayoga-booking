import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { type, userEmail, userName, lessonTitle, lessonDate, instructorName, contactSubject, contactBody } = await request.json();

    // 1. トランスポーター設定
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

    // メールの内容を定義
    let subject = '';
    let userHtml = '';
    let adminSubject = '';
    let adminHtml = '';

    if (type === 'cancellation') {
      // --- キャンセル時 ---
      subject = '【Ananda Yoga】ご予約キャンセルの完了';
      userHtml = `
        <div style="${commonStyle}">
          <h2>${userName} 様</h2>
          <p>以下のご予約のキャンセルを承りました。</p>
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0; background-color: #fff0f0;">
            <p style="margin: 5px 0;"><strong>クラス名:</strong> ${lessonTitle}</p>
            <p style="margin: 5px 0;"><strong>日時:</strong> ${lessonDate}</p>
            <p style="margin: 5px 0;"><strong>担当:</strong> ${instructorName}</p>
          </div>
          <p>またのご予約をお待ちしております。</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Ananda Yoga Studio<br>Web: https://ananda-yogaschool.com</p>
        </div>
      `;

      adminSubject = `【キャンセル通知】${userName}様 - ${lessonTitle}`;
      adminHtml = `
        <div style="${commonStyle}">
          <h2>予約キャンセルがありました</h2>
          <ul style="background-color: #fff0f0; padding: 15px 15px 15px 30px; border-radius: 8px;">
            <li><strong>会員名:</strong> ${userName} (${userEmail})</li>
            <li><strong>クラス:</strong> ${lessonTitle}</li>
            <li><strong>日時:</strong> ${lessonDate}</li>
            <li><strong>担当:</strong> ${instructorName}</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/checkin" style="color: #008080; font-weight: bold;">管理画面を確認する</a></p>
        </div>
      `;

    } else if (type === 'contact') {
      // --- お問い合わせ時 ---
      subject = '【Ananda Yoga】お問い合わせを受け付けました';
      userHtml = `
        <div style="${commonStyle}">
          <h2>${userName} 様</h2>
          <p>お問い合わせありがとうございます。<br>以下の内容で受け付けました。担当者より折り返しご連絡いたします。</p>
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0; background-color: #f9f9f9;">
            <p style="margin: 5px 0; font-weight: bold;">[件名] ${contactSubject}</p>
            <p style="margin: 5px 0; white-space: pre-wrap;">${contactBody}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Ananda Yoga Studio</p>
        </div>
      `;

      adminSubject = `【問い合わせ】${userName}様より: ${contactSubject}`;
      // ★修正: 見出しを「マイページからのお問い合わせ」から「お問い合わせ」に変更
      adminHtml = `
        <div style="${commonStyle}">
          <h2>お問い合わせ</h2>
          <p><strong>会員名:</strong> ${userName} (<a href="mailto:${userEmail}">${userEmail}</a>)</p>
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; font-weight: bold;">${contactSubject}</p>
            <p style="margin: 5px 0; white-space: pre-wrap;">${contactBody}</p>
          </div>
          <p>※このメールに返信するか、上記メールアドレス宛にご連絡ください。</p>
        </div>
      `;

    } else {
      // --- 予約時（デフォルト） ---
      subject = '【Ananda Yoga】ご予約ありがとうございます';
      userHtml = `
        <div style="${commonStyle}">
          <h2>${userName} 様</h2>
          <p>以下のレッスンでご予約を承りました。</p>
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0; background-color: #f9f9f9;">
            <p style="margin: 5px 0;"><strong>クラス名:</strong> ${lessonTitle}</p>
            <p style="margin: 5px 0;"><strong>日時:</strong> ${lessonDate}</p>
            <p style="margin: 5px 0;"><strong>担当:</strong> ${instructorName}</p>
          </div>
          <p>当日はお気をつけてお越しくださいませ。<br>キャンセルはマイページより行えます。</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Ananda Yoga Studio<br>Web: https://ananda-yogaschool.com</p>
        </div>
      `;

      adminSubject = `【予約通知】${userName}様 - ${lessonTitle}`;
      adminHtml = `
        <div style="${commonStyle}">
          <h2>新しい予約が入りました</h2>
          <ul style="background-color: #eefcf5; padding: 15px 15px 15px 30px; border-radius: 8px;">
            <li><strong>会員名:</strong> ${userName} (${userEmail})</li>
            <li><strong>クラス:</strong> ${lessonTitle}</li>
            <li><strong>日時:</strong> ${lessonDate}</li>
            <li><strong>担当:</strong> ${instructorName}</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/checkin" style="color: #008080; font-weight: bold;">管理画面で確認する</a></p>
        </div>
      `;
    }

    // 2. ユーザーへのメール送信
    await transporter.sendMail({
      from: `"Ananda Yoga" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: subject,
      html: userHtml,
    });

    // 3. 管理者への通知メール送信
    if (adminEmail) {
      await transporter.sendMail({
        from: `"Ananda Yoga System" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: 'Failed to send email', details: error.message }, { status: 500 });
  }
}