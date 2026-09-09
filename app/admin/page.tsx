'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Check, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { PREFECTURES, getCitiesByPrefecture } from '@/lib/cities'
import { getDisasterLevels, saveDisasterLevel, DisasterLevelItem } from '@/lib/store'

export default function AdminPage() {
  const [levels, setLevels] = useState<DisasterLevelItem[]>([])
  const [openPref, setOpenPref] = useState<string | null>('鳥取県')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setLevels(getDisasterLevels())
  }, [])

  const handleLevelChange = (pref: string, city: string, level: number) => {
    const updated = saveDisasterLevel(pref, city, level)
    setLevels(updated)
    setNotice(`${pref} ${city} の災害レベルを Lv.${level} に変更しました`)
    setTimeout(() => setNotice(''), 2500)
  }

  const getLevelForCity = (pref: string, city: string): number => {
    const found = levels.find(l => l.prefecture === pref && l.city === city)
    return found ? found.level : 0
  }

  return (
    <main className="standalone-page">
      <header className="standalone-header">
        <Link href="/" className="icon-button" aria-label="ホームへ戻る">
          <ArrowLeft size={20} />
        </Link>
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={21} />
          </span>
          <span>
            <strong>管理者コンソール</strong>
            <small>地域別災害レベル管理</small>
          </span>
        </div>
      </header>

      <section className="standalone-content">
        <div className="content-head">
          <div>
            <p className="eyebrow">地域安全管理</p>
            <h1>市区町村別 災害レベル設定</h1>
          </div>
        </div>

        <div className="admin-intro-box" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
            <AlertTriangle size={20} color="#eab308" />
            <strong style={{ fontSize: '15px' }}>災害レベル設定基準（市区町村単位）</strong>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
            ・<b>Lv.0</b>：未設定/通常状態（投稿・支援可能）<br />
            ・<b>Lv.1</b>：通常支援可能<br />
            ・<b>Lv.2</b>：警戒地域（投稿・支援可能）<br />
            ・<b>Lv.3</b>：危険地域（物資投稿・支援開始の利用を<b>自動停止</b>）<br />
            ※ 未選択の地域はデフォルトで <b>Lv.0</b> となります。
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
                    fontSize: '16px',
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
                            <span style={{ fontWeight: 500 }}>□ {cityInfo.city}</span>
                            {currentLevel === 3 && (
                              <span style={{ fontSize: '12px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                                Lv.3 危険停止中
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
                              <option value={0}>Lv.0 (デフォルト)</option>
                              <option value={1}>Lv.1 (通常)</option>
                              <option value={2}>Lv.2 (注意)</option>
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
      </section>

      {notice && (
        <div className="toast">
          <Check size={17} /> {notice}
        </div>
      )}
    </main>
  )
}
