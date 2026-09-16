'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  UserRound, MapPin, HeartHandshake, ShieldCheck, FileText,
  Trash2, Edit3, Check, AlertTriangle, ArrowLeft, Plus, Link2, ExternalLink
} from 'lucide-react'
import {
  getUserProfile, saveUserProfile, getMyPosts, deletePost,
  updatePost, getCityDisasterLevel
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

  // 編集用フォーム
  const [displayName, setDisplayName] = useState(user.name)
  const [userRole, setUserRole] = useState<UserRole>(user.user_role || 'victim')
  const [selectedPref, setSelectedPref] = useState(user.disaster_prefecture)
  const [selectedCity, setSelectedCity] = useState(user.disaster_city)

  // 投稿編集用
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPlace, setEditPlace] = useState('')

  const refreshUserData = () => {
    const u = getUserProfile()
    setUser(u)
    setDisplayName(u.name)
    setUserRole(u.user_role)
    setSelectedPref(u.disaster_prefecture)
    setSelectedCity(u.disaster_city)
    setMyPosts(getMyPosts(u.id))
  }

  useEffect(() => {
    refreshUserData()
  }, [])

  const showToast = (text: string) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 2600)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      showToast('表示名を入力してください')
      return
    }

    const updated = saveUserProfile({
      name: displayName.trim(),
      user_role: userRole,
      disaster_prefecture: selectedPref,
      disaster_city: selectedCity,
    })
    setUser(updated)
    showToast('プロフィールと登録地域を更新しました')
  }

  const toggleProvider = (provider: 'google' | 'line') => {
    if (provider === 'google') {
      const updated = saveUserProfile({ linked_google: !user.linked_google })
      setUser(updated)
      showToast(updated.linked_google ? 'Googleアカウントを連携しました' : 'Googleアカウント連携を解除しました')
    } else {
      const updated = saveUserProfile({ linked_line: !user.linked_line })
      setUser(updated)
      showToast(updated.linked_line ? 'LINEアカウントを連携しました' : 'LINEアカウント連携を解除しました')
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
      <header className="standalone-header">
        <Link href="/" className="icon-button" aria-label="ホームへ戻る">
          <ArrowLeft size={20} />
        </Link>
        <div className="brand">
          <span className="brand-mark">
            <UserRound size={21} />
          </span>
          <span>
            <strong>マイページ</strong>
            <small>アカウント・登録地域・投稿履歴</small>
          </span>
        </div>
      </header>

      {/* 凍結ユーザー警告文言 (仕様書 第20.2項 厳格準拠) */}
      {user.account_status === 'frozen' && (
        <div style={{ background: '#fef2f2', borderBottom: '2px solid #ef4444', color: '#991b1b', padding: '16px 24px', fontSize: '13px', lineHeight: 1.6 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <div>
              <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>ご利用のアカウントは凍結されています</strong>
              ご利用のアカウントは、凍結されています。慎重に審査した結果、明日の環ルールに違反していると判断いたしました。そのため、ログイン・地図閲覧・検索閲覧は可能ですが、投稿・チャット・通報機能はご利用いただけません。ご理解の程、よろしくお願いいたします。
            </div>
          </div>
        </div>
      )}

      <section className="standalone-content" style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 16px' }}>
        
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
            プロフィール・地域・役割
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
                <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                  ※投稿やチャットに表示される名前です。Google/LINEの本名は直接公開されません。
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  現在の役割
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

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  登録地域（基準地域）
                </label>
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
                  <MapPin size={14} /> 現在の登録地域災害レベル: <b>Lv.{currentDisasterLevel}</b>
                </div>
              </div>

              <button
                type="submit"
                className="primary-button"
                style={{ padding: '12px', justifyContent: 'center', fontWeight: 700, marginTop: '8px' }}
              >
                プロフィール設定を保存
              </button>
            </form>

            {/* Google / LINE アカウント連携 */}
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 8px', color: '#0f172a' }}>Google・LINE アカウント連携</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                GoogleとLINEを同一アカウントへ連携できます。どちらの認証方法からでも同一の投稿・プロフィールへログイン可能です。
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: user.linked_google ? '#f0fdf4' : '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Google アカウント</span>
                    {user.linked_google && <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>連携済み</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleProvider('google')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid #cbd5e1',
                      background: user.linked_google ? '#f8fafc' : '#0284c7',
                      color: user.linked_google ? '#475569' : '#ffffff',
                    }}
                  >
                    {user.linked_google ? '連携解除' : 'Googleを連携'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: user.linked_line ? '#f0fdf4' : '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>LINE アカウント</span>
                    {user.linked_line && <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>連携済み</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleProvider('line')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid #cbd5e1',
                      background: user.linked_line ? '#f8fafc' : '#06c755',
                      color: user.linked_line ? '#475569' : '#ffffff',
                    }}
                  >
                    {user.linked_line ? '連携解除' : 'LINEを連携'}
                  </button>
                </div>
              </div>
            </div>
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
                          background: post.type === 'offer' ? '#166534' : '#c2410c',
                          color: '#ffffff',
                        }}
                      >
                        【{post.type === 'offer' ? '提供' : '依頼'}】
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        投稿日: {new Date(post.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', margin: '4px 0 6px', color: '#0f172a' }}>{post.title}</h3>
                    <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {post.description}
                    </p>

                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <span>受取場所: <b>{post.received_location}</b></span>
                      <span>ステータス: <b>{post.status}</b></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => openEditPost(post)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Edit3 size={13} /> 編集
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        style={{
                          background: '#fff5f5',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={13} /> 削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 投稿編集モーダル */}
      {editingPost && (
        <div className="modal-backdrop" onClick={() => setEditingPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', maxWidth: '480px', width: '92%' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>投稿内容の編集</h2>
            <form onSubmit={handleSavePostEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>タイトル</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>詳細内容</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>受け取り場所</label>
                <input
                  type="text"
                  value={editPlace}
                  onChange={(e) => setEditPlace(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setEditingPost(null)}>
                  キャンセル
                </button>
                <button type="submit" className="primary-button">
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notice && (
        <div className="toast">
          <Check size={17} /> {notice}
        </div>
      )}
    </main>
  )
}
