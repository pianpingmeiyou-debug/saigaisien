'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** 一般ユーザー用のメールアドレス・パスワード認証画面です。役割はここで決めません。 */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) { setMessage('メールアドレスまたはパスワードを確認してください'); return }
    window.location.href = '/'
  }

  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">よりそい</p><h1>ログイン</h1><p className="auth-lead">役割はログイン後、マイページから自己申告します。</p><form onSubmit={submit} className="auth-form"><label>メールアドレス<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>パスワード<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button full" disabled={busy}>{busy ? '確認中...' : 'ログイン'}</button></form><div className="auth-links"><Link href="/auth/sign-up">アカウントを作成</Link><Link href="/auth/forgot-password">パスワードを忘れた場合</Link><Link className="admin-entry" href="/auth/admin-login">管理者としてログインする</Link></div><Link href="/home" className="text-button">ホームへ戻る</Link></section></main>
}
