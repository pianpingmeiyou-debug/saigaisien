'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  UserRound, MapPin, HeartHandshake, ShieldCheck, FileText,
  Trash2, Edit3, Check, AlertTriangle, ArrowLeft, Plus, LogIn,
  KeyRound, HelpCircle, X, ShieldAlert, Sparkles, Navigation
} from 'lucide-react'
import {
  getUserProfile, saveUserProfile, getMyPosts, deletePost,
  updatePost, getCityDisasterLevel, setDemoUserMode, setAdminUserMode, loginWithUserCode
} from '@/lib/store'
import { PREFECTURES, getCitiesByPrefecture } from '@/lib/cities'
import { UserRole, PostItem, PostCategory } from '@/lib/types'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState(getUserProfile())
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile')
  const [myPosts, setMyPosts] = useState<PostItem[]>([])
  const [editingPost, setEditingPost] = useState<PostItem | null>(null)
  const [notice, setNotice] = useState('')

  // ユーザーコードログイン用入力
  const [inputUserCode, setInputUserCode] = useState('')

  // 会員証モーダル表示フラグ
  const [showCardModal, setShowCardModal] = useState(false)

  // 現在地共有推奨バナー表示フラグ
  const [showGpsRecommendation, setShowGpsRecommendation] = useState(true)

  // 編集用フォーム
  const [displayName, setDisplayName] = useState(user.name)
  const [userRole, setUserRole] = useState<UserRole>(user.user_role || 'victim')
  const [selectedPref, setSelectedPref] = useState(user.disaster_prefecture || '鳥取県')
  const [selectedCity, setSelectedCity] = useState(user.disaster_city || '米子市')

  // 投稿編集用
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPlace, setEditPlace] = useState('')

  const refreshUserData = () => {
    const u = getUserProfile()
    setUser(u)
    setDisplayName(u.name)
    setUserRole(u.user_role)
    setSelectedPref(u.disaster_prefecture || '鳥取県')
    setSelectedCity(u.disaster_city || '米子市')
    setMyPosts(getMyPosts(u.id))
  }

  useEffect(() => {
    refreshUserData()
  }, [])

  const showToast = (text: string) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 3000)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      showToast('公開表示名を入力してください')
      return
    }

    const updated = saveUserProfile({
      name: displayName.trim(),
      user_role: userRole,
      disaster_prefecture: selectedPref,
      disaster_city: selectedCity,
    })
    setUser(updated)
    showToast('プロフィールと活動地域を更新しました')
  }

  // デモボタンハンドラ
  const handleSwitchToDemo = () => {
    const updated = setDemoUserMode('victim')
    setUser(updated)
    setDisplayName(updated.name)
    setUserRole(updated.user_role)
    setSelectedPref(updated.disaster_prefecture)
    setSelectedCity(updated.disaster_city)
    showToast('デモユーザーとして切り替えました（会員証発行済み）')
  }

  // 管理者ボタンハンドラ
  const handleSwitchToAdmin = () => {
    const updated = setAdminUserMode()
    setUser(updated)
    showToast('管理者アカウントに切り替えました。管理者画面へ遷移します')
    setTimeout(() => {
      router.push('/admin')
    }, 600)
  }

  // ユーザーコードログインハンドラ
  const handleUserCodeLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const res = loginWithUserCode(inputUserCode)
    if (res.success && res.user) {
      setUser(res.user)
      setDisplayName(res.user.name)
      setUserRole(res.user.user_role)
      setSelectedPref(res.user.disaster_prefecture || '鳥取県')
      setSelectedCity(res.user.disaster_city || '米子市')
      setInputUserCode('')
      showToast(`ユーザーコード (${res.user.user_code}) でログインしました`)
    } else {
      showToast(res.error || 'ログインに失敗しました')
    }
  }

  const handleDeletePost = (postId: string) => {
    if (window.confirm('この投稿を削除しますか？')) {
      const res = deletePost(postId)
      if (res.success) {
        setMyPosts(getMyPosts(user.id))
        showToast('投稿を削除しました')
      } else {
        showToast(res.error || '削除できませんでした')
      }
    }
  }

  const openEditPost = (post: PostItem) => {
    setEditingPost(post)
    setEditTitle(post.title)
    setEditDesc(post.description)
    setEditPlace(post.received_location)
  }

  const handleSavePostEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPost) return

    const res = updatePost(editingPost.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      received_location: editPlace.trim(),
    })

    if (res.success) {
      setEditingPost(null)
      setMyPosts(getMyPosts(user.id))
      showToast('投稿を更新しました')
    } else {
      showToast(res.error || '更新できませんでした')
    }
  }

  const availableCities = getCitiesByPrefecture(selectedPref)
  const currentDisasterLevel = getCityDisasterLevel(user.disaster_prefecture, user.disaster_city)

  return (
    <main className="standalone-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* 通知トースト */}
      {notice && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#ffffff', padding: '10px 20px', borderRadius: '20px', fontSize: '13px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {notice}
        </div>
      )}

      {/* ヘッダー (1-2: 管理者切り替えボタン維持) */}
      <header className="standalone-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/" className="icon-button" aria-label="アプリトップへ戻る">
            <ArrowLeft size={20} />
          </Link>
          <div className="brand">
            <span className="brand-mark">
              <UserRound size={21} />
            </span>
            <span>
              <strong>マイページ</strong>
              <small>アカウント・活動地域・デジタル会員証</small>
            </span>
          </div>
        </div>

        {/* 1-1-1, 1-2: デモ & 管理者ボタン */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: '12px', padding: '6px 10px', background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}
            onClick={handleSwitchToDemo}
          >
            <Sparkles size={14} /> デモ
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: '12px', padding: '6px 10px', background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
            onClick={handleSwitchToAdmin}
          >
            <ShieldAlert size={14} /> 管理者
          </button>
        </div>
      </header>

      {/* 1-1-1: 現在地共有推奨画面/バナー */}
      {showGpsRecommendation && (
        <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '12px 20px', fontSize: '13px', color: '#1e40af' }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Navigation size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
              <div>
                <strong>現在地の共有をおすすめします</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#3b82f6' }}>
                  現在地共有を有効にすると、最寄りの避難所・支援ピンの投稿や確認がスムーズに行えます。
                </span>
              </div>
            </div>
            <button
              type="button"
              className="primary-button"
              style={{ padding: '4px 12px', fontSize: '12px', flexShrink: 0 }}
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(() => showToast('現在地の共有を許可しました'))
                }
                setShowGpsRecommendation(false)
              }}
            >
              許可・確認
            </button>
          </div>
        </div>
      )}

      {/* 凍結ユーザー警告文言 */}
      {user.account_status === 'frozen' && (
        <div style={{ background: '#fef2f2', borderBottom: '2px solid #ef4444', color: '#991b1b', padding: '16px 24px', fontSize: '13px', lineHeight: 1.6 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <div>
              <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>ご利用のアカウントは凍結されています</strong>
              ご利用のアカウントは、凍結されています。投稿・チャット・通報機能はご利用いただけません。
            </div>
          </div>
        </div>
      )}

      <section className="standalone-content" style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 16px' }}>

        {/* 1-1-1: ユーザーコードログインバー */}
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <form onSubmit={handleUserCodeLogin} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <KeyRound size={18} style={{ color: '#0284c7' }} />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', color: '#334155' }}>
                ユーザーコードを入力してログイン
              </label>
              <input
                type="text"
                placeholder="例: ASU-8829-X39"
                value={inputUserCode}
                onChange={(e) => setInputUserCode(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>
            <button type="submit" className="primary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
              ログイン
            </button>
          </form>
        </div>

        {/* 7-1, 8-1: デジタル会員証エリア (明るい青系背景・ユーザーコード表示は基本プロフィール設定内に移動) */}
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: '#ffffff', padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldCheck size={22} style={{ color: '#bae6fd' }} />
              <strong style={{ fontSize: '18px', color: '#ffffff' }}>デジタル会員証</strong>
              {user.is_verified && (
                <img src="/ninsyou.png" alt="認証" style={{ height: '20px', width: 'auto' }} title="本人確認済み" />
              )}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#e0f2fe' }}>
              {user.is_demo
                ? 'デモユーザーはデジタル会員証が発行されています。'
                : '本人確認をすると、デジタル会員証・認証マークが発行されます。'}
            </p>
          </div>

          <div>
            {user.is_demo || user.is_verified ? (
              <button
                type="button"
                className="primary-button"
                style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', padding: '10px 18px' }}
                onClick={() => setShowCardModal(true)}
              >
                会員証を表示
              </button>
            ) : (
              <button
                type="button"
                className="secondary-button"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 18px' }}
                onClick={() => showToast('本人確認機能は現在準備中です（後日機能追加予定）')}
              >
                本人確認をする
              </button>
            )}
          </div>
        </div>

        {/* タブ切り替え */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              borderBottom: activeTab === 'profile' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'profile' ? '#0284c7' : '#64748b',
              marginBottom: '-2px',
            }}
          >
            プロフィール・活動地域
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              borderBottom: activeTab === 'history' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'history' ? '#0284c7' : '#64748b',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            自分の投稿履歴
            <span style={{ background: '#e2e8f0', color: '#334155', fontSize: '11px', padding: '2px 7px', borderRadius: '10px' }}>
              {myPosts.length}
            </span>
          </button>
        </div>

        {/* プロフィール・設定タブ */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <form onSubmit={handleSaveProfile} style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontSize: '17px', margin: 0, color: '#0f172a' }}>基本プロフィール設定</h2>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  公開表示名（ニックネーム）
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例：あすのわ太郎"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              {/* 1-2, 3-3: 現在の役割 (後から変更可能) */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  現在の役割（変更可能）
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(
                    [
                      { role: 'victim', label: '被災者', desc: '物資の「依頼」が可能' },
                      { role: 'supporter', label: '支援者', desc: '物資の「提供」が可能' },
                      { role: 'both', label: '被災者＋支援者 (共助)', desc: '依頼・提供の双方が可能' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setUserRole(item.role)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '10px',
                        border: userRole === item.role ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: userRole === item.role ? '#f0f9ff' : '#ffffff',
                        color: userRole === item.role ? '#0284c7' : '#334155',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <b style={{ fontSize: '13px', display: 'block' }}>{item.label}</b>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-3: 活動地域（基準地域） */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                  活動地域（基準地域）
                </label>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#0284c7', background: '#f0f9ff', padding: '8px 12px', borderRadius: '6px' }}>
                  被災者は、現在の地域を。支援者は、支援したい地域を登録してください。地図上ではその情報が優先して表示されます。
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select
                    value={selectedPref}
                    onChange={(e) => {
                      const pref = e.target.value
                      setSelectedPref(pref)
                      const cities = getCitiesByPrefecture(pref)
                      if (cities.length > 0) setSelectedCity(cities[0].city)
                    }}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    {PREFECTURES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    {availableCities.map((c) => (
                      <option key={c.city} value={c.city}>
                        {c.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> 現在の活動地域災害レベル: <b>Lv.{currentDisasterLevel}</b>
                </div>
              </div>

              <button
                type="submit"
                className="primary-button"
                style={{ padding: '12px', justifyContent: 'center', fontWeight: 700, marginTop: '8px' }}
              >
                プロフィール・活動地域を保存
              </button>

              {/* 8-1 ユーザコードの配置変更（基本プロフィール設定内・保存ボタンの下） */}
              {user.user_code && (
                <div style={{ marginTop: '12px', padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>ユーザコード：</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0284c7', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '4px' }}>
                    [{user.user_code}]
                  </div>
                </div>
              )}
            </form>
          </div>

        )}

        {/* 投稿履歴タブ */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', margin: 0 }}>あなたが投稿した内容一覧</h2>
              <Link href="/" className="secondary-button" style={{ fontSize: '12px', padding: '6px 12px' }}>
                <Plus size={14} /> 新規投稿へ
              </Link>
            </div>

            {myPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                <FileText size={40} style={{ marginBottom: '12px' }} />
                <h3>まだ投稿履歴はありません</h3>
                <p style={{ fontSize: '13px', margin: '4px 0 16px' }}>検索画面または新規投稿から物資の依頼・提供を行えます。</p>
                <Link href="/" className="primary-button" style={{ display: 'inline-flex' }}>
                  支援一覧・投稿へ
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '18px 20px',
                    }}
                  >
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
                        {post.type === 'request' ? '支援依頼' : '支援提供'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(post.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', margin: '0 0 6px', color: '#0f172a' }}>{post.title}</h3>
                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px', lineHeight: 1.5 }}>{post.description}</p>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                      受け取り・引き渡し場所: <b>{post.received_location}</b>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => openEditPost(post)}
                      >
                        <Edit3 size={14} /> 編集
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 size={14} /> 削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </section>

      {/* 3-1-3 縦画面学生証風デジタル会員証拡大モーダル */}
      {showCardModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9000,
            padding: '16px',
          }}
          onClick={() => setShowCardModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              width: '100%',
              maxWidth: '340px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '3px solid #0284c7',
              position: 'relative',
              padding: '24px 20px',
              color: '#0f172a',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setShowCardModal(false)}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '12px', marginBottom: '16px' }}>
              <small style={{ letterSpacing: '2px', color: '#0284c7', fontWeight: 'bold', fontSize: '10px', display: 'block' }}>
                防災共助ネットワーク
              </small>
              <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '800', color: '#0369a1' }}>
                デジタル会員証
              </h2>
            </div>

            {/* 顔写真 demo.png */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <img
                src="/demo.png"
                alt="会員顔写真"
                style={{
                  width: '110px',
                  height: '135px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
              />
            </div>

            {/* 名前 ＋ 認証マーク ninsyou.png */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '20px', fontWeight: '800' }}>{user.name || 'あすのわ太郎'}</strong>
                <img src="/ninsyou.png" alt="認証マーク" style={{ height: '22px', width: 'auto' }} title="本人確認済み認証マーク" />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                役割：{user.user_role === 'victim' ? '被災者' : user.user_role === 'supporter' ? '支援者' : '被災者＋支援者 (共助)'}
              </div>
            </div>

            {/* 3-1-3 必須項目リスト */}
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>会員証ID</span>
                <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{user.card_id || 'CARD-2026-88192'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>生年月日</span>
                <span>{user.birth_date || '1995年4月12日'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>発行日</span>
                <span>{user.issue_date || '2026年01月15日'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>有効期限</span>
                <span>{user.expire_date || '2028年01月15日'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#94a3b8' }}>
              アスノワ 災害共助プラットフォーム 発行
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
