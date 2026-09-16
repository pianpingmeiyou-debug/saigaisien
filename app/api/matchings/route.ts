/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserOrDemo } from '@/lib/supabase/server'
import { assertLevel } from '@/lib/authz'

const schema = z.object({ post_id: z.string().uuid(), victim_id: z.string().uuid() })
// 未ログインでも専用ページ自体は閲覧できるようにします。ただし、個人に紐づく候補情報は認証済みユーザーにだけ返します。
export async function GET() {
  try {
    // Supabaseセッションを確認し、ログインユーザー自身が参加する行だけを取得します。
    const { supabase, user } = await requireUserOrDemo()
    const { data, error } = await supabase
      .from('matchings')
      .select('id,post_id,supporter_id,victim_id,score,status,created_at')
      .or(`victim_id.eq.${user.id},supporter_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ data, authenticated: true })
  } catch {
    // 未ログイン時は401でページを壊さず、空の候補一覧を返してログイン導線を表示します。
    return NextResponse.json({ data: [], authenticated: false })
  }
}
export async function POST(request: Request) { try { const { supabase, user } = await requireUserOrDemo(); const { data: region } = await supabase.from('disaster_regions').select('level').eq('scope', '全国').maybeSingle(); assertLevel(Number(region?.level ?? process.env.DISASTER_LEVEL ?? 2), 'matching'); const body = schema.parse(await request.json()); if (body.victim_id === user.id) return NextResponse.json({ error: '自分の投稿には申し込めません' }, { status: 400 }); const { data: post } = await supabase.from('posts').select('id,author_id,status,post_type').eq('id', body.post_id).eq('author_id', body.victim_id).eq('status', 'open').maybeSingle(); if (!post) return NextResponse.json({ error: '募集中の支援依頼が見つかりません' }, { status: 404 }); const { data, error } = await supabase.from('matchings').insert({ post_id: body.post_id, victim_id: body.victim_id, supporter_id: user.id, score: 70 }).select('id,post_id,status,score,created_at').single(); if (error) throw error; return NextResponse.json({ data }, { status: 201 }) } catch (error) { const message = error instanceof Error && error.message === 'CAPABILITY_LOCKED' ? '災害レベルによりマッチングは停止中です' : 'マッチングを作成できませんでした'; return NextResponse.json({ error: message }, { status: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 400 }) } }
