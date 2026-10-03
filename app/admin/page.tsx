'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ShieldCheck, Check, AlertTriangle, ChevronDown, ChevronRight,
  Trash2, X, Users, Flag, Lock, Unlock, Eye, RefreshCw, Power, UserCheck, Shield, FileText
} from 'lucide-react'
import { PREFECTURES, getCitiesByPrefecture } from '@/lib/cities'
import {
  getDisasterLevels, saveDisasterLevel, DisasterLevelItem,
  getReports, handleAdminReportAction,
  getAllUsers, updateUserAccountStatus,
  getUserProfile, saveUserProfile, getPosts, deletePost,
  getMapPins, deleteMapPin, getSystemStatus, saveSystemStopped
} from '@/lib/store'
import { ReportItem, UserProfile } from '@/lib/types'

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(getUserProfile())

  // 2-1: 管理者種別（一般運営管理者 / 個人情報管理者）
  const [adminMode, setAdminMode] = useState<'general' | 'personal'>('general')

  // 一般運営管理者内のサブタブ
  const [activeTab, setActiveTab] = useState<'disaster' | 'reports' | 'users' | 'system'>('disaster')

  // システム全面停止状態
  const [isSystemStopped, setIsSystemStopped] = useState(false)

  const [levels, setLevels] = useState<DisasterLevelItem[]>([])
  const [openPref, setOpenPref] = useState<string | null>('鳥取県')
  const [reports, setReports] = useState<ReportItem[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [notice, setNotice] = useState('')

  // 個人情報管理者で選択中のユーザー
  const [selectedUserForPi, setSelectedUserForPi] = useState<UserProfile | null>(null)

  const refreshData = () => {
    setLevels(getDisasterLevels())
    setReports(getReports())
    const loadedUsers = getAllUsers()
    setUsers(loadedUsers)
    if (!selectedUserForPi && loadedUsers.length > 0) {
      setSelectedUserForPi(loadedUsers[0])
    }
    setIsSystemStopped(getSystemStatus().is_stopped)
  }

  useEffect(() => {
    const user = getUserProfile()
    setCurrentUser(user)
    refreshData()
  }, [])

  const showToast = (text: string) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 3000)
  }

  // 2-2-1: システム全面停止切り替え
  const handleToggleSystemStop = () => {
    const nextState = !isSystemStopped
    saveSystemStopped(nextState)
    setIsSystemStopped(nextState)
    showToast(nextState ? 'システムを全面停止しました（一般ユーザーの操作がロックされます）' : 'システムの全面停止を解除し、サービスを再開しました')
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
            管理者専用ページは、管理者権限（admin）を持つユーザーのみアクセス可能です。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/" className="primary-button full" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              アプリトップへ戻る
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
              【デモ用】管理者権限を有効にして管理画面を開く
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="standalone-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      {notice && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#ffffff', padding: '10px 20px', borderRadius: '20px', fontSize: '13px', zIndex: 9999 }}>
          {notice}
        </div>
      )}

      <header className="standalone-header">
        <Link href="/" className="icon-button" aria-label="アプリトップへ戻る">
          <ArrowLeft size={20} />
        </Link>
        <div className="brand">
          <span className="brand-mark" style={{ background: '#0284c7', color: 'white' }}>
            <ShieldCheck size={21} />
          </span>
          <span>
            <strong>明日の環 管理者コンソール</strong>
            <small>一般運営管理・個人情報管理</small>
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

        {/* 2-1: ２つのボタンによる画面切替（一般運営管理者 / 個人情報管理者） */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setAdminMode('general')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              border: adminMode === 'general' ? '3px solid #0284c7' : '1px solid #cbd5e1',
              background: adminMode === 'general' ? '#f0f9ff' : '#ffffff',
              color: adminMode === 'general' ? '#0369a1' : '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: adminMode === 'general' ? '0 4px 12px rgba(2,132,199,0.15)' : 'none',
            }}
          >
            <Shield size={22} style={{ color: adminMode === 'general' ? '#0284c7' : '#64748b' }} />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ fontSize: '16px', display: 'block' }}>一般運営管理者</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>災害レベル・投稿・通報・システム停止</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setAdminMode('personal')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              border: adminMode === 'personal' ? '3px solid #7c3aed' : '1px solid #cbd5e1',
              background: adminMode === 'personal' ? '#f5f3ff' : '#ffffff',
              color: adminMode === 'personal' ? '#6d28d9' : '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: adminMode === 'personal' ? '0 4px 12px rgba(124,58,237,0.15)' : 'none',
            }}
          >
            <UserCheck size={22} style={{ color: adminMode === 'personal' ? '#7c3aed' : '#64748b' }} />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ fontSize: '16px', display: 'block' }}>個人情報管理者</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>機密個人情報・本人確認・資格ログ</span>
            </div>
          </button>
        </div>

        {/* 2-2: 一般運営管理者 UI */}
        {adminMode === 'general' && (
          <div>
            {/* 全面停止警告アラート */}
            {isSystemStopped && (
              <div style={{ background: '#fef2f2', border: '2px solid #ef4444', color: '#991b1b', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Power size={22} style={{ color: '#ef4444' }} />
                  <div>
                    <strong style={{ fontSize: '15px' }}>現在、システムは全面停止中（一時停止モード）です</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: '#b91c1c' }}>利用者にサービス一時停止のお知らせメッセージが表示されています。</span>
                  </div>
                </div>
                <button className="danger-button" onClick={handleToggleSystemStop}>
                  停止を解除しサービス再開
                </button>
              </div>
            )}

            {/* サブタブ */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('disaster')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'disaster' ? '3px solid #0284c7' : '3px solid transparent',
                  color: activeTab === 'disaster' ? '#0284c7' : '#64748b',
                }}
              >
                災害レベル設定
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'reports' ? '3px solid #0284c7' : '3px solid transparent',
                  color: activeTab === 'reports' ? '#0284c7' : '#64748b',
                }}
              >
                通報・投稿管理 ({reports.filter(r => r.status === 'pending').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'users' ? '3px solid #0284c7' : '3px solid transparent',
                  color: activeTab === 'users' ? '#0284c7' : '#64748b',
                }}
              >
                アカウント管理 ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('system')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'system' ? '3px solid #0284c7' : '3px solid transparent',
                  color: activeTab === 'system' ? '#0284c7' : '#64748b',
                }}
              >
                2-2-1 システム全面停止設定
              </button>
            </div>

            {/* 災害レベル設定 */}
            {activeTab === 'disaster' && (
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '18px', margin: '0 0 8px', color: '#0f172a' }}>全国都道府県・市区町村の災害レベル設定</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                  レベル3に設定された地域では、二次被害防止のため一時的に物資マッチング申請機能がロックされます。
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {PREFECTURES.map((pref) => {
                    const isOpen = openPref === pref
                    const cities = getCitiesByPrefecture(pref)
                    return (
                      <div key={pref} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => setOpenPref(isOpen ? null : pref)}
                          style={{
                            width: '100%',
                            padding: '14px 18px',
                            background: '#f8fafc',
                            border: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '15px',
                          }}
                        >
                          <span>{pref} ({cities.length}市区町村)</span>
                          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        {isOpen && (
                          <div style={{ padding: '14px', background: '#ffffff', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {cities.map((c) => {
                              const lvl = getLevelForCity(pref, c.city)
                              return (
                                <div key={c.city} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.city}</span>
                                  <select
                                    value={lvl}
                                    onChange={(e) => handleLevelChange(pref, c.city, Number(e.target.value))}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      background: lvl === 3 ? '#fef2f2' : lvl >= 1 ? '#fefce8' : '#f0fdf4',
                                      color: lvl === 3 ? '#991b1b' : lvl >= 1 ? '#854d0e' : '#166534',
                                      border: '1px solid #cbd5e1',
                                    }}
                                  >
                                    <option value={0}>Lv.0 (平時)</option>
                                    <option value={1}>Lv.1 (注意)</option>
                                    <option value={2}>Lv.2 (警戒)</option>
                                    <option value={3}>Lv.3 (避難指示/ロック)</option>
                                  </select>
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

            {/* 通報・投稿管理 */}
            {activeTab === 'reports' && (
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '18px', margin: '0 0 16px', color: '#0f172a' }}>通報・不適切投稿の管理</h2>
                {reports.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>現在、通報されている投稿・ピンはありません。</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reports.map((rep) => (
                      <div key={rep.id} style={{ padding: '14px', border: '1px solid #cbd5e1', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              {rep.target_type === 'post' ? '投稿' : 'マップピン'}通報
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>理由: {rep.reason}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#334155' }}>対象: <b>{rep.target_title || rep.target_id}</b> (投稿者: {rep.target_author_name})</div>
                          {rep.detail && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>「{rep.detail}」</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="danger-button" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => handleReportAction(rep.id, 'delete')}>
                            投稿削除
                          </button>
                          <button className="secondary-button" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => handleReportAction(rep.id, 'reject')}>
                            通報却下
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* アカウント管理 */}
            {activeTab === 'users' && (
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '18px', margin: '0 0 16px', color: '#0f172a' }}>登録ユーザー・アカウント凍結管理</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {users.map((u) => (
                    <div key={u.id} style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px' }}>{u.name}</strong>
                          {u.user_code && <span style={{ fontSize: '11px', color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>{u.user_code}</span>}
                          {u.account_status === 'frozen' && <span style={{ fontSize: '11px', background: '#ef4444', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>凍結中</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          地域: {u.disaster_prefecture} {u.disaster_city} | 役割: {u.user_role}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={u.account_status === 'frozen' ? 'primary-button' : 'danger-button'}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => toggleUserFreeze(u.id, u.account_status)}
                      >
                        {u.account_status === 'frozen' ? <Unlock size={14} /> : <Lock size={14} />}
                        {u.account_status === 'frozen' ? ' 凍結解除' : ' アカウント凍結'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2-2-1 システム全面停止設定 */}
            {activeTab === 'system' && (
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Power size={24} style={{ color: isSystemStopped ? '#ef4444' : '#16a34a' }} />
                  <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>2-2-1 システム全面停止機能</h2>
                </div>

                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                  誤情報（デマ）の拡散防止およびシステム確認のため、サービス全体を一時的に全面停止します。
                  ボタンを押すと、すべての利用者に一時停止メッセージが表示され、操作が停止されます。
                </p>

                <div style={{ background: isSystemStopped ? '#fef2f2' : '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                  <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>全面停止時に一般ユーザーへ表示される案内文面:</strong>
                  <blockquote style={{ margin: 0, padding: '12px 16px', background: '#ffffff', borderLeft: '4px solid #ef4444', fontSize: '12px', color: '#334155', lineHeight: 1.7 }}>
                    <strong>現在、サービスの提供を一時停止しております</strong><br />
                    いつもご利用いただきありがとうございます。現在、誤情報（デマ）の拡散防止およびシステム確認のため、すべての機能を一時的に停止しております。ご利用の皆様にはご不便・ご迷惑をおかけいたしますが、ご理解とご協力のほどよろしくお願い申し上げます。<br /><br />
                    <strong>■ 再開について</strong><br />
                    状況の安全が確認でき次第、順次サービスを再開いたします。
                  </blockquote>
                </div>

                <button
                  type="button"
                  className={isSystemStopped ? 'primary-button' : 'danger-button'}
                  style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 'bold' }}
                  onClick={handleToggleSystemStop}
                >
                  <Power size={18} />
                  {isSystemStopped ? ' システムの全面停止を解除して再開する' : ' システムを全面停止する（緊急停止）'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2-3: 個人情報管理者 UI */}
        {adminMode === 'personal' && (
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <UserCheck size={24} style={{ color: '#7c3aed' }} />
              <div>
                <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>2-3. 個人情報管理者コンソール</h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>※機密個人情報を安全に管理するための極秘領域です（少人数管理者想定）。</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
              {/* ユーザー選択サイドバー */}
              <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                <strong style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '8px' }}>対象ユーザー選択:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserForPi(u)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        textAlign: 'left',
                        border: selectedUserForPi?.id === u.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: selectedUserForPi?.id === u.id ? '#f5f3ff' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <strong style={{ display: 'block', color: '#0f172a' }}>{u.name}</strong>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{u.user_code || 'コード未生成'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2-3 要件: 指定された5項目のテキスト表示（詳細ボタン押下後の動作は現時点空） */}
              {selectedUserForPi ? (
                <div style={{ background: '#faf5ff', padding: '20px', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                  <h3 style={{ fontSize: '16px', margin: '0 0 16px', color: '#581c87', borderBottom: '1px solid #d8b4fe', paddingBottom: '8px' }}>
                    個人情報管理データ ({selectedUserForPi.name})
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* 1. 本人確認状況 */}
                    <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                      <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block' }}>■ 本人確認状況</span>
                      <strong style={{ fontSize: '14px', color: selectedUserForPi.is_verified ? '#15803d' : '#b91c1c' }}>
                        {selectedUserForPi.is_verified ? '本人確認完了（認証済みマーク発行）' : '未確認・手続き中'}
                      </strong>
                    </div>

                    {/* 2. 本人確認日時 */}
                    <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                      <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block' }}>■ 本人確認日時</span>
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {selectedUserForPi.verified_at
                          ? new Date(selectedUserForPi.verified_at).toLocaleString()
                          : '記録なし'}
                      </span>
                    </div>

                    {/* 3. 本人確認方法 */}
                    <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                      <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block' }}>■ 本人確認方法</span>
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {selectedUserForPi.verified_method || 'マイナンバーカード公的個人認証 / 運転免許証照合'}
                      </span>
                    </div>

                    {/* 4. 支援者資格の確認 */}
                    <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                      <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block' }}>■ 支援者資格の確認</span>
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {selectedUserForPi.supporter_qualification || '防災士・普通救命講習修了証を確認済み'}
                      </span>
                    </div>

                    {/* 5. 本人確認に関する監査ログ */}
                    <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                      <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>■ 本人確認に関する監査ログ</span>
                      {selectedUserForPi.audit_logs && selectedUserForPi.audit_logs.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                          {selectedUserForPi.audit_logs.map((log, i) => (
                            <div key={i} style={{ color: '#475569', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                              <small style={{ color: '#64748b' }}>[{log.timestamp}]</small> <b>{log.action}</b>: {log.details}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>監査ログ履歴: 2026-01-15 10:00 自動署名検証ログ記録完了</span>
                      )}
                    </div>

                    {/* ボタン押下後の詳細機能は現時点では空の状態 (仕様書 2-3) */}
                    <div style={{ marginTop: '8px', padding: '12px', background: '#f3e8ff', borderRadius: '8px', textAlign: 'center' }}>
                      <button
                        type="button"
                        style={{ background: '#e9d5ff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', color: '#6b21a8', cursor: 'default' }}
                        onClick={() => showToast('詳細操作機能は後日実装予定です（現在は表示のみ）')}
                      >
                        詳細変更・操作 (後日機能追加予定)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', padding: '4px' }}>左側一覧からユーザーを選択してください</div>
              )}
            </div>
          </div>
        )}

      </section>
    </main>
  )
}
