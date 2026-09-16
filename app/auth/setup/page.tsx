'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile, saveUserProfile } from '@/lib/store'
import { PREFECTURES, getCitiesByPrefecture } from '@/lib/cities'
import { UserRole } from '@/lib/types'
import { Check, ArrowRight } from 'lucide-react'

export default function AuthSetupPage() {
  const router = useRouter()
  const [user, setUser] = useState(getUserProfile())
  const [name, setName] = useState(user.name || '')
  const [role, setRole] = useState<UserRole>(user.user_role || 'victim')
  const [selectedPref, setSelectedPref] = useState(user.disaster_prefecture || '鳥取県')
  const [selectedCity, setSelectedCity] = useState(user.disaster_city || '米子市')
  const [error, setError] = useState('')

  useEffect(() => {
    const current = getUserProfile()
    setUser(current)
    setName(current.name || '')
    setRole(current.user_role || 'victim')
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('公開表示名を入力してください')
      return
    }

    saveUserProfile({
      name: name.trim(),
      user_role: role,
      disaster_prefecture: selectedPref,
      disaster_city: selectedCity,
      is_demo: false,
    })

    router.push('/')
  }

  const availableCities = getCitiesByPrefecture(selectedPref)

  return (
    <main className="auth-page" style={{ background: '#f8fafc', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '20px' }}>
      <section className="auth-card" style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '20px', padding: '36px 28px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <p className="eyebrow" style={{ color: '#0284c7', fontWeight: 700, fontSize: '12px' }}>初回アカウント設定</p>
        <h1 style={{ fontSize: '24px', margin: '4px 0 12px', color: '#0f172a' }}>プロフィールと地域を登録</h1>
        <p className="auth-lead" style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
          明日の環で利用する「公開表示名」「役割」「登録地域」を設定してください。（※後からいつでも変更できます）
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              表示名（ニックネーム）
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：あすのわ太郎"
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
            <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
              ※投稿やチャットに表示されます。Google/LINEの氏名は直接公開されません。
            </small>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              あなたの立場・役割
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                style={{
                  padding: '10px 4px',
                  borderRadius: '8px',
                  border: role === 'victim' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: role === 'victim' ? '#f0f9ff' : '#ffffff',
                  color: role === 'victim' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => setRole('victim')}
              >
                被災者
              </button>
              <button
                type="button"
                style={{
                  padding: '10px 4px',
                  borderRadius: '8px',
                  border: role === 'supporter' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: role === 'supporter' ? '#f0f9ff' : '#ffffff',
                  color: role === 'supporter' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => setRole('supporter')}
              >
                支援者
              </button>
              <button
                type="button"
                style={{
                  padding: '10px 4px',
                  borderRadius: '8px',
                  border: role === 'both' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: role === 'both' ? '#f0f9ff' : '#ffffff',
                  color: role === 'both' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => setRole('both')}
              >
                共助 (双方)
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              お住まい・登録地域
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
          </div>

          {error && <p style={{ color: '#e11d48', fontSize: '12px', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            className="primary-button full"
            style={{ padding: '12px', justifyContent: 'center', fontWeight: 700, marginTop: '8px' }}
          >
            登録して利用を開始する <ArrowRight size={16} />
          </button>
        </form>
      </section>
    </main>
  )
}
