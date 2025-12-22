import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // URLに ?userId=... がついていたら「紐付けモード」として扱う
  const userId = searchParams.get('userId');

  const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`;
  
  // stateの中に「これは紐付けだよ」という情報を埋め込む
  const stateData = {
    nonce: Math.random().toString(36).substring(7),
    userId: userId || null
  };
  // Base64エンコードしてLINEに渡す
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

  const lineUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=profile%20openid%20email`;

  return NextResponse.redirect(lineUrl);
}