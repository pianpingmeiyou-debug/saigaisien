'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Bell, Bookmark, Check, ChevronRight, CircleHelp, Clock3,
  FileText, Flag, HeartHandshake, Home, Inbox, LifeBuoy, MapPin, Menu,
  MessageCircle, Package, Search, Send, Settings, ShieldCheck, Siren,
  SlidersHorizontal, UserRound, Users, X, Zap, Plus, Navigation, LockKeyhole,
} from 'lucide-react'

import {
  getUserProfile, saveUserProfile, getCityDisasterLevel, getLocationDisasterLevel,
  getSortedFilteredPosts, addPost, applyAndCreateMatch
} from '@/lib/store'
import { UserRole, PostCategory, UrgencyLevel, PostItem } from '@/lib/types'
import { parseLocation } from '@/lib/cities'

const DisasterMap = dynamic(() => import('@/components/disaster-map'), { ssr: false })

type Tab = '検索' | '投稿' | '地図' | 'チャット' | 'マイページ'

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'red' | 'amber' | 'green' | 'blue' | 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button aria-label={label} className="icon-button" onClick={onClick}>{children}</button>
}

export default function Page() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('検索')

  // ユーザープロファイル
  const [user, setUser] = useState(getUserProfile())

  // 災害レベル (ユーザー指定地域)
  const currentDisasterLevel = useMemo(() => {
    return getCityDisasterLevel(user.disaster_prefecture, user.disaster_city)
  }, [user.disaster_prefecture, user.disaster_city])

  const [query, setQuery] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('すべて')
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)
  const [modalLockMsg, setModalLockMsg] = useState<string | null>(null)

  // 投稿フォーム状態
  const [form, setForm] = useState<{
    title: string
    category: PostCategory
    quantity: string
    place: string
    urgency: UrgencyLevel
    description: string
    tags: string
  }>({
    title: '',
    category: '飲料',
    quantity: '',
    place: `${user.disaster_prefecture}${user.disaster_city}`,
    urgency: '中',
    description: '',
    tags: '',
  })

  // クライアント読み込み時のプロファイル同調
  useEffect(() => {
    const freshUser = getUserProfile()
    setUser(freshUser)
    setForm(prev => ({ ...prev, place: `${freshUser.disaster_prefecture}${freshUser.disaster_city}` }))
  }, [])

  const refreshUser = () => {
    setUser(getUserProfile())
  }

  const showNotice = (text: string) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 2800)
  }

  const selectTab = (nextTab: Tab) => {
    if (nextTab === 'チャット') {
      router.push('/chat')
      return
    }
    setTab(nextTab)
    setMenuOpen(false)
  }

  // ソート・フィルタリング投稿一覧
  const postsList = useMemo(() => {
    const sorted = getSortedFilteredPosts(user.disaster_prefecture, user.disaster_city, user.role)

    const terms = query.split(/[、,\s]+/).map(t => t.trim()).filter(Boolean)
    return sorted.filter(p => {
      const searchable = `${p.title} ${p.category} ${p.received_location} ${(p.tags ?? []).join(' ')}`.toLowerCase()
      const matchesQuery = terms.length === 0 || terms.some(t => searchable.includes(t.toLowerCase()))
      const matchesUrgency = urgencyFilter === 'すべて' || p.urgency === urgencyFilter
      return matchesQuery && matchesUrgency
    })
  }, [user.disaster_prefecture, user.disaster_city, user.role, query, urgencyFilter])

  // 投稿送信ハンドラ
  const submitPost = () => {
    if (!form.title || !form.place) {
      showNotice('タイトルと受け取り場所を入力してください')
      return
    }

    const res = addPost({
      title: form.title,
      category: form.category,
      description: form.description + (form.quantity ? ` (数量: ${form.quantity})` : ''),
      received_location: form.place,
      urgency: form.urgency,
      tags: form.tags.split(/[、,\s]+/).map(t => t.trim()).filter(Boolean),
    })

    if (!res.success) {
      setModalLockMsg(res.error ?? '投稿できませんでした')
      return
    }

    showNotice(user.role === 'victim' ? '支援依頼を公開しました' : '支援提供を公開しました')
    setForm({
      title: '',
      category: '飲料',
      quantity: '',
      place: `${user.disaster_prefecture}${user.disaster_city}`,
      urgency: '中',
      description: '',
      tags: '',
    })
    setTab('検索')
  }

  // 応募/申し出ハンドラ
  const handleApplyPost = (post: PostItem) => {
    const postLevel = getLocationDisasterLevel(post.received_location)
    if (postLevel >= 3) {
      setSelectedPost(null)
      setModalLockMsg('この機能はレベル2以下の時のみ利用できます。安全な状態になるまでお待ち下さい。')
      return
    }

    const res = applyAndCreateMatch(post.id)
    setSelectedPost(null)

    if (res.success && res.chat) {
      showNotice('マッチングが成立しました！チャットへ移動します')
      setTimeout(() => {
        router.push(`/chat?id=${res.chat?.id}`)
      }, 1000)
    } else if (res.error) {
      setModalLockMsg(res.error)
    }
  }

  return (
    <main className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* トップバー Header */}
      <header className="topbar">
        <IconButton label={menuOpen ? 'メインメニューを閉じる' : 'メインメニュー'} onClick={() => setMenuOpen(open => !open)}>
          <Menu size={20} />
        </IconButton>

        {/* ロゴ & アプリ名 */}
        <Link href="/" className="brand" aria-label="明日の環（アスノワ）ホーム">
          <div className="brand-mark" style={{ background: 'transparent', padding: 0 }}>
            <img src="/asunowa.png" alt="明日の環" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <div>
            <strong>明日の環</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>アスノワ 災害時共助</span>
          </div>
        </Link>

        <div className="location">
          <MapPin size={15} />
          {user.disaster_prefecture} {user.disaster_city}
        </div>

        <div className="top-actions">
          <span style={{ fontSize: '12px', background: user.role === 'victim' ? '#fff7ed' : '#f0fdf4', color: user.role === 'victim' ? '#c2410c' : '#15803d', padding: '3px 8px', borderRadius: '12px', fontWeight: 600, border: '1px solid currentColor' }}>
            {user.role === 'victim' ? '被災者モード' : '支援者モード'}
          </span>
          <Link href="/admin" className={`level level-${currentDisasterLevel}`}>
            <span className="status-dot" />
            災害レベル Lv.{currentDisasterLevel}
            <ChevronRight size={14} />
          </Link>
        </div>
      </header>

      {/* アラートバー */}
      <div className="alertbar">
        <AlertTriangle size={17} />
        <span>
          <b>{user.disaster_prefecture}{user.disaster_city}</b> の状況：
          {currentDisasterLevel <= 1 ? '通常のマッチングが利用できます' : currentDisasterLevel === 2 ? '指定物資の受け渡しが可能です' : '危険レベル(Lv.3)：安全確保のため新規投稿・支援開始を停止しています'}
        </span>
        <Link href="/admin" style={{ color: 'white', textDecoration: 'underline', marginLeft: 'auto', fontSize: '12px' }}>
          地域レベル設定 <ChevronRight size={14} />
        </Link>
      </div>

      {/* メインレイアウト */}
      <div className="layout" style={{ flex: 1 }}>
        {/* サイドバー Sidebar */}
        <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
          <div className="sidebar-head">
            <div className="side-label">メインメニュー</div>
          </div>

          {(['検索', '投稿', '地図', 'チャット', 'マイページ'] as Tab[]).map((item, i) => {
            const IconComponent = [Search, Plus, MapPin, MessageCircle, UserRound][i]
            return (
              <button key={item} className={tab === item ? 'nav-item active' : 'nav-item'} onClick={() => selectTab(item)}>
                <IconComponent size={19} />
                {item}
              </button>
            )
          })}

          <div className="side-divider" />
          <div className="side-label">安全とサポート</div>
          <Link className="nav-item" href="/admin">
            <ShieldCheck size={19} />管理者地域設定
          </Link>
          <button className="nav-item" onClick={() => showNotice('ヘルプセンターを開きました')}>
            <CircleHelp size={19} />ヘルプセンター
          </button>
        </aside>

        {/* メインコンテンツ */}
        <section className="content">
          <div className="content-head">
            <div>
              <p className="eyebrow">
                {tab === '検索' ? '共助マッチング' : tab === '投稿' ? (user.role === 'victim' ? '依頼を作成' : '提供を作成') : tab === '地図' ? '道路・避難所状況' : 'マイページ'}
              </p>
              <h1>{tab === '検索' ? (user.role === 'victim' ? '支援者の「提供」一覧' : '被災者の「依頼」一覧') : tab}</h1>
            </div>
            {tab === '検索' && (
              <button className="primary-button" onClick={() => selectTab('投稿')}>
                <Plus size={17} />
                {user.role === 'victim' ? '依頼を投稿する' : '提供を投稿する'}
              </button>
            )}
          </div>

          {/* 検索タブ content */}
          {tab === '検索' && (
            <>
              <div className="search-panel legacy-search-panel" style={{ marginBottom: '20px' }}>
                <div className="search-input">
                  <Search size={18} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="物資名、市区町村名などで検索" />
                </div>
                <div className="filters">
                  <SlidersHorizontal size={16} />
                  <span>緊急度:</span>
                  {['すべて', '高', '中', '低'].map(x => (
                    <button key={x} className={urgencyFilter === x ? 'filter active' : 'filter'} onClick={() => setUrgencyFilter(x)}>
                      {x === 'すべて' ? '全緊急度' : `${x}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="request-list">
                {postsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <Package size={40} style={{ marginBottom: '12px' }} />
                    <h3>該当する投稿がありません</h3>
                    <p>{user.role === 'victim' ? '現在登録されている【提供】物資はありません' : '現在登録されている【依頼】物資はありません'}</p>
                  </div>
                ) : (
                  postsList.map(post => {
                    const postLevel = getLocationDisasterLevel(post.received_location)
                    const isOffer = post.type === 'offer'

                    return (
                      <article
                        key={post.id}
                        className="request-card"
                        style={{
                          background: isOffer ? '#f0fdf4' : '#fff7ed',
                          border: isOffer ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                          borderRadius: '12px',
                          padding: '18px',
                          marginBottom: '16px',
                        }}
                      >
                        <div className="card-top" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          {/* 提供 / 依頼 テキストラベル */}
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isOffer ? '#166534' : '#c2410c',
                              color: '#ffffff',
                            }}
                          >
                            【{isOffer ? '提供' : '依頼'}】
                          </span>

                          <Badge tone={post.urgency === '高' ? 'red' : post.urgency === '中' ? 'amber' : 'blue'}>
                            緊急度: {post.urgency}
                          </Badge>

                          {postLevel >= 3 && (
                            <span style={{ fontSize: '11px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                              受け取り場所Lv.3 (停止)
                            </span>
                          )}

                          <span className="card-time" style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>
                            <Clock3 size={13} /> {new Date(post.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '17px', margin: '0 0 8px', color: '#0f172a' }}>{post.title}</h3>
                        <p className="card-body" style={{ color: '#334155', fontSize: '14px', lineHeight: 1.5, marginBottom: '12px' }}>
                          {post.description}
                        </p>

                        <div className="card-meta" style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                          <span><Package size={15} /> カテゴリ: <b>{post.category}</b></span>
                          <span><MapPin size={15} /> 受け取り場所: <b>{post.received_location}</b></span>
                        </div>

                        <div className="card-bottom" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="primary-button"
                            onClick={() => setSelectedPost(post)}
                            style={{
                              background: postLevel >= 3 ? '#94a3b8' : isOffer ? '#166534' : '#c2410c',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            詳細を見る・{user.role === 'victim' ? '支援を受け取る' : '支援を申し出る'} <ChevronRight size={15} />
                          </button>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* 投稿タブ content */}
          {tab === '投稿' && (
            <div className="form-wrap">
              <div className="form-intro">
                <div className="big-icon"><HeartHandshake size={25} /></div>
                <div>
                  <h2>{user.role === 'victim' ? '支援の依頼を投稿' : '物資の提供を投稿'}</h2>
                  <p>
                    {user.role === 'victim'
                      ? '避難生活で不足している物資や依頼内容を入力してください。'
                      : '提供可能な物資と受け取り場所を指定してください。'}
                  </p>
                </div>
              </div>

              <div className="form-card">
                <label>
                  {user.role === 'victim' ? '必要な物資（タイトル）' : '提供できる物資（タイトル）'}
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder={user.role === 'victim' ? '例：飲料水500mlを12本希望' : '例：毛布・防寒具をお渡しできます'}
                  />
                </label>

                <div className="form-grid">
                  <label>
                    カテゴリ
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as PostCategory })}>
                      <option value="食料">食料</option>
                      <option value="飲料">飲料</option>
                      <option value="衣類">衣類</option>
                      <option value="医薬品">医薬品</option>
                      <option value="生活用品">生活用品</option>
                      <option value="電気機器">電気機器</option>
                      <option value="その他">その他</option>
                    </select>
                  </label>

                  <label>
                    数量（任意）
                    <input
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                      placeholder="例：24本、3箱"
                    />
                  </label>
                </div>

                <label>
                  受け取り場所（※この場所の災害レベルを判定します）
                  <input
                    value={form.place}
                    onChange={e => setForm({ ...form, place: e.target.value })}
                    placeholder="例：鳥取県米子市河井町 避難所前"
                  />
                </label>

                <div className="form-grid">
                  <label>
                    緊急度
                    <div className="segmented">
                      {(['低', '中', '高'] as UrgencyLevel[]).map(x => (
                        <button
                          type="button"
                          key={x}
                          className={form.urgency === x ? 'selected' : ''}
                          onClick={() => setForm({ ...form, urgency: x })}
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>

                <label>
                  詳細・補足説明
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="避難所での受け渡し時間や詳細を入力してください"
                    rows={4}
                  />
                </label>

                <div className="form-actions">
                  <button className="secondary-button" onClick={() => setDraftSaved(true)}>
                    <FileText size={16} /> 下書き保存
                  </button>
                  <button className="primary-button" onClick={submitPost}>
                    <Send size={16} /> {user.role === 'victim' ? '依頼を投稿する' : '提供を投稿する'}
                  </button>
                </div>
                {draftSaved && <p className="saved-note"><Check size={15} /> 下書きを端末に保存しました</p>}
              </div>
            </div>
          )}

          {/* 地図タブ content */}
          {tab === '地図' && (
            <DisasterMap onNotice={showNotice} role={user.role === 'victim' ? '被災者' : '支援者'} />
          )}

          {/* マイページタブ content */}
          {tab === 'マイページ' && (
            <div className="mypage">
              <div className="profile-card">
                <Link className="primary-button" href="/account/declaration">
                  災害時の自己申告・役割設定
                </Link>
                <div className="avatar">{user.name.slice(0, 1)}</div>
                <div>
                  <h2>{user.name}</h2>
                  <p>
                    現在の役割: <b>{user.role === 'victim' ? '被災者' : '支援者'}</b>
                  </p>
                  <small>災害発生地域: {user.disaster_prefecture} {user.disaster_city}</small>
                </div>
              </div>

              <div className="role-switch-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginTop: '16px' }}>
                <h3>災害時の役割切り替え（自己申告）</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                  「被災者」と「支援者」を即時切り替えられます。切り替えると検索・投稿機能が対応したモードになります。
                </p>
                <div className="segmented" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', border: user.role === 'victim' ? '2px solid #c2410c' : '1px solid #cbd5e1', background: user.role === 'victim' ? '#fff7ed' : '#ffffff', color: user.role === 'victim' ? '#c2410c' : '#475569' }}
                    onClick={() => {
                      saveUserProfile({ role: 'victim' })
                      refreshUser()
                      showNotice('「被災者」モードに切り替えました')
                    }}
                  >
                    被災者 (依頼モード)
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', border: user.role === 'supporter' ? '2px solid #166534' : '1px solid #cbd5e1', background: user.role === 'supporter' ? '#f0fdf4' : '#ffffff', color: user.role === 'supporter' ? '#166534' : '#475569' }}
                    onClick={() => {
                      saveUserProfile({ role: 'supporter' })
                      refreshUser()
                      showNotice('「支援者」モードに切り替えました')
                    }}
                  >
                    支援者 (提供モード)
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* フッター Footer: 地域 + 災害レベル */}
      <footer
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} color="#38bdf8" />
          <span><b>登録地域：</b>{user.disaster_prefecture} {user.disaster_city}</span>
          <span style={{ marginLeft: '12px', background: currentDisasterLevel === 3 ? '#ef4444' : currentDisasterLevel > 0 ? '#eab308' : '#22c55e', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
            災害レベル {currentDisasterLevel}
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          明日の環（アスノワ）災害共助プラットフォーム
        </div>
      </footer>

      {/* モバイルナビ Mobile Nav */}
      <nav className="mobile-nav">
        {(['検索', '投稿', '地図', 'チャット', 'マイページ'] as Tab[]).map((x, i) => {
          const IconComponent = [Search, Plus, MapPin, MessageCircle, UserRound][i]
          return (
            <button key={x} className={tab === x ? 'active' : ''} onClick={() => selectTab(x)}>
              <IconComponent size={20} />
              <span>{x}</span>
            </button>
          )
        })}
      </nav>

      {/* 投稿詳細モーダル */}
      {selectedPost && (
        <div className="modal-backdrop" onClick={() => setSelectedPost(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
            <button className="modal-close" onClick={() => setSelectedPost(null)}>
              <X size={19} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 700, color: selectedPost.type === 'offer' ? '#166534' : '#c2410c' }}>
              【{selectedPost.type === 'offer' ? '提供' : '依頼'}】
            </span>
            <h2 style={{ fontSize: '18px', margin: '8px 0 12px' }}>{selectedPost.title}</h2>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>{selectedPost.description}</p>

            <div className="detail-row" style={{ marginBottom: '8px', fontSize: '13px' }}>
              <MapPin size={17} /> <b>受け取り場所：</b> {selectedPost.received_location}
            </div>
            <div className="detail-row" style={{ marginBottom: '16px', fontSize: '13px' }}>
              <Package size={17} /> <b>カテゴリ：</b> {selectedPost.category}
            </div>

            <button
              className="primary-button full"
              onClick={() => handleApplyPost(selectedPost)}
              style={{ width: '100%', padding: '12px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              <HeartHandshake size={17} />
              {user.role === 'victim' ? 'この提供物資を受け取る (マッチング申請)' : 'この依頼を支援する (マッチング申請)'}
            </button>
          </div>
        </div>
      )}

      {/* レベル制限モーダル */}
      {modalLockMsg && (
        <div className="modal-backdrop" onClick={() => setModalLockMsg(null)}>
          <div className="modal locked-state" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '420px', textAlign: 'center' }}>
            <LockKeyhole size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#0f172a' }}>災害レベル制限</h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              {modalLockMsg}
            </p>
            <button className="primary-button full" onClick={() => setModalLockMsg(null)} style={{ width: '100%', padding: '10px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
              確認しました
            </button>
          </div>
        </div>
      )}

      {/* トースト通知 Toast */}
      {notice && (
        <div className="toast">
          <Check size={17} /> {notice}
        </div>
      )}
    </main>
  )
}
