/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserOrDemo } from '@/lib/supabase/server'

const schema = z.object({
  post_type: z.enum(['victim_request', 'support_offer']).default('victim_request'),
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(40),
  quantity: z.string().trim().min(1).max(80),
  place: z.string().trim().min(1).max(200),
  urgency: z.coerce.number().int().min(1).max(5).default(3),
  description: z.string().trim().max(5000).optional(),
  disaster_type: z.string().trim().min(1).max(40),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  deadline: z.string().datetime().optional(),
  available_time: z.string().max(120).optional(),
  delivery_method: z.string().max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(100).default([]),
})

export async function GET(request: Request) {
  try {
    const { supabase } = await requireUserOrDemo()
    const search = new URL(request.url).searchParams.get('q')?.trim()
    let query = supabase.from('posts').select('id,author_id,post_type,title,category,quantity,place,latitude,longitude,urgency,deadline,available_time,delivery_method,description,status,disaster_type,created_at,expires_at').is('hidden_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(100)
    if (search) query = query.or(`title.ilike.%${search}%,place.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'ログインが必要です' : '投稿を取得できませんでした' }, { status: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUserOrDemo()
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: '入力内容を確認してください' }, { status: 400 })
    const { tags, ...post } = parsed.data
    const { data, error } = await supabase.from('posts').insert({ ...post, author_id: user.id }).select('id,title,status,created_at').single()
    if (error) throw error
    if (tags.length) {
      const { error: tagError } = await supabase.from('post_tags').insert(tags.map((tag) => ({ post_id: data.id, tag })))
      if (tagError) throw tagError
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'ログインが必要です' : '投稿を保存できませんでした' }, { status: error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 500 })
  }
}
