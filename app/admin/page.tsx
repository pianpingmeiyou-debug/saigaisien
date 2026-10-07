'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ShieldCheck, Check, AlertTriangle, ChevronDown, ChevronRight,
  Trash2, X, Users, Flag, Lock, Unlock, Eye, RefreshCw, Power, UserCheck, Shield, FileText, Search
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

  // 管理者種別（一般運営管理者 / 個人情報管理者）
  const [adminMode, setAdminMode] = useState<'general' | 'personal'>('general')

  // 一般運営管理者内のサブタブ
  const [activeTab, setActiveTab] = useState<'disaster' | 'reports' | 'users' | 'system'>('disaster')

  // システム全面停止状態
  const [isSystemStopped, setIsSystemStopped] = useState(false)

  const [levels, setLevels] = useState<DisasterLevelItem[]>([])
  
  // 26-2, 26-3 災害レベル設定での都道府県絞り込み検索状態
  const [disasterFilterPref, setDisasterFilterPref] = useState<string>('すべて')
  const [disasterFilterLevel, setDisasterFilterLevel] = useState<string>('すべて')

  const [reports, setReports] = useState<ReportItem[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [notice, setNotice] = useState('')

  // 24-2: 個人情報管理者の折り畳み式開閉フラグ
  const [isPersonalConsoleOpen, setIsPersonalConsoleOpen] = useState(true)
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

  const handleToggleSystemStop = () => {
    const nextState = !isSystemStopped
    saveSystemStopped(nextState)
    setIsSystemStopped(nextState)
    showToast(nextState ? 'システムを全面停止しました' : 'システムの全面停止を解除し、サービスを再開しました')
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
            管理者専用ページは、管理者権限を持つユーザーのみアクセス可能です。
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

  // 26-2, 26-3 都道府県・レベル絞り込み処理
  const filteredPrefectures = PREFECTURES.filter(pref => {
    if (disasterFilterPref !== 'すべて' && pref !== disasterFilterPref) return false
    if (disasterFilterLevel !== 'すべて') {
      const cities = getCitiesByPrefecture(pref)
      const targetLvl = Number(disasterFilterLevel)
      const hasCity = cities.some(c => getLevelForCity(pref, c.city) === targetLvl)
      if (!hasCity) return false
    }
    return true
  })

  return (
    <main className="standalone-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      {notice && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#ffffff', padding: '10px 20px', borderRadius: '20px', fontSize: '13px', zIndex: 9999 }}>
          {notice}
        </div>
      )}

      {/* 25-1, 25-2: 画面左上の戻る矢印で通常画面へ戻れる */}
      <header className="standalone-header" style={{ padding: '12px 16px' }}>
        <Link href="/" className="icon-button" aria-label="通常画面へ戻る" title="通常画面へ戻る">
          <ArrowLeft size={20} />
        </Link>
        <div className="brand">
          <span className="brand-mark" style={{ background: '#0284c7', color: 'white' }}>
            <ShieldCheck size={21} />
          </span>
          <span>
            <strong>管理者コンソール</strong>
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
          通常モードに戻る
        </button>
      </header>

      <section className="standalone-content" style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px' }}>

        {/* 管理者モード切り替え */}
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
            }}
          >
            <UserCheck size={22} style={{ color: adminMode === 'personal' ? '#7c3aed' : '#64748b' }} />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ fontSize: '16px', display: 'block' }}>個人情報管理者</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>機密個人情報管理（折り畳み対応）</span>
            </div>
          </button>
        </div>

        {/* 一般運営管理者 UI */}
        {adminMode === 'general' && (
          <div>
            {isSystemStopped && (
              <div style={{ background: '#fef2f2', border: '2px solid #ef4444', color: '#991b1b', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Power size={22} style={{ color: '#ef4444' }} />
                  <div>
                    <strong style={{ fontSize: '15px' }}>現在、システムは全面停止中（一時停止モード）です</strong>
                  </div>
                </div>
                <button className="danger-button" onClick={handleToggleSystemStop}>
                  停止を解除しサービス再開
                </button>
              </div>
            )}

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
                システム全面停止設定
              </button>
            </div>

            {/* 26. 災害レベル設定 ＋ 都道府県絞り込み検索機能 */}
            {activeTab === 'disaster' && (
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '18px', margin: '0 0 8px', color: '#0f172a' }}>全国都道府県・市区町村の災害レベル設定</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                  市区町村単位で災害レベルを管理します。レベル3では一時的に物資マッチングがロックされます。
                </p>

                {/* 26-2, 26-3 都道府県・レベル絞り込みUI */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={16} color="#0284c7" />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>都道府県で絞り込み:</span>
                    <select
                      value={disasterFilterPref}
                      onChange={(e) => setDisasterFilterPref(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="すべて">すべての都道府県</option>
                      {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>災害レベルで絞り込み:</span>
                    <select
                      value={disasterFilterLevel}
                      onChange={(e) => setDisasterFilterLevel(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="すべて">すべてのレベル</option>
                      <option value="3">レベル3 (避難指示/ロック)</option>
                      <option value="2">レベル2 (警戒)</option>
                      <option value="1">レベル1 (注意)</option>
                      <option value="0">レベル0 (平時)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredPrefectures.length === 0 ? (
                    <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
                      指定した絞り込み条件に一致する都道府県・市区町村は見つかりませんでした。
                    </div>
                  ) : (
                    filteredPrefectures.map((pref) => {
                      const cities = getCitiesByPrefecture(pref)
                      return (
                        <div key={pref} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: '100%', padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '15px' }}>
                            {pref} ({cities.length}市区町村)
                          </div>
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
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* 通報管理 */}
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
                        {u.account_status === 'frozen' ? ' 凍結解除' : ' アカウント凍結'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* システム全面停止設定 */}
            {activeTab === 'system' && (
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Power size={24} style={{ color: isSystemStopped ? '#ef4444' : '#16a34a' }} />
                  <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>システム全面停止機能</h2>
                </div>

                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                  誤情報（デマ）の拡散防止およびシステム確認のため、サービス全体を一時的に全面停止します。
                </p>

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

        {/* 24-2: 個人情報管理者コンソール (折り畳み式・開閉可能) */}
        {adminMode === 'personal' && (
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {/* 24-2: 開閉アコーディオンヘッダー */}
            <button
              type="button"
              onClick={() => setIsPersonalConsoleOpen(!isPersonalConsoleOpen)}
              style={{
                width: '100%',
                padding: '18px 24px',
                background: '#f5f3ff',
                border: 'none',
                borderBottom: isPersonalConsoleOpen ? '1px solid #e9d5ff' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={22} style={{ color: '#7c3aed' }} />
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '16px', color: '#581c87', display: 'block' }}>個人情報管理者コンソール</strong>
                  <span style={{ fontSize: '12px', color: '#6b21a8' }}>クリックで折り畳み / 開閉</span>
                </div>
              </div>
              {isPersonalConsoleOpen ? <ChevronDown size={20} color="#7c3aed" /> : <ChevronRight size={20} color="#7c3aed" />}
            </button>

            {/* 折り畳みコンテンツ */}
            {isPersonalConsoleOpen && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  {/* ユーザー選択 */}
                  <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                    <strong style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '8px' }}>対象ユーザー選択:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
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
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{u.disaster_city || '未設定'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 個人情報管理データ */}
                  {selectedUserForPi ? (
                    <div style={{ background: '#faf5ff', padding: '20px', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                      <h3 style={{ fontSize: '16px', margin: '0 0 16px', color: '#581c87', borderBottom: '1px solid #d8b4fe', paddingBottom: '8px' }}>
                        個人情報管理データ ({selectedUserForPi.name})
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                          <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block' }}>■ 本人確認状況</span>
                          <strong style={{ fontSize: '14px', color: selectedUserForPi.is_verified ? '#15803d' : '#b91c1c' }}>
                            {selectedUserForPi.is_verified ? '本人確認完了' : '未確認'}
                          </strong>
                        </div>

                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                          <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block' }}>■ 本人確認日時</span>
                          <span style={{ fontSize: '13px', color: '#334155' }}>
                            {selectedUserForPi.verified_at ? new Date(selectedUserForPi.verified_at).toLocaleString() : '記録なし'}
                          </span>
                        </div>

                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                          <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block' }}>■ 本人確認方法</span>
                          <span style={{ fontSize: '13px', color: '#334155' }}>
                            {selectedUserForPi.verified_method || 'マイナンバーカード公的認証'}
                          </span>
                        </div>

                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                          <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 'bold', display: 'block' }}>■ 支援者資格の確認</span>
                          <span style={{ fontSize: '13px', color: '#334155' }}>
                            {selectedUserForPi.supporter_qualification || '防災士講習修了証確認済み'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', padding: '20px' }}>ユーザーを選択してください</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </section>
    </main>
  )
}
