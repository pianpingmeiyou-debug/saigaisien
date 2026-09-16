/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/supabase/server'

const schema = z.object({ post_id: z.string().uuid(), action: z.enum(['add', 'remove']) })
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const body = schema.parse(await request.json())
    const result = body.action === 'add'
      ? await supabase.from('bookmarks').upsert({ user_id: user.id, post_id: body.post_id }).select().single()
      : await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', body.post_id)
    if (result.error) throw result.error
    return NextResponse.json({ ok: true })
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'ログインが必要です' : '保存状態を更新できませんでした' }, { status: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 400 }) }
}
export async function GET() {
  try { const { supabase, user } = await requireUser(); const { data, error } = await supabase.from('bookmarks').select('post_id,created_at').eq('user_id', user.id).order('created_at', { ascending: false }); if (error) throw error; return NextResponse.json({ data }) } catch { return NextResponse.json({ error: 'ブックマークを取得できませんでした' }, { status: 401 }) }
}
