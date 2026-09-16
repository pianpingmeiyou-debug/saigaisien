'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, HeartHandshake, LockKeyhole, Package, ShieldCheck, MessageCircle, Check, Clock3 } from 'lucide-react'
import { getUserProfile, getCityDisasterLevel } from '@/lib/store'

type Matching = { id: string; post_id: string; status: string; created_at: string }
type Filter = 'すべて' | '申請中' | '成立' | '完了'

export default function MatchingPage() {
  const router = useRouter()
  const goBack = () => { if (window.history.length > 1) router.back(); else router.push('/') }
  const [user, setUser] = useState(getUserProfile())
  const [items, setItems] = useState<Matching[]>([])
  const [filter, setFilter] = useState<Filter>('すべて')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setUser(getUserProfile())
  }, [])

  const currentLevel = getCityDisasterLevel(user.disaster_prefecture, user.disaster_city)
  const locked = currentLevel >= 3

  const counts = {
    すべて: items.length,
    申請中: items.filter((item) => item.status === 'proposed').length,
    成立: items.filter((item) => item.status === 'accepted').length,
    完了: items.filter((item) => item.status === 'completed').length,
  }
  const visibleItems = items.filter((item) => filter === 'すべて' || (filter === '申請中' && item.status === 'proposed') || (filter === '成立' && item.status === 'accepted') || (filter === '完了' && item.status === 'completed'))

  return (
    <main className="standalone-page">
      <header className="standalone-header">
        <button type="button" className="icon-button" aria-label="前の画面へ戻る" onClick={goBack}>
          <ArrowLeft size={20} />
        </button>
        <Link href="/" className="brand" aria-label="最上位のホームへ移動">
          <div className="brand-mark" style={{ background: 'transparent', padding: 0 }}>
            <img src="/asunowa.png" alt="明日の環" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <span>
            <strong>明日の環</strong>
            <small>アスノワ 災害時共助</small>
          </span>
        </Link>
        <span className="standalone-level">
          <span className={`status-dot ${locked ? '' : 'green'}`} />
          災害レベル Lv.{currentLevel}
        </span>
      </header>

      <section className="standalone-content">
        <div className="content-head">
          <div>
            <p className="eyebrow">つながりを確認する</p>
            <h1>マッチング</h1>
          </div>
          <div className="content-actions">
            <Link href="/chat" className="secondary-button">
              <MessageCircle size={16} /> チャット画面
            </Link>
            <Link href="/" className="secondary-button">
              支援一覧を探す
            </Link>
          </div>
        </div>

        {locked ? (
          <div className="locked-state matching-lock-overlay" role="alertdialog" aria-live="assertive">
            <LockKeyhole size={30} />
            <h2>この機能はレベル2以下でのみ使用できます</h2>
            <p>災害レベルがLv.3のため安全確保のためマッチング機能は停止しています。</p>
            <Link href="/" className="primary-button">ホームへ戻る</Link>
          </div>
        ) : (
          <>
            <div className="matching-intro">
              <div className="intro-icon">
                <HeartHandshake size={22} />
              </div>
              <div>
                <h2>マッチング候補を確認</h2>
                <p>成立状況と対象の支援依頼・提供を確認できます。</p>
              </div>
              <ShieldCheck size={20} />
            </div>

            <nav className="matching-tabs" aria-label="マッチングの状態">
              <div>
                {(['すべて', '申請中', '成立', '完了'] as Filter[]).map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    className={filter === tab ? 'active' : ''}
                    onClick={() => setFilter(tab)}
                  >
                    {tab}
                    <span>{counts[tab]}</span>
                  </button>
                ))}
              </div>
            </nav>

            <div className="matching-summary">
              <span><strong>{visibleItems.length}</strong>件の候補</span>
              <span><Clock3 size={14} /> 更新時に最新状態を取得</span>
            </div>

            <div className="standalone-list">
              {visibleItems.length === 0 ? (
                <div className="empty-matching">
                  <Package size={28} />
                  <h2>{filter === 'すべて' ? 'マッチング履歴はまだありません' : `${filter}の候補はありません`}</h2>
                  <p>支援依頼・提供への申し出が成立すると、ここから相手とチャットでつながれます。</p>
                  <Link href="/" className="text-button">支援一覧を探す</Link>
                </div>
              ) : (
                visibleItems.map((item) => (
                  <article className="standalone-match candidate-card" key={item.id}>
                    <div className="match-info">
                      <StatusBadge status={item.status} />
                      <h3>支援 #{item.post_id.slice(0, 8)}</h3>
                      <p>対象の情報は安全に連携されています。</p>
                      <small>申請日：{new Date(item.created_at).toLocaleDateString('ja-JP')}</small>
                    </div>
                    {item.status === 'accepted' && (
                      <Link href="/chat" className="primary-button">
                        <MessageCircle size={16} /> チャットへ
                      </Link>
                    )}
                    {item.status === 'completed' && (
                      <span className="completed-label"><Check size={16} /> 支援完了</span>
                    )}
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </section>
      {notice && <div className="toast"><Check size={17} />{notice}</div>}
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = status === 'accepted' ? '成立' : status === 'completed' ? '完了' : status === 'cancelled' ? '終了' : '申請中'
  return (
    <span className={status === 'accepted' ? 'badge badge-green' : status === 'completed' ? 'badge badge-blue' : 'badge badge-neutral'}>
      {label}
    </span>
  )
}
