/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/supabase/server'

const schema = z.object({ matching_id: z.string().uuid(), body: z.string().trim().min(1).max(2000) })
export async function GET(request: Request) {
  try { const { supabase, user } = await requireUser(); const id = new URL(request.url).searchParams.get('matching_id'); if (!id) return NextResponse.json({ error: 'matching_idが必要です' }, { status: 400 }); const { data: match } = await supabase.from('matchings').select('id').eq('id', id).or(`victim_id.eq.${user.id},supporter_id.eq.${user.id}`).maybeSingle(); if (!match) return NextResponse.json({ error: '成立したマッチングのみ利用できます' }, { status: 403 }); const { data, error } = await supabase.from('messages').select('id,sender_id,body,read_at,created_at').eq('matching_id', id).is('deleted_at', null).order('created_at'); if (error) throw error; return NextResponse.json({ data }) } catch { return NextResponse.json({ error: 'メッセージを取得できませんでした' }, { status: 401 }) }
}
export async function POST(request: Request) {
  try { const { supabase, user } = await requireUser(); const body = schema.parse(await request.json()); const { data: match } = await supabase.from('matchings').select('id,status').eq('id', body.matching_id).or(`victim_id.eq.${user.id},supporter_id.eq.${user.id}`).eq('status', 'accepted').maybeSingle(); if (!match) return NextResponse.json({ error: '成立済みマッチングのみ送信できます' }, { status: 403 }); const { data, error } = await supabase.from('messages').insert({ ...body, sender_id: user.id }).select('id,sender_id,body,created_at').single(); if (error) throw error; return NextResponse.json({ data }, { status: 201 }) } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'ログインが必要です' : 'メッセージを送信できませんでした' }, { status: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 400 }) }
}
