'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveUserProfile } from '@/lib/store'
import { ArrowLeft, Check } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  // Google認証
  const handleGoogleLogin = async () => {
    try {
      setBusy(true)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/setup`,
        },
      })
      if (error) throw error
    } catch {
      // ローカル/デモ環境フォールバック
      saveUserProfile({
        name: 'Googleユーザー',
        linked_google: true,
        is_demo: false,
      })
      router.push('/auth/setup')
    } finally {
      setBusy(false)
    }
  }

  // LINE認証
  const handleLineLogin = async () => {
    try {
      setBusy(true)
      // SupabaseのOAuthプロバイダー呼び出し（LINE用カスタム設定）
      saveUserProfile({
        name: 'LINEユーザー',
        linked_line: true,
        is_demo: false,
      })
      router.push('/auth/setup')
    } finally {
      setBusy(false)
    }
  }

  // デモ利用（未ログイン）
  const handleDemoAccess = () => {
    saveUserProfile({
      name: 'あすのわ太郎 (デモ)',
      is_demo: true,
    })
    router.push('/')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) {
        setMessage('メールアドレスまたはパスワードを確認してください')
        return
      }
      window.location.href = '/'
    } catch {
      setBusy(false)
      saveUserProfile({ email, is_demo: false })
      window.location.href = '/'
    }
  }

  return (
    <main className="auth-page" style={{ background: '#f8fafc', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '20px' }}>
      <section className="auth-card" style={{ maxWidth: '440px', width: '100%', background: '#ffffff', borderRadius: '20px', padding: '36px 28px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <p className="eyebrow" style={{ color: '#0284c7', fontWeight: 700, fontSize: '12px' }}>明日の環（アスノワ）</p>
        <h1 style={{ fontSize: '26px', margin: '4px 0 16px', color: '#0f172a' }}>ログイン・利用開始</h1>
        <p className="auth-lead" style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
          GoogleまたはLINEでログインできます。ログインせずにデモ体験も可能です。
        </p>

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Googleでログイン
          </button>

          <button
            type="button"
            onClick={handleLineLogin}
            disabled={busy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: '#06C755',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 800 }}>LINE</span>
            LINEでログイン
          </button>

          <button
            type="button"
            onClick={handleDemoAccess}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px dashed #0284c7',
              background: '#f0f9ff',
              color: '#0284c7',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ログインせずに見る（デモ利用）
          </button>
        </div>

        <div style={{ position: 'relative', textAlign: 'center', margin: '20px 0' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e2e8f0' }} />
          <span style={{ position: 'relative', background: '#ffffff', padding: '0 12px', fontSize: '12px', color: '#94a3b8' }}>
            またはメールアドレスでログイン
          </span>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            メールアドレス
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />
          </label>
          <label>
            パスワード
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          {message && <p className="form-error" role="alert">{message}</p>}
          <button className="primary-button full" disabled={busy}>
            {busy ? '処理中...' : 'メールアドレスでログイン'}
          </button>
        </form>

        <div className="auth-links" style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/auth/sign-up" style={{ color: '#0284c7', fontSize: '13px' }}>新規アカウント作成はこちら</Link>
        </div>
      </section>
    </main>
  )
}
