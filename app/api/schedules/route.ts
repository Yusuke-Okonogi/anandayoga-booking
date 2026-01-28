import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.MICROCMS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API Key is missing' }, { status: 500 });
  }

  try {
    const res = await fetch('https://ananda.microcms.io/api/v1/news?filters=schedule[equals]true&limit=3', {
      headers: { 'X-MICROCMS-API-KEY': apiKey },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch schedules');
    }

    const data = await res.json();
    return NextResponse.json(data); // データをそのままクライアントに返す
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ contents: [] }); // エラー時は空配列を返すなど
  }
}