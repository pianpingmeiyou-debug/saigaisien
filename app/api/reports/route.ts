/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/supabase/server'

const schema = z.object({ target_type: z.enum(['post', 'map_pin']), target_id: z.string().uuid(), reason: z.string().trim().min(1).max(1000) })
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const body = schema.parse(await request.json())
    const table = body.target_type === 'post' ? 'posts' : 'map_pins'
    const { data: target, error: targetError } = await supabase.from(table).select('id').eq('id', body.target_id).maybeSingle()
    if (targetError || !target) return NextResponse.json({ error: '対象が見つかりません' }, { status: 404 })
    const { error } = await supabase.from('reports').insert({ reporter_id: user.id, ...body })
    if (error) throw error
    await supabase.from(table).update({ hidden_at: new Date().toISOString() }).eq('id', body.target_id)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'ログインが必要です' : '通報を送信できませんでした' }, { status: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 400 }) }
}
