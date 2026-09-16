'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ShieldCheck, Check, AlertTriangle, ChevronDown, ChevronRight,
  Trash2, X, Users, Flag, Lock, Unlock, Eye, RefreshCw
} from 'lucide-react'
import { PREFECTURES, getCitiesByPrefecture } from '@/lib/cities'
import {
  getDisasterLevels, saveDisasterLevel, DisasterLevelItem,
  getReports, handleAdminReportAction,
  getAllUsers, updateUserAccountStatus,
  getUserProfile, saveUserProfile, getPosts, deletePost,
  getMapPins, deleteMapPin
} from '@/lib/store'
import { ReportItem, UserProfile } from '@/lib/types'

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(getUserProfile())
  const [activeTab, setActiveTab] = useState<'disaster' | 'reports' | 'users' | 'posts'>('disaster')
  const [levels, setLevels] = useState<DisasterLevelItem[]>([])
  const [openPref, setOpenPref] = useState<string | null>('鳥取県')
  const [reports, setReports] = useState<ReportItem[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [notice, setNotice] = useState('')

  const refreshData = () => {
    setLevels(getDisasterLevels())
    setReports(getReports())
    setUsers(getAllUsers())
  }

  useEffect(() => {
    const user = getUserProfile()
    setCurrentUser(user)
    refreshData()
  }, [])

  const showToast = (text: string) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 2600)
  }

  const handleLevelChange = (pref: string, city: string, level: number) => {
    const updated = saveDisasterLevel(pref, city, level)
    setLevels(updated)
    showToast(`${pref} ${city} の災害レベルを Lv.${level} に変更しました`)
  }

  const getLevelForCity = (pref: string, city: string): number => {
    const found = levels.find(l => l.prefecture === pref && l.city === city)
    return found ? found.level : 0
  }

  const handleReportAction = (reportId: string, action: 'delete' | 'reject') => {
    handleAdminReportAction(reportId, action)
    refreshData()
    showToast(action === 'delete' ? '対象を完全削除しました' : '通報を却下し再公開しました')
  }

  const toggleUserFreeze = (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'frozen' ? 'active' : 'frozen'
    const updated = updateUserAccountStatus(userId, nextStatus)
    setUsers(updated)
    showToast(nextStatus === 'frozen' ? 'ユーザーを凍結しました' : 'ユーザーの凍結を解除しました')
  }

  // 開発・デモ用 管理者切り替えスイッチ
  const toggleAdminRole = () => {
    const nextRole = currentUser.role === 'admin' ? 'user' : 'admin'
    const updated = saveUserProfile({ role: nextRole })
    setCurrentUser(updated)
    showToast(nextRole === 'admin' ? '管理者権限に切り替えました' : '一般ユーザーに切り替えました')
  }

  if (currentUser.role !== 'admin') {
    return (
      <main className="standalone-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#ffffff', padding: '36px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={28} />
          </div>
          <h1 style={{ fontSize: '20px', margin: '0 0 10px', color: '#0f172a' }}>アクセス権限がありません</h1>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
            管理者専用ページ（/admin）は、管理者権限（admin）を持つユーザーのみアクセス可能です。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/" className="primary-button full" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              ホームへ戻る
            </Link>
            <button
              type="button"
              onClick={toggleAdminRole}
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              【デモ開発用】管理者権限を付与して管理画面を開く
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="standalone-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      <header className="standalone-header">
        <Link href="/" className="icon-button" aria-label="ホームへ戻る">
          <ArrowLeft size={20} />
        </Link>
        <div className="brand">
          <span className="brand-mark" style={{ background: '#0284c7', color: 'white' }}>
            <ShieldCheck size={21} />
          </span>
          <span>
            <strong>明日の環 管理者コンソール</strong>
            <small>Disaster / Reports / Users Management</small>
          </span>
        </div>
        <button
          type="button"
          onClick={toggleAdminRole}
          style={{
            marginLeft: 'auto',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          管理者モード解除
        </button>
      </header>

      <section className="standalone-content" style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* 管理者タブナビゲーション */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('disaster')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              borderBottom: activeTab === 'disaster' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'disaster' ? '#0284c7' : '#64748b',
              marginBottom: '-2px',
            }}
          >
            1. 災害・レベル管理
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              borderBottom: activeTab === 'reports' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'reports' ? '#0284c7' : '#64748b',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            2. 通報・投稿管理
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <span style={{ background: '#e11d48', color: 'white', fontSize: '11px', padding: '2px 7px', borderRadius: '10px' }}>
                {reports.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              borderBottom: activeTab === 'users' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeTab === 'users' ? '#0284c7' : '#64748b',
              marginBottom: '-2px',
            }}
          >
            3. ユーザー管理・凍結
          </button>
        </div>

        {/* 1. 災害・レベル管理 */}
        {activeTab === 'disaster' && (
          <div>
            <div className="content-head" style={{ marginBottom: '16px' }}>
              <div>
                <p className="eyebrow">地域安全管理</p>
                <h1 style={{ fontSize: '22px' }}>全国市区町村別 災害レベル設定</h1>
              </div>
            </div>

            <div className="admin-intro-box" style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <AlertTriangle size={20} color="#eab308" />
                <strong style={{ fontSize: '15px' }}>災害レベル設定基準（市区町村単位）</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                ・<b>Lv.0 (平時)</b>：通常状態（投稿・支援可能）<br />
                ・<b>Lv.1 (注意)</b>：通常支援可能<br />
                ・<b>Lv.2 (警戒)</b>：警戒地域（投稿・支援可能）<br />
                ・<b>Lv.3 (危険)</b>：危険地域（安全確保のため物資投稿・支援開始の利用を<b>自動停止</b>）<br />
                ※ 初期状態では全国の市区町村が <b>Lv.0</b> で登録されています。
              </p>
            </div>

            <div className="admin-tree-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {PREFECTURES.map(pref => {
                const isOpen = openPref === pref
                const cities = getCitiesByPrefecture(pref)

                return (
                  <div
                    key={pref}
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#ffffff',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenPref(isOpen ? null : pref)}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isOpen ? '#f1f5f9' : '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        ▼ {pref}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>
                        {cities.length} 市区町村
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '12px 18px 18px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #e2e8f0' }}>
                        {cities.map(cityInfo => {
                          const currentLevel = getLevelForCity(pref, cityInfo.city)

                          return (
                            <div
                              key={cityInfo.city}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                background: currentLevel === 3 ? '#fef2f2' : currentLevel > 0 ? '#fffbe6' : '#f8fafc',
                                borderRadius: '8px',
                                border: currentLevel === 3 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 500, fontSize: '14px' }}>□ {cityInfo.city}</span>
                                {currentLevel === 3 && (
                                  <span style={{ fontSize: '11px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                                    Lv.3 危険機能停止中
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '13px', color: '#475569' }}>レベル設定:</label>
                                <select
                                  value={currentLevel}
                                  onChange={e => handleLevelChange(pref, cityInfo.city, Number(e.target.value))}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontWeight: 600,
                                    background: '#ffffff',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value={0}>Lv.0 (平時・デフォルト)</option>
                                  <option value={1}>Lv.1 (注意)</option>
                                  <option value={2}>Lv.2 (警戒)</option>
                                  <option value={3}>Lv.3 (機能停止)</option>
                                </select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 2. 通報・投稿管理 */}
        {activeTab === 'reports' && (
          <div>
            <div className="content-head" style={{ marginBottom: '16px' }}>
              <div>
                <p className="eyebrow">モデレーション</p>
                <h1 style={{ fontSize: '22px' }}>通報・投稿管理</h1>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              ユーザーから送信された通報一覧です。5件以上通報された対象は自動的に一時非表示になっています。確認のうえ削除または却下を行ってください。
            </p>

            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                <Flag size={40} style={{ marginBottom: '12px' }} />
                <h3>現在、未対応の通報はありません</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reports.map(rep => {
                  const isPost = rep.target_type === 'post'
                  const isPin = rep.target_type === 'map_pin'

                  return (
                    <div
                      key={rep.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '18px 20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isPost ? '#fef3c7' : isPin ? '#dbeafe' : '#fce7f3',
                            color: isPost ? '#92400e' : isPin ? '#1e40af' : '#9d174d',
                          }}
                        >
                          種別: {isPost ? '投稿' : isPin ? '地図ピン' : 'チャットユーザー'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          通報日時: {new Date(rep.created_at).toLocaleString('ja-JP')}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '16px', margin: '4px 0 8px', color: '#0f172a' }}>
                        {rep.target_title || `対象ID: ${rep.target_id}`}
                      </h3>

                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                        <span>通報理由：<b style={{ color: '#e11d48' }}>{rep.reason}</b></span>
                        {rep.target_author_name && <span style={{ marginLeft: '12px' }}>対象ユーザー：<b>{rep.target_author_name}</b></span>}
                        {rep.detail && <p style={{ margin: '4px 0', background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>詳細：{rep.detail}</p>}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <span style={{ fontSize: '12px', color: rep.status === 'pending' ? '#d97706' : rep.status === 'deleted' ? '#dc2626' : '#16a34a' }}>
                          ステータス: <b>{rep.status === 'pending' ? '未対応 (確認中)' : rep.status === 'deleted' ? '削除対応済み' : '却下 (再公開済み)'}</b>
                        </span>

                        {rep.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleReportAction(rep.id, 'reject')}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              通報を却下（再公開）
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReportAction(rep.id, 'delete')}
                              style={{
                                background: '#e11d48',
                                color: 'white',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Trash2 size={13} /> 対象を完全削除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. ユーザー管理 */}
        {activeTab === 'users' && (
          <div>
            <div className="content-head" style={{ marginBottom: '16px' }}>
              <div>
                <p className="eyebrow">アカウント管理</p>
                <h1 style={{ fontSize: '22px' }}>ユーザー一覧・アカウント凍結管理</h1>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              登録ユーザーの一覧です。規約違反のあるアカウントを「凍結」できます。凍結されたユーザーは閲覧のみ可能となり、投稿・チャット・通報が制限されます。
            </p>

            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>表示名</th>
                    <th style={{ padding: '12px 16px' }}>メール / 連携</th>
                    <th style={{ padding: '12px 16px' }}>役割</th>
                    <th style={{ padding: '12px 16px' }}>権限</th>
                    <th style={{ padding: '12px 16px' }}>登録地域</th>
                    <th style={{ padding: '12px 16px' }}>状態</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isFrozen = u.account_status === 'frozen'

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          {u.name}
                          {u.id === currentUser.id && <span style={{ fontSize: '11px', color: '#0284c7', marginLeft: '6px' }}>(自分)</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {u.email || (u.is_demo ? 'デモ利用' : '未設定')}
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {u.linked_google && 'Google '}
                            {u.linked_line && 'LINE'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              background: u.user_role === 'victim' ? '#fff7ed' : u.user_role === 'supporter' ? '#f0fdf4' : '#eff6ff',
                              color: u.user_role === 'victim' ? '#c2410c' : u.user_role === 'supporter' ? '#166534' : '#1d4ed8',
                            }}
                          >
                            {u.user_role === 'victim' ? '被災者' : u.user_role === 'supporter' ? '支援者' : '共助'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: u.role === 'admin' ? '#7c3aed' : '#475569' }}>
                            {u.role === 'admin' ? '管理者 (admin)' : '一般利用者'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {u.disaster_prefecture} {u.disaster_city}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              background: isFrozen ? '#fee2e2' : '#dcfce7',
                              color: isFrozen ? '#dc2626' : '#166534',
                            }}
                          >
                            {isFrozen ? '凍結中' : '活動中'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => toggleUserFreeze(u.id, u.account_status)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: isFrozen ? '1px solid #16a34a' : '1px solid #dc2626',
                              background: isFrozen ? '#f0fdf4' : '#fff5f5',
                              color: isFrozen ? '#16a34a' : '#dc2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isFrozen ? <Unlock size={13} /> : <Lock size={13} />}
                            {isFrozen ? '凍結解除' : 'アカウント凍結'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {notice && (
        <div className="toast">
          <Check size={17} /> {notice}
        </div>
      )}
    </main>
  )
}
