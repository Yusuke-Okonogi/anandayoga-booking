import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const normalizeString = (str: string) => {
  if (!str) return '';
  return str
    .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/　/g, " ")
    .replace(/［/g, '[')
    .replace(/］/g, ']')
    .trim();
};

export async function POST() {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    return NextResponse.json({ error: 'API Key or Calendar ID is missing' }, { status: 500 });
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    let pageToken = '';
    let count = 0;
    let deletedCount = 0;
    let lastError = null;

    do {
      let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime&showDeleted=true&maxResults=2500`;
      
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      
      console.log('Fetching Google Calendar Page...');
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      if (data.error) {
        console.error('Google API Error:', data.error);
        throw new Error(`Google API Error: ${data.error.message}`);
      }

      const events = data.items || [];
      
      for (const event of events) {
        if (event.status === 'cancelled') {
          const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('google_calendar_event_id', event.id);

          if (!error) deletedCount++;
          continue; 
        }

        const originalSummary = event.summary || '名称未設定';
        const normalizedSummary = normalizeString(originalSummary);

        // パターンA: [強度][講師][定員]タイトル
        const regexFull = /^\[(.*?)\].*?\[(.*?)\].*?\[(.*?)\].*?(.*)$/;
        // パターンB: [強度][講師]タイトル
        const regexNormal = /^\[(.*?)\].*?\[(.*?)\].*?(.*)$/;
        // パターンC: [講師]タイトル (パーソナル・養成講座用)
        const regexSimple = /^\[(.*?)\].*?(.*)$/;

        const matchFull = normalizedSummary.match(regexFull);
        const matchNormal = normalizedSummary.match(regexNormal);
        const matchSimple = normalizedSummary.match(regexSimple);

        let difficulty = '★';
        let instructor = 'TBA';
        let capacity = 15;
        let title = originalSummary;
        let isMatched = false;
        let type = 'normal';

        if (event.start.date) {
             type = 'personal';
             capacity = 1;
        } else if (title.includes('養成講座')) {
             type = 'training';
        }

        if (matchFull) {
          const difficultyRaw = matchFull[1];
          instructor = matchFull[2];
          const capacityStr = matchFull[3];
          title = matchFull[4].trim();
          const parsedCap = parseInt(capacityStr, 10);
          if (!isNaN(parsedCap)) capacity = parsedCap;
          difficulty = difficultyRaw;
          isMatched = true;
        } else if (matchNormal) {
          const difficultyRaw = matchNormal[1];
          instructor = matchNormal[2];
          title = matchNormal[3].trim();
          difficulty = difficultyRaw;
          isMatched = true;
        } else if (matchSimple) {
          // 強度なしパターン
          instructor = matchSimple[1];
          title = matchSimple[2].trim();
          isMatched = true;
          // 強度はデフォルト(★)のまま
        }

        // 強度変換（マッチした場合のみ）
        if (isMatched) {
          if (difficulty === '★1') difficulty = 'オールレベルのやさしいクラス';
          else if (difficulty === '★2') difficulty = '中級クラス';
        }

        // 終日イベントの時間補正
        let startTime = event.start.dateTime;
        let endTime = event.end.dateTime;
        if (event.start.date) {
             startTime = `${event.start.date}T00:00:00`;
             endTime = `${event.start.date}T23:59:59`;
             // 終日なら強制的にパーソナル扱い（既存ロジック）
             type = 'personal';
        }

        // タイトルに養成講座が含まれていれば強制的にtraining扱い
        if (title.includes('養成講座')) {
            type = 'training';
        }

        if (!startTime || !endTime) continue;

        const lessonData = {
          google_calendar_event_id: event.id,
          title: title,
          instructor_name: instructor,
          difficulty_level: difficulty,
          capacity: capacity,
          start_time: startTime,
          end_time: endTime,
          description: event.description || '',
          type: type,
        };

        const { error } = await supabase
          .from('lessons')
          .upsert(lessonData, { onConflict: 'google_calendar_event_id' });

        if (error) {
          console.error('Supabase Upsert Error:', error);
          lastError = error.message;
        } else {
          count++;
        }
      }

      pageToken = data.nextPageToken;

    } while (pageToken);

    return NextResponse.json({ 
      success: true, 
      message: `${count}件更新、${deletedCount}件削除` + (lastError ? ` (一部エラー: ${lastError})` : '')
    });

  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}