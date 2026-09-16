'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Check, ChevronRight, Clock3,
  FileText, Flag, HeartHandshake, MapPin, Menu,
  MessageCircle, Package, Search, Send, ShieldCheck,
  SlidersHorizontal, UserRound, X, Plus, LogIn, LockKeyhole
} from 'lucide-react'

import {
  getUserProfile, saveUserProfile, getCityDisasterLevel, getLocationDisasterLevel,
  getSortedFilteredPosts, addPost, applyAndCreateMatch
} from '@/lib/store'
import { UserRole, PostCategory, UrgencyLevel, PostItem } from '@/lib/types'
import { PREFECTURES, getCitiesByPrefecture } from '@/lib/cities'
import ReportModal from '@/components/report-modal'

const DisasterMap = dynamic(() => import('@/components/disaster-map'), { ssr: false })

type Tab = 'ホーム' | '地図' | '検索' | '投稿' | 'チャット' | 'マイページ'

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'red' | 'amber' | 'green' | 'blue' | 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export default function Page() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('検索')

  // ユーザープロファイル
  const [user, setUser] = useState(getUserProfile())

  // 災害レベル (ユーザー登録地域)
  const currentDisasterLevel = useMemo(() => {
    return getCityDisasterLevel(user.disaster_prefecture, user.disaster_city)
  }, [user.disaster_prefecture, user.disaster_city])

  const [query, setQuery] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('すべて')
  const [categoryFilter, setCategoryFilter] = useState('すべて')
  const [typeFilter, setTypeFilter] = useState<'すべて' | 'request' | 'offer'>('すべて')
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
  const [reportTargetPost, setReportTargetPost] = useState<PostItem | null>(null)

  const [notice, setNotice] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)
  const [modalLockMsg, setModalLockMsg] = useState<string | null>(null)

  // 投稿フォーム状態
  const [form, setForm] = useState<{
    title: string
    category: PostCategory
    quantity: string
    placePref: string
    placeCity: string
    placeDetail: string
    urgency: UrgencyLevel
    description: string
    postType: 'request' | 'offer'
    tags: string
  }>({
    title: '',
    category: '飲料',
    quantity: '',
    placePref: user.disaster_prefecture || '鳥取県',
    placeCity: user.disaster_city || '米子市',
    placeDetail: '',
    urgency: '中',
    description: '',
    postType: user.user_role === 'victim' ? 'request' : 'offer',
    tags: '',
  })

  useEffect(() => {
    const freshUser = getUserProfile()
    setUser(freshUser)
    setForm(prev => ({
      ...prev,
      placePref: freshUser.disaster_prefecture,
      placeCity: freshUser.disaster_city,
      postType: freshUser.user_role === 'victim' ? 'request' : 'offer',
    }))
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
    if (nextTab === 'マイページ') {
      router.push('/account')
      return
    }
    setTab(nextTab)
  }

  // ソート・フィルタリング投稿一覧
  const postsList = useMemo(() => {
    const sorted = getSortedFilteredPosts(user.disaster_prefecture, user.disaster_city, user.user_role)

    const terms = query.split(/[、,\s]+/).map(t => t.trim()).filter(Boolean)
    return sorted.filter(p => {
      const searchable = `${p.title} ${p.category} ${p.received_location} ${p.user_name} ${(p.tags ?? []).join(' ')}`.toLowerCase()
      const matchesQuery = terms.length === 0 || terms.some(t => searchable.includes(t.toLowerCase()))
      const matchesUrgency = urgencyFilter === 'すべて' || p.urgency === urgencyFilter
      const matchesCategory = categoryFilter === 'すべて' || p.category === categoryFilter
      const matchesType = typeFilter === 'すべて' || p.type === typeFilter
      return matchesQuery && matchesUrgency && matchesCategory && matchesType
    })
  }, [user.disaster_prefecture, user.disaster_city, user.user_role, query, urgencyFilter, categoryFilter, typeFilter])

  // 投稿送信ハンドラ
  const submitPost = () => {
    if (user.account_status === 'frozen') {
      setModalLockMsg('ご利用のアカウントは凍結されているため、投稿機能はご利用いただけません。')
      return
    }

    if (!form.title.trim()) {
      showNotice('タイトルを入力してください')
      return
    }

    const fullPlace = `${form.placePref}${form.placeCity} ${form.placeDetail}`.trim()

    const res = addPost({
      title: form.title.trim(),
      category: form.category,
      type: user.user_role === 'both' ? form.postType : undefined,
      description: form.description + (form.quantity ? ` (数量: ${form.quantity})` : ''),
      received_location: fullPlace,
      urgency: form.urgency,
      tags: form.tags.split(/[、,\s]+/).map(t => t.trim()).filter(Boolean),
    })

    if (!res.success) {
      setModalLockMsg(res.error ?? '投稿できませんでした')
      return
    }

    showNotice(form.postType === 'request' ? '支援依頼を公開しました' : '支援提供を公開しました')
    setForm({
      title: '',
      category: '飲料',
      quantity: '',
      placePref: user.disaster_prefecture,
      placeCity: user.disaster_city,
      placeDetail: '',
      urgency: '中',
      description: '',
      postType: user.user_role === 'victim' ? 'request' : 'offer',
      tags: '',
    })
    setTab('検索')
  }

  // 応募/申し出ハンドラ
  const handleApplyPost = (post: PostItem) => {
    if (user.account_status === 'frozen') {
      setSelectedPost(null)
      setModalLockMsg('ご利用のアカウントは凍結されているため、マッチング申請はできません。')
      return
    }

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
      }, 800)
    } else if (res.error) {
      setModalLockMsg(res.error)
    }
  }

  const roleLabel =
    user.user_role === 'victim'
      ? '被災者 (依頼)'
      : user.user_role === 'supporter'
      ? '支援者 (提供)'
      : '共助 (依頼・提供)'

  const availableCitiesForPost = getCitiesByPrefecture(form.placePref)

  return (
    <main className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* 1. ヘッダー Header (仕様書 7.2項: 登録地域と災害レベルをヘッダーへ移動・表示) */}
      <header
        className="topbar"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '0 20px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* ロゴ & ブランド */}
        <Link href="/" className="brand" aria-label="明日の環（アスノワ）ホーム" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-mark" style={{ background: 'transparent', padding: 0 }}>
            <img src="/asunowa.png" alt="明日の環" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <div>
            <strong style={{ fontSize: '17px', letterSpacing: '0.04em', color: '#0f172a' }}>明日の環</strong>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>アスノワ 災害時共助</span>
          </div>
        </Link>

        {/* PC 上部タブナビゲーション (仕様書 1.2項, 7.1項: PCでは上部タブナビゲーションを採用) */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
          }}
        >
          {(['ホーム', '地図', '検索', '投稿', 'チャット', 'マイページ'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => selectTab(t)}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer',
                background: tab === t ? '#ffffff' : 'transparent',
                color: tab === t ? '#0284c7' : '#475569',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {t}
            </button>
          ))}
        </nav>

        {/* ヘッダー右側: 登録地域 + 災害レベル + ユーザー情報 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 登録地域 & 災害レベル (仕様書: ヘッダー内の「災害地域」の右隣にLvを表示) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
            }}
          >
            <MapPin size={14} color="#0284c7" />
            <span><b>{user.disaster_prefecture} {user.disaster_city}</b></span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
                color: '#ffffff',
                background: currentDisasterLevel === 3 ? '#ef4444' : currentDisasterLevel > 0 ? '#eab308' : '#16a34a',
              }}
            >
              Lv.{currentDisasterLevel}
            </span>
          </div>

          {/* ユーザー表示名・役割 */}
          <Link
            href="/account"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <UserRound size={15} />
            <span>{user.name}</span>
          </Link>

          {/* 管理者リンク */}
          <Link
            href="/admin"
            className="secondary-button"
            style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="管理者コンソール"
          >
            <ShieldCheck size={14} />
            <span className="admin-btn-text">管理画面</span>
          </Link>
        </div>
      </header>

      {/* 凍結時のバナー通知 (仕様書 20.2項) */}
      {user.account_status === 'frozen' && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecdd3', color: '#991b1b', padding: '10px 20px', fontSize: '12px', textAlign: 'center' }}>
          <b>【アカウント凍結中】</b> ログイン・地図閲覧・検索閲覧は可能ですが、投稿・チャット・通報機能はご利用いただけません。
        </div>
      )}

      {/* 災害レベル3時のアラートバー */}
      {currentDisasterLevel >= 3 && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2', color: '#b91c1c', padding: '10px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span><b>危険レベル(Lv.3)：</b> {user.disaster_prefecture}{user.disaster_city}周辺では安全確保のため新規物資投稿・マッチング受付を一時停止しています。</span>
        </div>
      )}

      {/* メインコンテンツ エリア */}
      <div style={{ flex: 1, maxWidth: '1080px', width: '100%', margin: '0 auto', padding: '24px 16px 80px' }}>
        
        {/* ホームタブ */}
        {tab === 'ホーム' && (
          <div>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px 24px', border: '1px solid #e2e8f0', marginBottom: '24px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '26px', margin: '0 0 12px', color: '#0f172a' }}>
                必要な人と、支えたい人をつなぐ共助プラットフォーム
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                明日の環（アスノワ）は、被災時の物資支援や危険箇所の情報共有を、地域の安全レベルに合わせて提供する共助アプリです。
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="primary-button" onClick={() => setTab('検索')}>
                  <Search size={16} /> 物資支援一覧を見る
                </button>
                <button type="button" className="secondary-button" onClick={() => setTab('地図')}>
                  <MapPin size={16} /> 地図で安全情報を確認
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 検索タブ content */}
        {tab === '検索' && (
          <div>
            <div className="content-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <p className="eyebrow" style={{ color: '#0284c7', fontWeight: 700, fontSize: '12px', margin: '0 0 4px' }}>
                  共助マッチング一覧
                </p>
                <h1 style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>
                  {user.user_role === 'victim' ? '支援者の「提供」物資一覧' : user.user_role === 'supporter' ? '被災者の「依頼」物資一覧' : '支援「依頼・提供」一覧'}
                </h1>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => setTab('投稿')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                {user.user_role === 'victim' ? '依頼を投稿する' : user.user_role === 'supporter' ? '提供を投稿する' : '新規投稿を作成'}
              </button>
            </div>

            {/* 検索・絞り込みバー */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div className="search-input" style={{ flex: 1, minWidth: '240px' }}>
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="物資名、市区町村名、投稿者名で検索..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', alignItems: 'center', color: '#64748b' }}>
                {/* 共助ユーザー向け種別切り替え */}
                {user.user_role === 'both' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>種別:</span>
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value as any)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="すべて">すべて (依頼/提供)</option>
                      <option value="request">依頼のみ</option>
                      <option value="offer">提供のみ</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>緊急度:</span>
                  {['すべて', '高', '中', '低'].map(x => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => setUrgencyFilter(x)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: urgencyFilter === x ? '1px solid #0284c7' : '1px solid #e2e8f0',
                        background: urgencyFilter === x ? '#f0f9ff' : '#ffffff',
                        color: urgencyFilter === x ? '#0284c7' : '#475569',
                        fontWeight: urgencyFilter === x ? 700 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {x}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>カテゴリ:</span>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="すべて">全カテゴリ</option>
                    <option value="食料">食料</option>
                    <option value="飲料">飲料</option>
                    <option value="衣類">衣類</option>
                    <option value="医薬品">医薬品</option>
                    <option value="生活用品">生活用品</option>
                    <option value="電気機器">電気機器</option>
                    <option value="乳幼児用品">乳幼児用品</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 投稿カード一覧 */}
            <div className="request-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {postsList.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                  <Package size={40} style={{ marginBottom: '12px', color: '#94a3b8' }} />
                  <h3 style={{ fontSize: '16px', margin: '0 0 6px' }}>該当する投稿がありません</h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>検索条件を変更するか、右上のボタンから新規投稿を行ってください。</p>
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
                        background: '#ffffff',
                        border: isOffer ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div className="card-top" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
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
                          <span style={{ fontSize: '10px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                            受取地Lv.3停止中
                          </span>
                        )}

                        <span className="card-time" style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b' }}>
                          <Clock3 size={12} /> {new Date(post.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '16px', margin: '4px 0 8px', color: '#0f172a', fontWeight: 700 }}>
                        {post.title}
                      </h3>
                      
                      <p className="card-body" style={{ color: '#334155', fontSize: '13px', lineHeight: 1.5, marginBottom: '12px', flex: 1 }}>
                        {post.description}
                      </p>

                      {/* 投稿者表示名 (仕様書 10.2項: 投稿には必ず投稿者の表示名を表示する) */}
                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                        <div>投稿者：<b>{post.user_name || '明日の環ユーザー'}</b></div>
                        <div style={{ marginTop: '2px', color: '#64748b' }}><MapPin size={12} style={{ display: 'inline' }} /> 受取地: {post.received_location}</div>
                      </div>

                      <div className="card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        <button
                          type="button"
                          className="text-button"
                          style={{ color: '#e11d48', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                          onClick={() => setReportTargetPost(post)}
                        >
                          <Flag size={13} /> 通報
                        </button>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => setSelectedPost(post)}
                          style={{
                            background: postLevel >= 3 ? '#94a3b8' : isOffer ? '#166534' : '#c2410c',
                            color: 'white',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          詳細・{isOffer ? '受け取る' : '支援する'} <ChevronRight size={14} />
                        </button>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* 投稿作成タブ content */}
        {tab === '投稿' && (
          <div className="form-wrap" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div className="form-intro" style={{ marginBottom: '18px' }}>
              <div className="big-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <HeartHandshake size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>
                  {user.user_role === 'victim' ? '支援の依頼を投稿' : user.user_role === 'supporter' ? '物資の提供を投稿' : '新規物資投稿（依頼 / 提供）'}
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  投稿者名として「<b>{user.name}</b>」が表示されます。
                </p>
              </div>
            </div>

            <div className="form-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
              {/* 共助ユーザー向けの依頼/提供選択 */}
              {user.user_role === 'both' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>投稿の種類</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, postType: 'request' })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: form.postType === 'request' ? '2px solid #c2410c' : '1px solid #cbd5e1',
                        background: form.postType === 'request' ? '#fff7ed' : '#ffffff',
                        color: form.postType === 'request' ? '#c2410c' : '#475569',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      依頼（物資を必要としている）
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, postType: 'offer' })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: form.postType === 'offer' ? '2px solid #166534' : '1px solid #cbd5e1',
                        background: form.postType === 'offer' ? '#f0fdf4' : '#ffffff',
                        color: form.postType === 'offer' ? '#166534' : '#475569',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      提供（物資をお渡しできる）
                    </button>
                  </div>
                </div>
              )}

              <label style={{ display: 'block', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>タイトル</span>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={form.postType === 'request' ? '例：粉ミルクとおむつMサイズが必要です' : '例：保存水500ml 24本お渡しできます'}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <label>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>カテゴリ</span>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as PostCategory })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  >
                    <option value="食料">食料</option>
                    <option value="飲料">飲料</option>
                    <option value="衣類">衣類</option>
                    <option value="医薬品">医薬品</option>
                    <option value="生活用品">生活用品</option>
                    <option value="電気機器">電気機器</option>
                    <option value="乳幼児用品">乳幼児用品</option>
                    <option value="その他">その他</option>
                  </select>
                </label>

                <label>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>数量（任意）</span>
                  <input
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    placeholder="例：24本、3箱"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </label>
              </div>

              {/* 受け取り場所設定 */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>受け取り場所（都道府県・市区町村・施設名等）</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <select
                    value={form.placePref}
                    onChange={e => {
                      const pref = e.target.value
                      setForm({ ...form, placePref: pref, placeCity: getCitiesByPrefecture(pref)[0]?.city || '' })
                    }}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    {PREFECTURES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  <select
                    value={form.placeCity}
                    onChange={e => setForm({ ...form, placeCity: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    {availableCitiesForPost.map(c => (
                      <option key={c.city} value={c.city}>{c.city}</option>
                    ))}
                  </select>
                </div>

                <input
                  value={form.placeDetail}
                  onChange={e => setForm({ ...form, placeDetail: e.target.value })}
                  placeholder="例：〇〇避難所前、市役所第2駐車場"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>緊急度</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['低', '中', '高'] as UrgencyLevel[]).map(x => (
                    <button
                      type="button"
                      key={x}
                      onClick={() => setForm({ ...form, urgency: x })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: form.urgency === x ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: form.urgency === x ? '#f0f9ff' : '#ffffff',
                        color: form.urgency === x ? '#0284c7' : '#334155',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>詳細・補足説明</span>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="受取希望日時やアレルギーの有無、受取方法などを入力してください"
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setDraftSaved(true)}>
                  <FileText size={15} /> 下書き保存
                </button>
                <button type="button" className="primary-button" onClick={submitPost}>
                  <Send size={15} /> 投稿を公開する
                </button>
              </div>

              {draftSaved && <p className="saved-note" style={{ marginTop: '10px', color: '#16a34a', fontSize: '12px' }}><Check size={14} /> 下書きを保存しました</p>}
            </div>
          </div>
        )}

        {/* 地図タブ content */}
        {tab === '地図' && (
          <DisasterMap onNotice={showNotice} role={user.role === 'admin' ? '管理者' : user.user_role === 'victim' ? '被災者' : '支援者'} />
        )}
      </div>

      {/* モバイル用ボトムナビゲーション (仕様書 7.1項: スマホでも押しやすい形で表示) */}
      <nav className="mobile-nav">
        {([
          { name: '検索', icon: Search },
          { name: '投稿', icon: Plus },
          { name: '地図', icon: MapPin },
          { name: 'チャット', icon: MessageCircle },
          { name: 'マイページ', icon: UserRound },
        ] as const).map((item) => {
          const IconComp = item.icon
          const isActive = tab === item.name
          return (
            <button
              key={item.name}
              type="button"
              className={isActive ? 'active' : ''}
              onClick={() => selectTab(item.name as Tab)}
            >
              <IconComp size={20} />
              <span>{item.name}</span>
            </button>
          )
        })}
      </nav>

      {/* 投稿詳細モーダル */}
      {selectedPost && (
        <div className="modal-backdrop" onClick={() => setSelectedPost(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', maxWidth: '480px', width: '92%' }}>
            <button className="modal-close" onClick={() => setSelectedPost(null)}>
              <X size={18} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 700, color: selectedPost.type === 'offer' ? '#166534' : '#c2410c' }}>
              【{selectedPost.type === 'offer' ? '提供' : '依頼'}】
            </span>
            <h2 style={{ fontSize: '18px', margin: '8px 0 10px' }}>{selectedPost.title}</h2>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, marginBottom: '14px' }}>{selectedPost.description}</p>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
              <div><b>投稿者：</b> {selectedPost.user_name}</div>
              <div style={{ marginTop: '4px' }}><b>受け取り場所：</b> {selectedPost.received_location}</div>
              <div style={{ marginTop: '4px' }}><b>カテゴリ：</b> {selectedPost.category}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="secondary-button"
                style={{ color: '#e11d48', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => {
                  const target = selectedPost
                  setSelectedPost(null)
                  setReportTargetPost(target)
                }}
              >
                <Flag size={14} /> 通報
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => handleApplyPost(selectedPost)}
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                <HeartHandshake size={16} />
                {selectedPost.type === 'offer' ? 'この提供物資を受け取る (マッチング)' : 'この依頼を支援する (マッチング)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* レベル制限・凍結モーダル */}
      {modalLockMsg && (
        <div className="modal-backdrop" onClick={() => setModalLockMsg(null)}>
          <div className="modal locked-state" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <LockKeyhole size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '17px', marginBottom: '10px', color: '#0f172a' }}>機能利用制限</h2>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '18px' }}>
              {modalLockMsg}
            </p>
            <button className="primary-button full" onClick={() => setModalLockMsg(null)} style={{ padding: '10px', width: '100%', justifyContent: 'center' }}>
              確認しました
            </button>
          </div>
        </div>
      )}

      {/* 通報モーダル */}
      {reportTargetPost && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTargetPost(null)}
          targetType="post"
          targetId={reportTargetPost.id}
          targetTitle={reportTargetPost.title}
          targetAuthorName={reportTargetPost.user_name}
          onReportSuccess={() => {
            showNotice('通報を受け付けました')
          }}
        />
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
