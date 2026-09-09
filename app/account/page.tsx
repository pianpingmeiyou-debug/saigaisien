'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** マイページを担当します。未ログインでも案内を表示し、保存が必要な操作だけ認証へ誘導します。 */
export default function AccountPage() {
  // ブラウザのSupabaseセッションを読み、ログイン済みかどうかだけを確認します。
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [checked, setChecked] = useState(false)
  const [role, setRole] = useState('victim')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // 認証取得に失敗しても公開ページは表示し、保護操作だけを止めます。
    createClient().auth.getUser().then(({ data }) => { setUser(data.user); setChecked(true) }).catch(() => setChecked(true))
  }, [])

  async function save() {
    // DB保存はログイン済みユーザーのIDを使います。未ログインのデモでは画面内の役割を切り替えます。
    if (!user) {
      // BEGIN DEMO ACCESS: デモ確認用。公開後にデモ機能を削除する場合は、このコメントからENDまで削除します。
      document.cookie = `yorisoi_demo_role=${role}; path=/; max-age=86400; SameSite=Lax`
      setMessage('デモアカウントの役割を更新しました。')
      return
      // END DEMO ACCESS
    }
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { setMessage('保存するにはログインしてください。'); return }
    // role_type は自己申告フォームで選択した役割をSupabaseへ保存します。
    // upsertにより初回登録と既存プロフィールの更新を同じ処理で行います。
    const { error } = await supabase.from('profiles').upsert({ id: auth.user.id, role_type: role, disaster_location: location })
    setMessage(error ? '申告を保存できませんでした。' : '申告内容を保存しました。')
  }

  async function logout() {
    // ログアウト後は公開ホームへ戻し、セッションを画面に残しません。
    await createClient().auth.signOut()
    window.location.href = '/'
  }

  if (!checked) return <main className="auth-page"><section className="auth-card"><p className="auth-lead">アカウント情報を確認しています。</p></section></main>

  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">アカウント</p><h1>マイページ</h1>{user ? <p className="auth-lead">{user.email}</p> : <div className="notice-card"><p>ログインなしでも支援情報の検索・地図確認・使い方の閲覧ができます。</p><Link href="/auth/login" className="primary-button full">ログインする</Link></div>}<div className="auth-form"><label>現在の立場<select value={role} onChange={e => setRole(e.target.value)}><option value="victim">被災者</option><option value="supporter">支援者</option></select></label><label>支援・避難地域<input value={location} onChange={e => setLocation(e.target.value)} placeholder="例：全国・関東・石川県" /></label><button className="primary-button full" onClick={save}>申告内容を保存</button>{message && <p className="form-note" role="status">{message}</p>}{user && <button className="secondary-button full" onClick={logout}>ログアウト</button>}</div><Link href={user ? '/account/declaration' : '/auth/login'} className="primary-button full">災害時の自己申告を変更する</Link><Link href="/matching" className="text-button">マッチングページへ</Link></section></main>
}
