'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Supabase Authに登録します。パスワードはSupabase側でハッシュ化されます。 */
export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('')
    const { error } = await createClient().auth.signUp({ email, password, options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`, data: { display_name: displayName } } })
    setMessage(error ? '登録できませんでした。入力内容を確認してください。' : '確認メールを送信しました。メールのリンクから登録を完了してください。')
  }
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">よりそい</p><h1>アカウント作成</h1><form onSubmit={submit} className="auth-form"><label>表示名<input required value={displayName} onChange={e => setDisplayName(e.target.value)} /></label><label>メールアドレス<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>パスワード<input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>{message && <p className="form-note" role="status">{message}</p>}<button className="primary-button full">登録する</button></form><Link href="/auth/login" className="text-button">ログインへ戻る</Link></section></main>
}
