/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { requireUserOrDemo } from '@/lib/supabase/server'

const schema = z.object({ pin_type: z.string().trim().min(1).max(40), title: z.string().trim().min(1).max(160), description: z.string().trim().max(3000).optional(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
// 地図の公開ピンは未ログインでも閲覧できるため、GETは認証を要求しません。
// RLSやアップロード環境の匿名アクセス設定に左右されないよう、読み取り専用のサーバー権限で取得します。
export async function GET() {
  try {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
    if (!url || !key) throw new Error('SUPABASE_SERVER_CONFIG_MISSING')

    const serviceClient = createServerClient(url, key, {
      cookies: { getAll: () => [], setAll: () => undefined },
    })
    const { data, error } = await serviceClient
      .from('map_pins')
      .select('id,author_id,pin_type,title,description,latitude,longitude,approved,created_at,expires_at')
      .is('hidden_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch {
    return NextResponse.json({ error: '地図情報を取得できませんでした' }, { status: 500 })
  }
}
export async function POST(request: Request) { try { const { supabase, user } = await requireUserOrDemo(); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: '位置と内容を確認してください' }, { status: 400 }); const { data, error } = await supabase.from('map_pins').insert({ ...parsed.data, author_id: user.id }).select('id,pin_type,title,latitude,longitude,approved,created_at').single(); if (error) throw error; return NextResponse.json({ data }, { status: 201 }) } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'ログインが必要です' : 'ピンを保存できませんでした' }, { status: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 400 }) } }
