'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Check, ChevronRight, Clock3,
  FileText, Flag, HeartHandshake, MapPin, Menu,
  MessageCircle, Package, Search, Send, ShieldCheck,
  SlidersHorizontal, UserRound, X, Plus, LogIn, LockKeyhole,
  ChevronDown, Home as HomeIcon, Map as MapIcon, MessageSquare,
  Sparkles, Power
} from 'lucide-react'

import {
  getUserProfile, saveUserProfile, getCityDisasterLevel, getLocationDisasterLevel,
  getSortedFilteredPosts, addPost, applyAndCreateMatch, getDisasterLevels,
  getSystemStatus, isWithin12Hours
} from '@/lib/store'
import { UserRole, PostCategory, UrgencyLevel, PostItem, DisasterLevelItem } from '@/lib/types'
import { PREFECTURES, getCitiesByPrefecture } from '@/lib/cities'
import ReportModal from '@/components/report-modal'

const DisasterMap = dynamic(() => import('@/components/disaster-map'), { ssr: false })

type Tab = '検索' | '投稿' | '地図' | 'チャット' | 'マイページ'

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'red' | 'amber' | 'green' | 'blue' | 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export default function Page() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('検索')

  // ユーザープロファイル
  const [user, setUser] = useState(getUserProfile())

  // システム全面停止状態
  const [isSystemStopped, setIsSystemStopped] = useState(false)

  // 災害レベル
  const disasterLevels = useMemo(() => getDisasterLevels(), [])

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
  const [modalLockMsg, setModalLockMsg] = useState<string | null>(null)

  // 5-1. 投稿フォーム状態 (物資カテゴリの複数選択対応)
  const [form, setForm] = useState<{
    categories: PostCategory[]
    quantity: string
    placePref: string
    placeCity: string
    placeDetail: string
    urgency: UrgencyLevel
    description: string
    postType: 'request' | 'offer'
    tags: string
  }>({
    categories: ['食料'],
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
    setIsSystemStopped(getSystemStatus().is_stopped)
    setForm(prev => ({
      ...prev,
      placePref: freshUser.disaster_prefecture || '鳥取県',
      placeCity: freshUser.disaster_city || '米子市',
      postType: freshUser.user_role === 'victim' ? 'request' : 'offer',
    }))
  }, [tab])

  const showNotice = (text: string) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 3000)
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

  // ソート・フィルタリング投稿一覧 (活動地域最優先 & 複数カテゴリ対応)
  const postsList = useMemo(() => {
    const sorted = getSortedFilteredPosts(user.disaster_prefecture, user.disaster_city, user.user_role)

    const terms = query.split(/[、,\s]+/).map(t => t.trim()).filter(Boolean)
    return sorted.filter(p => {
      const catString = p.categories ? p.categories.join(' ') : p.category
      const searchable = `${p.description} ${catString} ${p.received_location} ${p.user_name} ${(p.tags ?? []).join(' ')}`.toLowerCase()
      const matchesQuery = terms.length === 0 || terms.some(t => searchable.includes(t.toLowerCase()))
      const matchesUrgency = urgencyFilter === 'すべて' || p.urgency === urgencyFilter

      const matchesCategory = categoryFilter === 'すべて' || (
        p.categories
          ? p.categories.includes(categoryFilter as PostCategory)
          : p.category === categoryFilter
      )
      const matchesType = typeFilter === 'すべて' || p.type === typeFilter
      return matchesQuery && matchesUrgency && matchesCategory && matchesType
    })
  }, [user.disaster_prefecture, user.disaster_city, user.user_role, query, urgencyFilter, categoryFilter, typeFilter])

  // 5-1. 投稿送信ハンドラ (複数選択カテゴリ対応)
  const submitPost = () => {
    if (user.account_status === 'frozen') {
      setModalLockMsg('ご利用のアカウントは凍結されているため、投稿機能はご利用いただけません。')
      return
    }

    if (form.categories.length === 0) {
      showNotice('物資カテゴリを1つ以上選択してください')
      return
    }

    if (!form.description.trim()) {
      showNotice('投稿内容・説明を入力してください')
      return
    }

    const fullPlace = `${form.placePref}${form.placeCity} ${form.placeDetail}`.trim()

    const res = addPost({
      categories: form.categories,
      category: form.categories[0],
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
      categories: ['食料'],
      quantity: '',
      placePref: user.disaster_prefecture || '鳥取県',
      placeCity: user.disaster_city || '米子市',
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

  const availableCitiesForPost = getCitiesByPrefecture(form.placePref)

  return (
    <main className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '80px', background: '#f8fafc' }}>

      {/* 通知トースト */}
      {notice && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#ffffff', padding: '10px 20px', borderRadius: '20px', fontSize: '13px', zIndex: 9999 }}>
          {notice}
        </div>
      )}

      {/* システム全面停止時のオーバーレイ案内画面 */}
      {isSystemStopped && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.92)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              maxWidth: '540px',
              width: '100%',
              borderRadius: '20px',
              padding: '32px 24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <Power size={32} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 16px', color: '#991b1b' }}>
              現在、サービスの提供を一時停止しております
            </h2>

            <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155', textAlign: 'left', background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              いつもご利用いただきありがとうございます。現在、誤情報（デマ）の拡散防止およびシステム確認のため、すべての機能を一時的に停止しております。ご利用の皆様にはご不便・ご迷惑をおかけいたしますが、ご理解とご協力のほどよろしくお願い申し上げます。
            </p>

            <div style={{ textAlign: 'left', background: '#eff6ff', padding: '14px', borderRadius: '12px', fontSize: '13px', color: '#1e40af' }}>
              <strong>■ 再開について</strong>
              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                状況の安全が確認でき次第、順次サービスを再開いたします。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3-1, 4-1: ヘッダー (左上アイコン asunowa.png ＆ タブ表示改善) */}
      <header
        className="topbar"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '0 16px',
          minHeight: '68px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px', padding: '6px 0' }}>
          {/* 4-1 左上アイコン public/asunowa.png */}
          <Link href="/" className="brand" aria-label="明日の環 ホーム" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/asunowa.png" alt="明日の環" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <strong style={{ fontSize: '16px', letterSpacing: '0.02em', color: '#0f172a', display: 'block' }}>明日の環</strong>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>アスノワ災害時共助</span>
            </div>
          </Link>

          {/* 右上: 活動地域 & レベル */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user.disaster_city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '16px', fontSize: '12px' }}>
                <MapPin size={13} color="#0284c7" />
                <span><b>{user.disaster_city}</b></span>
                <span style={{ fontSize: '10px', fontWeight: 'bold', background: currentDisasterLevel === 3 ? '#ef4444' : '#16a34a', color: '#ffffff', padding: '1px 6px', borderRadius: '8px' }}>
                  Lv.{currentDisasterLevel}
                </span>
              </div>
            )}

            <Link href="/account" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <UserRound size={15} />
              <span>{user.name || 'マイページ'}</span>
              {user.is_verified && <img src="/ninsyou.png" alt="認証" style={{ height: '14px' }} />}
            </Link>
          </div>
        </div>

      </header>

      {/* アラートロックメッセージ モーダル */}
      {modalLockMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 10px', fontSize: '17px' }}>利用制限・お知らせ</h3>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>{modalLockMsg}</p>
            <button className="primary-button full" onClick={() => setModalLockMsg(null)}>
              確認しました
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツ エリア */}
      <div style={{ flex: 1, maxWidth: '1080px', width: '100%', margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* 7. 地図タブ */}
        {tab === '地図' && (
          <div>
            <DisasterMap
              role={user.role === 'admin' ? '管理者' : user.user_role === 'victim' ? '被災者' : '支援者'}
              onNotice={showNotice}
            />
          </div>
        )}

        {/* 5. 検索タブ */}
        {tab === '検索' && (
          <div>
            <div className="content-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ color: '#0284c7', fontWeight: 700, fontSize: '12px', margin: '0 0 4px' }}>
                  活動地域（基準地域）優先表示中
                </p>
                <h1 style={{ fontSize: '22px', margin: 0, color: '#0f172a' }}>
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
                新規投稿を作成
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
                    placeholder="物資名・市区町村・投稿者で検索..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', alignItems: 'center', color: '#64748b' }}>
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
                    {['すべて', '食料', '飲料', '衣類', '医薬品', '生活用品', '電気機器', '乳幼児用品', 'その他'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 投稿一覧 (8. 12時間以内表示 & 認証マーク表示) */}
            {postsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                <Package size={40} style={{ marginBottom: '12px' }} />
                <h3>条件に一致する投稿が見つかりません</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {postsList.map(post => {
                  const is12h = isWithin12Hours(post.created_at)
                  return (
                    <div
                      key={post.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: post.type === 'request' ? '#fef2f2' : '#f0fdf4',
                              color: post.type === 'request' ? '#991b1b' : '#166534',
                            }}
                          >
                            {post.type === 'request' ? '支援依頼' : '支援提供'} [{post.categories && post.categories.length > 0 ? post.categories.join('・') : post.category}]
                          </span>

                          {/* 8. 12時間以内表示 */}
                          {is12h && (
                            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', background: '#dcfce7', padding: '2px 6px', borderRadius: '10px' }}>
                              🟢 12時間以内
                            </span>
                          )}
                        </div>

                        {/* タイトル削除仕様のため説明を重視表示 */}
                        <p style={{ fontSize: '15px', color: '#0f172a', fontWeight: 600, margin: '0 0 10px', lineHeight: 1.5 }}>
                          {post.description}
                        </p>

                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                          受け取り場所: <b>{post.received_location}</b>
                        </div>

                        <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>投稿者: <b>{post.user_name}</b></span>
                          {/* 名前横の認証マーク */}
                          {post.is_verified_user && (
                            <img src="/ninsyou.png" alt="認証" style={{ height: '15px' }} title="本人確認済み" />
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <button
                          type="button"
                          className="primary-button"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                          onClick={() => handleApplyPost(post)}
                        >
                          {post.type === 'request' ? '支援を申し出る' : '物資を受け取る'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. 投稿タブ (タイトル欄を完全削除 & 例表示) */}
        {tab === '投稿' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 6px', color: '#0f172a' }}>支援情報の新規投稿</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              被災者の方は必要な物資依頼を、支援者の方は提供可能な物資を登録してください。
            </p>

            <form onSubmit={e => { e.preventDefault(); submitPost(); }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* 共助ユーザー向け種別選択 */}
              {user.user_role === 'both' && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>投稿の種別</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, postType: 'request' })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: form.postType === 'request' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                        background: form.postType === 'request' ? '#fef2f2' : '#ffffff',
                        color: form.postType === 'request' ? '#b91c1c' : '#475569',
                        fontWeight: 'bold',
                      }}
                    >
                      支援の依頼 (必要)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, postType: 'offer' })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: form.postType === 'offer' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        background: form.postType === 'offer' ? '#f0fdf4' : '#ffffff',
                        color: form.postType === 'offer' ? '#15803d' : '#475569',
                        fontWeight: 'bold',
                      }}
                    >
                      支援の提供 (お渡し)
                    </button>
                  </div>
                </div>
              )}

              {/* 5-1. 物資カテゴリの複数選択対応 */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#334155' }}>
                  物資カテゴリ (複数選択可能)
                </label>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  ※複数選択できます。あてはまるものをすべて選択してください。
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  {(['食料', '飲料水', '衣類', '医薬品', '生活用品', '衛生用品', '電気機器', '乳幼児用品', 'その他'] as PostCategory[]).map(cat => {
                    const isChecked = form.categories.includes(cat)
                    return (
                      <label
                        key={cat}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isChecked ? '1px solid #0284c7' : '1px solid #cbd5e1',
                          background: isChecked ? '#f0f9ff' : '#ffffff',
                          color: isChecked ? '#0284c7' : '#334155',
                          fontWeight: isChecked ? 'bold' : 'normal',
                          fontSize: '13px',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm(prev => ({ ...prev, categories: [...prev.categories, cat] }))
                            } else {
                              setForm(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }))
                            }
                          }}
                          style={{ accentColor: '#0284c7', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>{cat}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 4. 受け取り場所入力欄 (例表示: 例：物資ロッカー ○○前) */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>受け取り場所</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <select
                    value={form.placePref}
                    onChange={e => {
                      const pref = e.target.value
                      const cities = getCitiesByPrefecture(pref)
                      setForm({ ...form, placePref: pref, placeCity: cities[0]?.city || '' })
                    }}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select
                    value={form.placeCity}
                    onChange={e => setForm({ ...form, placeCity: e.target.value })}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {availableCitiesForPost.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="例：物資ロッカー ○○前"
                  value={form.placeDetail}
                  onChange={e => setForm({ ...form, placeDetail: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>詳細内容・説明</label>
                <textarea
                  placeholder="物資の数量や渡し方などの詳細を入力してください"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <button type="submit" className="primary-button full" style={{ padding: '12px', fontSize: '15px', fontWeight: 'bold', justifyContent: 'center' }}>
                支援情報を投稿する
              </button>
            </form>
          </div>
        )}

      </div>

      {/* フッター：ページ切り替えタブ */}
      {/* 3-1: ページ切り替えタブ (PCで文字切れを防ぎ横スクロール対応) */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
      }}
      >
        <nav
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2px',
            width: '100%',
            padding: '8px 6px',
            boxSizing: 'border-box',
            overflowX: 'auto',
          }}
        >
          {(['検索', '投稿', '地図', 'チャット', 'マイページ'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => selectTab(t)}
              style={{
                padding: '8px 8px',
                borderRadius: '8px',
                border: 'none',
                background: tab === t ? '#e0f2fe' : 'transparent',
                color: tab === t ? '#0284c7' : '#475569',
                fontWeight: tab === t ? 700 : 500,
                fontSize: '14px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                flexShrink: 0,
              }}
            >
              {t === '検索' && <Search size={15} />}
              {t === '投稿' && <Plus size={15} />}
              {t === '地図' && <MapIcon size={15} />}
              {t === 'チャット' && <MessageSquare size={15} />}
              {t === 'マイページ' && <UserRound size={15} />}
              <span>{t}</span>
            </button>
          ))}
        </nav>
      </footer>
    </main>
  )
}
