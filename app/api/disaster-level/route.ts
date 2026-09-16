/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/authz'

// 災害レベルのDB読み書きはサーバーだけで行い、RLSに左右されない管理用クライアントを使います。
// Vercelのアップロード環境ではSUPABASE_SECRET_KEYが注入される場合があるため、両方に対応します。
function createDisasterLevelClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase server credentials are not configured')
  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * 災害レベルはサーバー側の値だけを信頼します。Lv.0は廃止し、Lv.1〜3で運用します。
 * 管理画面から変更した値は短期の管理Cookieへ反映し、再読込後も判定を揃えます。
 */
export async function GET() {
  // DBの全国レコードを最優先し、未初期化時だけ環境変数へフォールバックします。
  const supabase = createDisasterLevelClient()
  const { data } = await supabase.from('disaster_regions').select('level').eq('scope', '全国').maybeSingle()
  const cookieLevel = (await cookies()).get('disaster-level')?.value
  const raw = Number(data?.level ?? cookieLevel ?? process.env.DISASTER_LEVEL ?? '1')
  const level = Number.isFinite(raw) ? Math.min(3, Math.max(1, raw)) : 1
  return NextResponse.json({ level }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const level = Number(body.level)
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    return NextResponse.json({ error: '災害レベルはLv.1〜Lv.3で指定してください' }, { status: 400 })
  }
  try {
    // 通常環境ではSupabaseセッションの管理者権限を検証します。
    // UIデモは認証基盤を持たないため、明示的なデモヘッダーでのみ保存を許可します。
    const isDemoAdmin = request.headers.get('x-demo-admin') === 'true'
    if (!isDemoAdmin) await requireAdmin()
    const supabase = createDisasterLevelClient()
    const updatedAt = new Date().toISOString()
    // 全国のレコードを更新し、未作成の場合も同じ処理で作成してDBを必ず最新化します。
    const { error } = await supabase.from('disaster_regions').upsert({
      name: '全国',
      scope: '全国',
      level,
      manual_level: level,
      level_updated_at: updatedAt,
    }, { onConflict: 'scope' })
    if (error) return NextResponse.json({ error: '災害レベルを保存できませんでした' }, { status: 500 })
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }
  const response = NextResponse.json({ level })
  response.cookies.set('disaster-level', String(level), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
