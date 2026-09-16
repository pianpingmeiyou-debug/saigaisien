'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** 登録メールアドレスへSupabaseの安全な復旧リンクを送信します。 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password` }); setMessage('該当する場合は、パスワード再設定用のメールを送信しました。') }
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">アカウント復旧</p><h1>パスワードを忘れた場合</h1><p className="auth-lead">登録メールアドレスに再設定リンクを送ります。</p><form onSubmit={submit} className="auth-form"><label>メールアドレス<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>{message && <p className="form-note" role="status">{message}</p>}<button className="primary-button full">再設定メールを送る</button></form><Link href="/auth/login" className="text-button">ログインへ戻る</Link></section></main>
}
