'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, HeartHandshake, LockKeyhole, Package, ShieldCheck, MessageCircle, Check, Clock3 } from 'lucide-react'

type Matching = { id: string; post_id: string; status: string; created_at: string }
type Filter = 'すべて' | '申請中' | '成立' | '完了'

/**
 * マッチング専用画面です。
 * 候補の個人情報は、認証済みセッションを確認するサーバーAPIからのみ取得します。
 * レベルによる利用制限も見た目だけでなくAPI側で強制されます。
 */
export default function MatchingPage() {
  const router = useRouter()
  // 前の画面へ戻れる履歴がない場合は、検索ホームへ安全に戻します。
  const goBack = () => { if (window.history.length > 1) router.back(); else router.push('/') }
  // 環境変数APIを取得できない場合も安全側に倒し、マッチングを開放しません。
  // 初期値でもマッチングを開放しない。サーバー取得が完了するまでロック状態を維持します。
  // 初期値を表示せず、サーバーの最新値を取得するまでロック画面だけを表示します。
  const [level, setLevel] = useState<number | null>(null)
  const [items, setItems] = useState<Matching[]>([])
  const [filter, setFilter] = useState<Filter>('すべて')
  const [notice, setNotice] = useState('')
  const [levelLoaded, setLevelLoaded] = useState(false)

  useEffect(() => {
// 災害レベルは公開読み取りAPIから取得し、表示とサーバー制限の基準を揃えます。
    // cache を使わず、管理者が直前に変更したサーバー値を必ず取得します。
    fetch('/api/disaster-level', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) return
      const body = await response.json()
      const value = Number(body.level)
      if (Number.isInteger(value) && value >= 1 && value <= 3) setLevel(value)
      setLevelLoaded(true)
    }).catch(() => {
      // レベルを確認できない場合は安全側（ロック）を維持します。
      setLevelLoaded(true)
    })
    // BEGIN DEMO ACCESS: アップロード環境でデモCookieが分離されても、マッチングAPIへデモアクセスを伝えます。公開時はこのヘッダーを削除します。
    fetch('/api/matchings', { cache: 'no-store', headers: { 'x-demo-access': 'true' } }).then(async (response) => {
      if (response.ok) {
        const body = await response.json()
        setItems(body.data ?? [])
        // 未ログインでもページは利用できますが、個人候補はログイン後に表示します。
        if (body.authenticated === false) setNotice('ログインするとマッチング候補を確認できます')
      } else if (response.status === 401) setNotice('ログインするとマッチング候補を確認できます')
    }).catch(() => setNotice('マッチング情報を取得できませんでした'))
  }, [])

  const counts = {
    すべて: items.length,
    申請中: items.filter((item) => item.status === 'proposed').length,
    成立: items.filter((item) => item.status === 'accepted').length,
    完了: items.filter((item) => item.status === 'completed').length,
  }
  const visibleItems = items.filter((item) => filter === 'すべて' || (filter === '申請中' && item.status === 'proposed') || (filter === '成立' && item.status === 'accepted') || (filter === '完了' && item.status === 'completed'))
  // レベル取得前・取得失敗時も誤って機能を開放しないよう、常にロックします。
  const locked = !levelLoaded || level === null || level >= 2
  const displayLevel = level ?? '確認中'

  return <main className="standalone-page">
    <header className="standalone-header"><button type="button" className="icon-button" aria-label="前の画面へ戻る" onClick={goBack}><ArrowLeft size={20} /></button><Link href="/" className="brand" aria-label="最上位のホームへ移動"><div className="brand-mark" style={{ background: 'transparent', padding: 0 }}><img src="/asunowa.png" alt="明日の環" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '50%' }} /></div><span><strong>明日の環</strong><small>アスノワ 災害時共助</small></span></Link><span className="standalone-level"><span className={`status-dot ${locked ? '' : 'green'}`} />災害レベル Lv.{displayLevel}</span></header>
    <section className="standalone-content"><div className="content-head"><div><p className="eyebrow">つながりを確認する</p><h1>マッチング</h1></div><div className="content-actions"><Link href="/messages/demo" className="secondary-button"><MessageCircle size={16} />メールページ</Link><Link href="/" className="secondary-button">支援依頼を探す</Link></div></div>
      {locked ? <div className="locked-state matching-lock-overlay" role="alertdialog" aria-live="assertive"><LockKeyhole size={30} /><h2>この機能はレベル2以上では使用できません</h2><p>災害レベルがLv.1になるまでマッチング機能は停止しています。</p><Link href="/" className="primary-button">検索へ戻る</Link></div> : <>
        <div className="matching-intro"><div className="intro-icon"><HeartHandshake size={22} /></div><div><h2>マッチング候補を確認</h2><p>成立状況と対象の支援依頼を確認できます。マッチ度や連絡先は表示しません。</p></div><ShieldCheck size={20} /></div>
        <nav className="matching-tabs" aria-label="マッチングの状態"><div>{(['すべて', '申請中', '成立', '完了'] as Filter[]).map((tab) => <button type="button" key={tab} className={filter === tab ? 'active' : ''} onClick={() => setFilter(tab)}>{tab}<span>{counts[tab]}</span></button>)}</div></nav>
        <div className="matching-summary"><span><strong>{visibleItems.length}</strong>件の候補</span><span><Clock3 size={14} /> 更新時に最新状態を取得</span></div>
        <div className="standalone-list">{visibleItems.length === 0 ? <div className="empty-matching"><Package size={28} /><h2>{filter === 'すべて' ? 'マッチング候補はまだありません' : `${filter}の候補はありません`}</h2><p>支援依頼への申し出が成立すると、ここから相手とつながれます。</p><Link href="/" className="text-button">支援依頼を探す</Link></div> : visibleItems.map((item) => <article className="standalone-match candidate-card" key={item.id}><div className="match-info"><StatusBadge status={item.status} /><h3>支援依頼 #{item.post_id.slice(0, 8)}</h3><p>対象の依頼情報は権限に応じて安全に表示されます。</p><small>申請日：{new Date(item.created_at).toLocaleDateString('ja-JP')}</small></div>{item.status === 'accepted' && <Link href={`/messages/${item.id}`} className="primary-button"><MessageCircle size={16} />メールページへ</Link>} {item.status === 'completed' && <span className="completed-label"><Check size={16} />支援完了</span>}</article>)}</div>
      </>}
    </section>{notice && <div className="toast"><Check size={17} />{notice}</div>}
  </main>
}

function StatusBadge({ status }: { status: string }) { const label = status === 'accepted' ? '成立' : status === 'completed' ? '完了' : status === 'cancelled' ? '終了' : '申請中'; return <span className={status === 'accepted' ? 'badge badge-green' : status === 'completed' ? 'badge badge-blue' : 'badge badge-neutral'}>{label}</span> }
