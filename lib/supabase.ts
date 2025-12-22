import { createClient } from '@supabase/supabase-js'

// 環境変数から鍵情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 鍵がない場合にエラーを出す（設定ミス防止）
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SupabaseのURLまたはAnon Keyが設定されていません。.env.localを確認してください。')
}

// Supabaseクライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseAnonKey)